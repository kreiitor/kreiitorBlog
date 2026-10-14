// 构建后注入标题永久链接。
//
// 为什么放在构建后，而不是写 rehype 插件：
//   @astrojs/markdown-remark/dist/index.js:76-81 显示，用户的 rehypePlugins 在
//   rehypeHeadingIds **之前**执行，因此插件里拿不到最终 heading id；
//   若要自己复刻 github-slugger 的取文本与去重逻辑，一旦有偏差就会改变 id，
//   从而破坏既有锚点 URL（外链、站内引用、阅读记忆的 localStorage 全都依赖它）。
//   在 dist 的最终 HTML 上操作，id 已是确定值 —— 不重算 slug，零 URL 风险。
//
// 另外实测：Astro 的 `<Content components={{...}} />` 覆盖只对 .mdx 生效
//   （astro/dist/content/runtime.js:449-455 明确写着 "Auto-apply MDX components export"），
//   本仓库文章是 .md，所以那条路走不通。
//
// 安全性：本脚本在 check-site.mjs 之前运行，而 check-site 会逐个校验站内锚点
//   是否指向真实存在的 id —— 注入错了会直接让构建失败。
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('dist');
// 页面标题是 h1（由 frontmatter 提供，不加锚点），正文用 h2-h4
const HEAD_OPEN = /<h([234])\b([^>]*)>/gi;
const ID_ATTR = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

const anchorFor = id =>
	`<a class="heading-anchor" href="#${id}" aria-label="链接到本节" title="链接到本节">` +
	`<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">` +
	`<path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.44"/>` +
	`<path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.3-1.3"/></svg></a>`;

function inject(html) {
	let out = '';
	let last = 0;
	let count = 0;
	HEAD_OPEN.lastIndex = 0;
	let m;
	while ((m = HEAD_OPEN.exec(html))) {
		const tag = `h${m[1]}`;
		const idMatch = m[2].match(ID_ATTR);
		if (!idMatch) continue;
		const id = idMatch[1] ?? idMatch[2] ?? idMatch[3];
		if (!id) continue;
		const closeTag = `</${tag}>`;
		const closeAt = html.toLowerCase().indexOf(closeTag, m.index + m[0].length);
		if (closeAt === -1) continue;
		// 幂等：已注入过就跳过（标题内不可能嵌套标题，所以首个闭合标签即本标题终点）
		if (html.slice(m.index + m[0].length, closeAt).includes('heading-anchor')) {
			HEAD_OPEN.lastIndex = closeAt + closeTag.length;
			continue;
		}
		out += html.slice(last, closeAt) + anchorFor(id);
		last = closeAt;
		count++;
		HEAD_OPEN.lastIndex = closeAt + closeTag.length;
	}
	if (!count) return { html, count };
	return { html: out + html.slice(last), count };
}

async function walk(dir, files = []) {
	for (const item of await readdir(dir, { withFileTypes: true })) {
		const file = path.join(dir, item.name);
		if (item.isDirectory()) await walk(file, files);
		else if (file.endsWith('.html')) files.push(file);
	}
	return files;
}

const files = await walk(ROOT);
let changedFiles = 0;
let totalAnchors = 0;
let headingsWithId = 0;
for (const file of files) {
	const html = await readFile(file, 'utf8');
	headingsWithId += [...html.matchAll(HEAD_OPEN)].filter(h => ID_ATTR.test(h[2])).length;
	const { html: next, count } = inject(html);
	if (count > 0) {
		await writeFile(file, next, 'utf8');
		changedFiles++;
		totalAnchors += count;
	}
}

if (files.length === 0) {
	console.error('标题锚点注入：dist 下没有 HTML，请先构建。');
	process.exit(2);
}
// 区分两种「0 注入」：
//   产物里压根没有带 id 的 h2-h4 → 结构变了，属于异常，必须让构建失败；
//   有标题但都已有锚点 → 说明是重复运行，幂等成功（再次跑 postbuild 不应报错）。
if (totalAnchors === 0 && headingsWithId > 0) {
	console.log(`标题锚点注入：${files.length} 个页面共 ${headingsWithId} 个标题，均已有永久链接（幂等，无变更）。`);
	process.exit(0);
}
if (headingsWithId === 0) {
	console.error(`标题锚点注入：${files.length} 个页面中未找到任何带 id 的 h2-h4，产物结构可能已变化。`);
	process.exit(1);
}
console.log(`标题锚点注入：${changedFiles}/${files.length} 个页面，共 ${totalAnchors} 个永久链接。`);
