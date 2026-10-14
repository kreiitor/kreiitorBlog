#!/usr/bin/env node
// scripts/check-external-links.mjs —— 外部链接（外链）腐烂检测
//
// 【为什么必须要有这个脚本】
// 外链会腐烂，而且是高比例腐烂。对一份收录 1406 个中文独立博客的清单做实测，
// 其中 424 个（约 30%）外链已经失效。任何依赖外链长期有效的功能——友链、参考
// 文献、awesome 清单、引用来源——都必须配机器校验，否则腐烂是静默发生的：没有
// 任何东西会报错，只有读者点到死链时才知道。该清单采用的判定口径是「明确错误
// （404、证书错误）持续 1 天即标记；其他错误持续 7 天即标记」，即把“确定坏了”
// 和“可能只是抖动/反爬”分开。本脚本按同一口径分类输出（dead / server / botWall /
// network），便于人工或后续流程按持续时间做标记决策，而不是把一次性抖动误判成腐烂。
//
// 【为什么只能用 Node 的 fetch / https，绝不调用 curl 或任何外部命令行工具】
// 本机 Windows 的 schannel TLS 栈是坏的：curl.exe 与 Invoke-WebRequest 对任何
// HTTPS 目标都报 SEC_E_NO_CREDENTIALS，握手根本走不完；而 Node 自带 OpenSSL 是通
// 的。现成证据是本仓库的 _site-research/fetch-v2.mjs——同一个脚本用 Node fetch 成
// 功抓取了几十个站点（含多次重定向与 403 回退）。因此外链探测必须、且只能走 Node
// 自己的网络栈（全局 fetch / undici）；一旦有人“顺手”把它改成 shell 调 curl，这个
// 脚本在本机会立刻全量假失败。请求头写法沿用 fetch-v2.mjs。
//
// 【判定与输出】
//   HEAD 优先，非 2xx 或传输层失败时回落 GET（很多站点对 HEAD 返回 405/403，
//   也有站点对 HEAD 错误地返回 404）。GET 只读响应头后立即取消 body，不下载正文。
//   分类：404/410 = 确定失效；5xx = 服务端问题；403/429 = 可能反爬（不等于死链）；
//   超时 / DNS / 证书 / 连接失败 = 网络或域名问题。所有分类写进 JSON 报告。
//
// 【退出码策略】
//   默认即使发现失效链接也返回 0——外链是第三方资产，让它决定 CI 成败会让流水线
//   变脆。需要严格失败时显式加 --fail-on-broken（或 --fail-on <类别列表>）。
//   本脚本刻意不接入 postbuild：网络探测不应该阻塞每一次构建。
//
// 用法：
//   node scripts/check-external-links.mjs                  # 报告 + 写 JSON，始终退出 0
//   node scripts/check-external-links.mjs --fail-on-broken # dead/server/network 存在即退出 1
//   node scripts/check-external-links.mjs --limit 20 --verbose
// 可选项见 --help。

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fromHtml } from 'hast-util-from-html';

// ---------------------------------------------------------------- 配置

const DEFAULT_TIMEOUT_MS = 15000; // 单次请求超时；默认值来自需求
const DEFAULT_CONCURRENCY = 6; // 并发上限：既不打挂对方站点，也不耗尽本机连接数
const DEFAULT_JSON = '.artifacts/external-links/report.json'; // .artifacts/ 已在 .gitignore
// 浏览器 UA：很多站点对默认 UA（undici / node-fetch）直接 403。沿用 fetch-v2.mjs。
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = {
  'user-agent': USER_AGENT,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/css;q=0.8,*/*;q=0.7',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'cache-control': 'no-cache',
  'upgrade-insecure-requests': '1',
};

// 分类口径固定，报告与退出码都基于它。
const CATEGORY_LABEL = {
  ok: '成功 (2xx)',
  dead: '确定失效 (404/410)',
  server: '服务端问题 (5xx)',
  botWall: '可能反爬 (403/429)',
  network: '网络 / 域名 / 证书',
  other: '其他状态码',
};
const CATEGORY_ORDER = ['dead', 'network', 'server', 'other', 'botWall', 'ok'];
const DEFAULT_FAIL_CATEGORIES = ['dead', 'server', 'network'];

// 正文标点被吞进 URL 的典型特征：链接在 markdown 里少了闭合符号。
// 例：https://arxiv.org/abs/2210.03629%EF%BC%89%E3%80%82... （= "）。"）
const PROSE_PUNCT = /[））。，、；：！？》」』“”‘’…—～]/u;
const CJK = /[\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/u;

// ---------------------------------------------------------------- 参数

const options = {
  timeoutMs: DEFAULT_TIMEOUT_MS,
  concurrency: DEFAULT_CONCURRENCY,
  json: DEFAULT_JSON,
  failOnBroken: false,
  failOn: null,
  limit: 0,
  quiet: false,
  verbose: false,
};

function usage(exitCode) {
  const text = `检查 dist/ 里所有外部链接是否仍然有效（Node fetch，不依赖 curl）。

用法: node scripts/check-external-links.mjs [选项]

选项:
  --timeout <ms>       单次请求超时，默认 ${DEFAULT_TIMEOUT_MS}
  --concurrency <n>    并发上限，默认 ${DEFAULT_CONCURRENCY}
  --json <path>        JSON 报告路径，默认 ${DEFAULT_JSON}；传 "" 则不写文件
  --fail-on <list>     命中这些类别时退出 1，逗号分隔：${Object.keys(CATEGORY_LABEL).join(',')}
  --fail-on-broken     等价于 --fail-on ${DEFAULT_FAIL_CATEGORIES.join(',')}
  --limit <n>          只探测前 n 个链接（按 URL 排序，便于快速冒烟）
  --quiet              不打印逐条结果
  --verbose            打印每次 HEAD/GET 尝试的细节
  --help               显示本帮助

默认退出码为 0，即使发现失效链接（外链是第三方资产，不该决定 CI 成败）。`;
  process.stdout.write(text + '\n');
  process.exit(exitCode);
}

function parseArgs(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} 缺少取值`);
      return value;
    };
    switch (arg) {
      case '--timeout':
        options.timeoutMs = Number(next());
        break;
      case '--concurrency':
        options.concurrency = Number(next());
        break;
      case '--json':
        options.json = next();
        break;
      case '--limit':
        options.limit = Number(next());
        break;
      case '--fail-on':
        options.failOn = next().split(',').map(s => s.trim()).filter(Boolean);
        break;
      case '--fail-on-broken':
        options.failOn = [...DEFAULT_FAIL_CATEGORIES];
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        usage(0);
        break;
      default:
        process.stderr.write(`未知参数: ${arg}\n`);
        usage(2);
    }
  }
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) throw new Error('--timeout 必须是正数');
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) throw new Error('--concurrency 必须是正整数');
  if (options.limit && (!Number.isInteger(options.limit) || options.limit < 1)) throw new Error('--limit 必须是正整数');
  if (options.failOn) {
    const unknown = options.failOn.filter(c => !Object.hasOwn(CATEGORY_LABEL, c));
    if (unknown.length) throw new Error(`--fail-on 含未知类别: ${unknown.join(', ')}`);
    options.failOn = options.failOn.filter(c => c !== 'ok');
    options.failOnBroken = options.failOn.length > 0;
  }
  return options;
}

// ---------------------------------------------------------------- 1. 采集 dist 里的外链

const ROOT = path.resolve('dist');
const pageLabel = file => {
  const relative = path.relative(ROOT, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return relative.endsWith('/index.html') ? `/${relative.slice(0, -'index.html'.length)}` : `/${relative}`;
};

async function collectHtmlFiles(dir, out = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await collectHtmlFiles(file, out);
    else if (file.endsWith('.html')) out.push(file);
  }
  return out;
}

// 站点自身域名：优先 SITE_URL，其次构建产物里的 canonical/og:url（astro.config 的
// site 会写进去，因此部署域名换了也不用改这里），最后退回仓库已知的默认值。
function ownHostsFrom(htmlPages) {
  const hosts = new Set();
  const add = value => {
    try {
      hosts.add(new URL(value).hostname.replace(/^www\./, '').toLowerCase());
    } catch {
      /* 忽略无法解析的值 */
    }
  };
  if (process.env.SITE_URL) add(process.env.SITE_URL);
  for (const { html } of htmlPages) {
    for (const match of html.matchAll(/<link\b[^>]*rel=["']?canonical["']?[^>]*>/gi)) {
      add((match[0].match(/href=["']([^"']+)["']/i) ?? [])[1]);
    }
    for (const match of html.matchAll(/<meta\b[^>]*property=["']?og:url["']?[^>]*>/gi)) {
      add((match[0].match(/content=["']([^"']+)["']/i) ?? [])[1]);
    }
  }
  if (!hosts.size) hosts.add('kreiitor.github.io'); // astro.config.mjs 的 site 默认值
  return hosts;
}

function normalize(raw) {
  let url;
  try {
    url = new URL(raw); // 顺带规范化默认端口、大小写等
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null; // 排除 mailto:/tel:/data:/javascript:
  url.hash = ''; // 片段不影响服务端可达性，去掉才能正确去重
  const key = `${url.origin}${url.pathname}${url.search}`;
  return { key, href: url.href, host: url.hostname.replace(/^www\./, '').toLowerCase() };
}

async function collectExternalLinks() {
  const files = await collectHtmlFiles(ROOT);
  const rawPages = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    rawPages.push({ file, html });
  }
  const ownHosts = ownHostsFrom(rawPages);

  const links = new Map(); // key -> { url, sources:Set }
  let totalAnchors = 0;
  let skippedRelative = 0; // 相对站内链接、mailto:、tel:、data: 等
  let skippedOwnHost = 0; // 绝对地址但指向本站自身域名
  for (const { file, html } of rawPages) {
    // 与 check-site.mjs 一致：先剔除 script/style，再用 hast 解析，避免正则误伤
    // （也让 &amp; 之类的实体被正确解码）。
    const tree = fromHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ''), {
      fragment: false,
    });
    const label = pageLabel(file);
    const visit = node => {
      if (node.type === 'element') {
        if (node.tagName === 'a' && node.properties?.href) {
          totalAnchors++;
          const raw = String(node.properties.href).trim();
          const normalized = normalize(raw);
          if (!normalized) skippedRelative++;
          else if (ownHosts.has(normalized.host)) skippedOwnHost++;
          else {
            const existing = links.get(normalized.key);
            if (existing) existing.sources.add(label);
            else links.set(normalized.key, { url: normalized.href, key: normalized.key, host: normalized.host, sources: new Set([label]) });
          }
        }
        for (const child of node.children ?? []) visit(child);
      } else {
        for (const child of node.children ?? []) visit(child);
      }
    };
    visit(tree);
  }
  return { files, ownHosts, links, totalAnchors, skippedRelative, skippedOwnHost };
}

// ---------------------------------------------------------------- 2. 探测

// 证书类错误只认明确的错误码：undici 在连接被重置时给出的原文是
// "Client network socket disconnected before secure TLS connection was established"，
// 里面含 "TLS"，若按文案判断会把 ECONNRESET 误判成证书问题。先判码，再退回文案。
const CERT_CODE = /^(UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT_IN_CHAIN|DEPTH_ZERO_SELF_SIGNED_CERT|CERT_HAS_EXPIRED|CERT_UNTRUSTED|CERT_NOT_YET_VALID|CERT_SIGNATURE_FAILURE|ERR_TLS_CERT_ALTNAME_INVALID|ERR_SSL_)/;
const CONN_CODE = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE', 'EPROTO',
  'UND_ERR_SOCKET', 'UND_ERR_CLOSED', 'UND_ERR_CONNECT_TIMEOUT',
]);

// 返回 { kind, label, code, message }：label 给人类看，message 保留底层原文，便于定位。
function errorFacts(err) {
  const cause = err?.cause ?? err;
  const code = cause?.code ?? err?.code ?? cause?.cause?.code ?? null;
  const message = String(cause?.message ?? err?.message ?? err).slice(0, 300);
  const name = err?.name ?? cause?.name ?? 'Error';
  const facts = (kind, label) => ({ kind, label, code, message });
  const isTimeout =
    name === 'TimeoutError' ||
    cause?.name === 'TimeoutError' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'ETIMEDOUT';
  if (isTimeout) return facts('timeout', '超时');
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return facts('dns', 'DNS 解析失败');
  if (code === 'ERR_INVALID_URL') return facts('dns', 'URL 非法');
  if (CERT_CODE.test(String(code))) return facts('tls', '证书 / TLS 错误');
  if (CONN_CODE.has(String(code))) return facts('conn', '连接失败');
  if (/CERT|_SSL_|UNABLE_TO_VERIFY|SELF_SIGNED|ALTNAME/i.test(String(code ?? ''))) return facts('tls', '证书 / TLS 错误');
  if (/certificate (has expired|is not valid)|self.signed certificate|unable to verify/i.test(message)) return facts('tls', '证书 / TLS 错误');
  if (/ECONNREFUSED|ECONNRESET|socket hang up|other side closed/i.test(message)) return facts('conn', '连接失败');
  return facts('unknown', '网络错误');
}

async function request(url, method, timeoutMs) {
  const started = Date.now();
  const response = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: HEADERS });
  const status = response.status;
  const finalUrl = response.url;
  // 只看响应头，立即释放连接，绝不下载正文（外链可能是大文件）。
  try {
    await response.body?.cancel();
  } catch {
    /* 忽略取消异常 */
  }
  return { method, status, finalUrl, elapsedMs: Date.now() - started };
}

// HEAD 优先；失败（非 2xx 或传输层错误）时回落 GET。DNS 确定解析不了就不必再 GET。
async function probe(url) {
  const attempts = [];
  let head = null;
  const started = Date.now();
  try {
    head = await request(url, 'HEAD', options.timeoutMs);
  } catch (err) {
    head = { method: 'HEAD', status: null, error: errorFacts(err), elapsedMs: Date.now() - started };
  }
  attempts.push(head);

  const headOk = typeof head.status === 'number' && head.status >= 200 && head.status < 300;
  const skipGet = head.error && head.error.kind === 'dns' && head.error.code === 'ENOTFOUND';
  if (!headOk && !skipGet) {
    const getStarted = Date.now();
    try {
      const get = await request(url, 'GET', options.timeoutMs);
      attempts.push(get);
      return finish(get, attempts);
    } catch (err) {
      const failure = { method: 'GET', status: null, error: errorFacts(err), elapsedMs: Date.now() - getStarted };
      attempts.push(failure);
      // GET 也失败：能拿到 HEAD 的状态码就用它（例如 403 反爬），否则报传输层错误。
      return typeof head.status === 'number' ? finish(head, attempts) : finish(failure, attempts);
    }
  }
  return finish(head, attempts);
}

function finish(attempt, attempts) {
  const status = attempt.status ?? null;
  let category;
  if (status === null) category = 'network';
  else if (status >= 200 && status < 300) category = 'ok';
  else if (status === 404 || status === 410) category = 'dead';
  else if (status >= 500) category = 'server';
  else if (status === 403 || status === 429) category = 'botWall';
  else category = 'other';
  return {
    category,
    status,
    method: attempt.method,
    finalUrl: attempt.finalUrl ?? null,
    error: attempt.error ?? null,
    elapsedMs: attempt.elapsedMs ?? null,
    attempts: attempts.map(a => ({
      method: a.method,
      status: a.status ?? null,
      elapsedMs: a.elapsedMs ?? null,
      error: a.error ? { kind: a.error.kind, code: a.error.code, label: a.error.label, message: a.error.message } : null,
    })),
  };
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index]);
        done++;
        if (!options.quiet && done % 10 === 0) process.stderr.write(`  … 已探测 ${done}/${items.length}\n`);
      }
    })
  );
  return results;
}

// ---------------------------------------------------------------- 3. 可疑 URL（内容里的链接写坏了）

function suspiciousInfo(url) {
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* 保留原样 */
  }
  if (PROSE_PUNCT.test(decoded)) {
    const at = decoded.search(PROSE_PUNCT);
    let suggested = null;
    try {
      // 在第一个正文标点处截断，并去掉紧邻的引号（作者的 markdown 常写成 "链接"，把
      // 闭合引号也吞进了 href）= 作者原本想写的链接。
      suggested = encodeURI(decoded.slice(0, at).replace(/["'\s]+$/, ''));
    } catch {
      suggested = null;
    }
    return { reason: 'URL 里含中文正文标点（markdown 链接把标点吞进去了）', suggested };
  }
  if (CJK.test(decoded)) return { reason: 'URL 里含中文字符（可能是正文被当成链接）', suggested: null };
  return null;
}

// ---------------------------------------------------------------- 4. 主流程

parseArgs(process.argv.slice(2)); // 直接填充上面的 options
const startedAt = Date.now();

let collected;
try {
  collected = await collectExternalLinks();
} catch (err) {
  if (err?.code === 'ENOENT') {
    process.stderr.write('找不到 dist/ 目录，请先运行 npm run build。\n');
    process.exit(2);
  }
  throw err;
}

const { files, ownHosts, links, totalAnchors, skippedRelative, skippedOwnHost } = collected;

// 空 dist 必须报错，不能报“全部通过”：astro build 会先清空 dist 再重新生成，如果正好
// 撞上构建（或在没有构建过的机器上运行），扫描结果是 0 个页面、0 个外链，脚本会顺利
// 退出 0 并宣称“全部外链可达”——这正是最危险的假阴性。宁可失败，也不要给出假绿。
if (!files.length) {
  process.stderr.write('dist/ 下没有找到任何 HTML 文件（dist 是否为空，或构建正在进行/失败？）。\n请先运行 npm run build，再执行本脚本。\n');
  process.exit(2);
}
const targets = [...links.values()].sort((a, b) => a.key.localeCompare(b.key));
const selected = options.limit ? targets.slice(0, options.limit) : targets;

console.log(`外部链接检查 —— ${new Date().toISOString()}`);
console.log(
  `源: dist/ ${files.length} 个 HTML 页面，${totalAnchors} 个 <a> 标签` +
    `（站内/相对 ${skippedRelative} 个、本站自身域名 ${skippedOwnHost} 个已排除）；` +
    `待探测外链 ${targets.length} 个（唯一 URL），域名 ${new Set(targets.map(l => l.host)).size} 个`
);
console.log(`自身域名（已排除）: ${[...ownHosts].join(', ')}`);
console.log(`参数: 并发 ${options.concurrency}，超时 ${options.timeoutMs}ms，UA=Chrome/131${options.limit ? `，--limit ${options.limit}` : ''}`);
console.log(`探测方式: HEAD，失败回落 GET（只读响应头）\n`);

const probes = await runPool(selected, options.concurrency, async link => {
  const result = await probe(link.url);
  const info = suspiciousInfo(link.url);
  return { ...link, sources: [...link.sources].sort(), suspicious: info?.reason ?? null, suggestedUrl: info?.suggested ?? null, ...result };
});

// 反查：可疑 URL 截断后的候选链接是否也在本次结果里且是好的——能直接给出修法。
const byKey = new Map(probes.map(p => [p.key, p]));
for (const result of probes) {
  if (!result.suggestedUrl) continue;
  const candidate = normalize(result.suggestedUrl);
  const known = candidate ? byKey.get(candidate.key) : null;
  result.suggestedStatus = known ? known.status : null;
  result.suggestedOk = known ? known.category === 'ok' : null;
}

const summary = { total: probes.length, ok: 0, dead: 0, server: 0, botWall: 0, network: 0, other: 0, suspicious: 0 };
for (const result of probes) {
  summary[result.category]++;
  if (result.suspicious) summary.suspicious++;
}

const symbol = { ok: '✅', dead: '❌', server: '🔥', botWall: '🛡️', network: '🌐', other: '❔' };
if (!options.quiet) {
  for (const result of probes) {
    const status = result.status === null ? result.error?.kind ?? 'ERR' : String(result.status);
    const note = result.suspicious ? `  ⚠ ${result.suspicious}` : '';
    console.log(`  ${symbol[result.category]} ${status.padStart(4)} ${result.method.padEnd(4)} ${result.url}${note}`);
    if (options.verbose) {
      for (const attempt of result.attempts) {
        const detail = attempt.error ? `${attempt.error.label}${attempt.error.code ? ` (${attempt.error.code})` : ''}: ${attempt.error.message}` : '';
        console.log(`        ↳ ${attempt.method} ${attempt.status ?? '-'} ${attempt.elapsedMs ?? '-'}ms ${detail}`);
      }
    }
  }
  console.log('');
}

console.log('== 统计 ==');
console.log(`  已探测唯一外链             ${summary.total}`);
console.log(`  ${CATEGORY_LABEL.ok.padEnd(24)} ${summary.ok}`);
console.log(`  ${CATEGORY_LABEL.dead.padEnd(24)} ${summary.dead}`);
console.log(`  ${CATEGORY_LABEL.server.padEnd(24)} ${summary.server}`);
console.log(`  ${CATEGORY_LABEL.botWall.padEnd(24)} ${summary.botWall}`);
console.log(`  ${CATEGORY_LABEL.network.padEnd(24)} ${summary.network}`);
if (summary.network) {
  const byLabel = new Map();
  for (const result of probes.filter(p => p.category === 'network')) {
    const label = result.error?.label ?? '未知';
    byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
  }
  console.log(`      └ 细分: ${[...byLabel].map(([label, count]) => `${label} ${count}`).join('，')}`);
}
console.log(`  ${CATEGORY_LABEL.other.padEnd(24)} ${summary.other}`);
console.log(`  可疑 URL（内容写坏）        ${summary.suspicious}`);

console.log('\n== 失败清单 ==');
for (const category of CATEGORY_ORDER) {
  if (category === 'ok') continue;
  const list = probes.filter(p => p.category === category);
  if (!list.length) continue;
  console.log(`\n-- ${CATEGORY_LABEL[category]}（${list.length}）--`);
  for (const result of list) {
    const detail =
      result.status === null
        ? `${result.error?.label ?? '错误'}${result.error?.code ? ` (${result.error.code})` : ''}${result.error?.message ? ` — ${result.error.message}` : ''}`
        : `HTTP ${result.status}（${result.method}）`;
    console.log(`  ${detail}  ${result.url}`);
    const shown = result.sources.slice(0, 3).join(', ');
    console.log(`      引用: ${shown}${result.sources.length > 3 ? ` 等 ${result.sources.length} 处` : ''}`);
    if (result.suspicious) {
      console.log(`      ⚠ ${result.suspicious}`);
      if (result.suggestedUrl) {
        const verdict = result.suggestedOk === true ? '该候选已检查且是好的' : result.suggestedStatus ? `该候选已检查，返回 HTTP ${result.suggestedStatus}` : '该候选未在本次检查范围内';
        console.log(`      建议改为: ${result.suggestedUrl}  （${verdict}）`);
      }
    }
  }
}
if (!probes.some(p => p.category !== 'ok')) console.log('  没有发现失败的外链。');
console.log(`\n（403/429 很可能只是反爬，不等同于死链；按清单口径应与其他错误区别对待。）`);

// ---------------------------------------------------------------- 5. 报告落盘

const report = {
  generatedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  site: {
    ownHosts: [...ownHosts],
    htmlPages: files.length,
    anchors: totalAnchors,
    relativeAnchorsExcluded: skippedRelative,
    ownHostAnchorsExcluded: skippedOwnHost,
    uniqueExternalUrls: targets.length,
  },
  options: { timeoutMs: options.timeoutMs, concurrency: options.concurrency, limit: options.limit || null, userAgent: USER_AGENT },
  summary,
  results: probes.map(p => ({ ...p, sources: p.sources })),
  failures: Object.fromEntries(CATEGORY_ORDER.filter(c => c !== 'ok').map(c => [c, probes.filter(p => p.category === c).map(p => p.url)])),
};

if (options.json) {
  const target = path.resolve(options.json);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nJSON 报告: ${path.relative(process.cwd(), target)}`);
}

// ---------------------------------------------------------------- 6. 退出码

const failing = options.failOn ? probes.filter(p => options.failOn.includes(p.category)) : [];
if (failing.length) {
  console.error(`\n--fail-on ${options.failOn.join(',')} 命中 ${failing.length} 个链接，退出码 1。`);
  process.exitCode = 1;
} else if (summary.total - summary.ok > 0) {
  console.log(`\n发现 ${summary.total - summary.ok} 个非 2xx 外链，但默认不因此失败（用 --fail-on-broken 可严格失败）。`);
} else {
  console.log('\n全部外链可达。');
}
