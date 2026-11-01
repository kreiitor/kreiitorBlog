#!/usr/bin/env node
// 插图与文字的“机器味”体检：只报告，不修改。
// 用法：node scripts/check-style.mjs [--strict] [--verbose]
// --strict 时有问题就退出 1，可挂到 CI。

import fs from 'node:fs';
import path from 'node:path';

const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const contentDirs = ['src/content/posts', 'src/content/series', 'src/content/projects'];
const figDir = 'public/figures';
const FONT_SIZES = new Set(['12.5', '10.5', '9.5']);

// 画布几何：插图规范固定宽 800，高 200–450。规则里的“居中”“底部”都按 viewBox 算，不写死坐标。
function canvas(svg) {
  const box = svg.match(/viewBox="\s*([\d.-]+)[\s,]+([\d.-]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
  return box ? {x: +box[1], y: +box[2], width: +box[3], height: +box[4]} : null;
}
const texts = (svg) => [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map((m) => ({
  attrs: m[1],
  body: m[2].trim(),
  x: Number(m[1].match(/\bx="([\d.-]+)"/)?.[1] ?? NaN),
  y: Number(m[1].match(/\by="([\d.-]+)"/)?.[1] ?? NaN),
  centered: /text-anchor="middle"/.test(m[1]),
}));

const figureRules = [
  {id: 'canvas-size', hint: '画布不是 800 宽、200–450 高', test: (_s, c) => !c || c.width !== 800 || c.height < 200 || c.height > 450},
  {id: 'font-size', hint: '字号只用 12.5 / 10.5 / 9.5', test: (s) => [...s.matchAll(/font-size(?:="|:\s*)([\d.]+)/g)].some((m) => !FONT_SIZES.has(m[1]))},
  {id: 'canvas-title', hint: '画布内大标题：图题交给 figcaption', test: (s) => /font-size="(?:1[4-9]|2\d)(?:\.\d+)?"[^>]*>[^<]+<\/text>/.test(s) || /class="title"/.test(s)},
  {id: 'subtitle', hint: '居中副标题：和第一段图注重复', test: (s, c) => c && texts(s).some((t) => t.centered && Math.abs(t.x - (c.x + c.width / 2)) < 8 && t.y - c.y < 70 && t.body.length >= 8)},
  {id: 'bullet-list', hint: '• 列表当图：多半该写成表格或正文', test: (s) => (s.match(/>\s*•/g) || []).length >= 3},
  {id: 'circled-number', hint: '①②③ 装饰性编号：除非正文按序号引用', test: (s) => /[①②③④⑤⑥⑦⑧]/.test(s)},
  {id: 'box-heavy', hint: '满屏等大矩形：没有几何关系，只有卡片', test: (s) => (s.match(/<rect/g) || []).length >= 10 && (s.match(/<path/g) || []).length <= 2},
  {id: 'text-heavy', hint: '图上文字超过 320 字：该拆图或改正文', test: (s) => texts(s).reduce((a, t) => a + t.body.length, 0) > 320},
  {id: 'inside-summary', hint: '底部总结句：图注已经承担了这件事', test: (s, c) => c && texts(s).some((t) => c.y + c.height - t.y < 40 && t.body.length >= 12)},
];

const proseRules = [
  {id: 'meta-note', re: /这里(补充|复算|补算|整理|特意|明确指出)|（这里补充|图内|图侧|图底/g, hint: '编辑过程/出处交代：直接陈述事实'},
  {id: 'ai-connector', re: /换句话说|值得注意的是|一句话总结|这就解释了|这解释了|本质上就是/g, hint: '套话连接词：删掉后句子通常更清楚'},
];

// public/figures 在新克隆里可能还没有插图；目录不存在时按空处理，不让体检崩溃。
function walk(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((ext) => p.endsWith(ext))) out.push(p);
  }
  return out;
}

const figures = walk(figDir, ['.svg']);
const canvases = new Map();
const report = Object.fromEntries(figureRules.map((rule) => [rule.id, []]));
for (const f of figures) {
  const s = fs.readFileSync(f, 'utf8');
  const c = canvas(s);
  canvases.set('/' + path.relative('public', f).split(path.sep).join('/'), c);
  for (const rule of figureRules) if (rule.test(s, c)) report[rule.id].push(f);
}

const documents = contentDirs.flatMap((dir) => walk(dir, ['.md', '.mdx']));
const prose = Object.fromEntries(proseRules.map((rule) => [rule.id, []]));
// 正文引用插图：<img> 必须带 width、height、alt，height 与 SVG 的 viewBox 高度一致，文件必须存在。
const references = [];
for (const p of documents) {
  const s = fs.readFileSync(p, 'utf8');
  for (const rule of proseRules) {
    const hits = s.match(rule.re);
    if (hits) prose[rule.id].push({file: p, n: hits.length});
  }
  // README 推荐相对路径 ../../figures/...，根路径 /figures/... 也接受；都归一成 /figures/...。
  for (const m of s.matchAll(/<img\b[^>]*\bsrc="(?:\.\.\/)*\/?(figures\/[^"]+)"[^>]*>/g)) {
    const tag = m[0];
    const src = '/' + m[1];
    const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const c = canvases.get(src);
    const problems = [];
    if (!canvases.has(src) && !fs.existsSync(path.join('public', src))) problems.push('文件不存在');
    for (const name of ['width', 'height', 'alt']) if (!attr(name)) problems.push(`缺 ${name}`);
    if (c && attr('height') && Number(attr('height')) !== c.height) problems.push(`height=${attr('height')}，viewBox 高 ${c.height}`);
    if (problems.length) references.push(`${p}: ${src}（${problems.join('、')}）`);
  }
}

console.log('插图体检 · 共', figures.length, '张');
for (const rule of figureRules) {
  const list = report[rule.id];
  console.log(`  ${String(list.length).padStart(3)}  ${rule.id.padEnd(15)} ${rule.hint}`);
  if (verbose && list.length) console.log('       ' + list.slice(0, 8).join('\n       '));
}
console.log(`  ${String(references.length).padStart(3)}  ${'figure-ref'.padEnd(15)} 正文引用：文件存在、带 width/height/alt、height 与 viewBox 一致`);
if (verbose && references.length) console.log('       ' + references.slice(0, 8).join('\n       '));

console.log('\n文字体检 · 共', documents.length, '篇');
for (const rule of proseRules) {
  const list = prose[rule.id];
  const total = list.reduce((a, x) => a + x.n, 0);
  console.log(`  ${String(total).padStart(3)}  ${rule.id.padEnd(15)} ${rule.hint}  (${list.length} 篇)`);
  if (verbose && list.length) console.log('       ' + list.slice(0, 8).map((x) => `${x.file} ${x.n}`).join('\n       '));
}

const failures = Object.values(report).reduce((a, l) => a + l.length, 0) + references.length + Object.values(prose).reduce((a, l) => a + l.length, 0);
if (strict && failures) {
  console.error('\n风格体检未通过：共', failures, '处。');
  process.exit(1);
}
