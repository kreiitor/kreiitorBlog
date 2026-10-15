import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(await readFile(path.join(root, 'src/data/cover-catalog.json'), 'utf8'));
const families = { article: '文章', series: '学习专题', project: '项目' };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const ids = new Set();
for (const item of catalog) {
 if (Object.keys(item).sort().join(',') !== 'description,family,id,label' ||
     !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || !Object.hasOwn(families, item.family) ||
     typeof item.label !== 'string' || !item.label.trim() || typeof item.description !== 'string' || !item.description.trim() || ids.has(item.id)) {
  throw new Error(`Invalid or duplicated cover catalog entry: ${JSON.stringify(item)}`);
 }
 ids.add(item.id);
}
const counts = Object.fromEntries(Object.keys(families).map(family => [family, catalog.filter(item => item.family === family).length]));
const cards = await Promise.all(catalog.map(async item => {
 const svg = await readFile(path.join(root, `public/covers/${item.id}.svg`));
 const image = `data:image/svg+xml;base64,${svg.toString('base64')}`;
 const reference = `cover: /covers/${item.id}.svg`;
 return `<article class="cover-card" data-family="${item.family}" data-search="${escape(`${item.label} ${item.description} ${item.id}`)}">
  <img src="${image}" alt="${escape(item.label)}封面预览" width="800" height="420" loading="lazy"/>
  <div class="card-body"><div class="card-heading"><h2>${escape(item.label)}</h2><span class="family">${families[item.family]}</span></div>
  <p class="description">${escape(item.description)}</p>
  <div class="reference"><input id="ref-${item.id}" type="text" readonly spellcheck="false" aria-label="${escape(item.label)}的封面引用" value="${escape(reference)}"/><button type="button" class="copy" aria-label="复制${escape(item.label)}封面引用" data-copy="ref-${item.id}">复制</button></div>
  <p class="asset-id">${escape(item.id)}</p></div>
 </article>`;
}));
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>封面选图册 · kreiitor</title>
<style>
 :root { color-scheme:light; --paper:#f6f3eb; --surface:#fbf9f3; --ink:#33362e; --muted:#5b6154; --sage:#55624b; --clay:#9e5130; --line:#d8d6c5; }
 * { box-sizing:border-box; } [hidden] { display:none!important; }
 body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.7 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif; }
 button,input { font:inherit; } button { cursor:pointer; } button,input { color:inherit; } button:focus-visible,input:focus-visible,a:focus-visible { outline:2px solid var(--clay); outline-offset:4px; }
 .skip { position:absolute; left:24px; top:-80px; padding:8px 16px; background:var(--ink); color:var(--paper); z-index:5; } .skip:focus { top:12px; }
 .page { max-width:1344px; padding:64px 40px 36px; margin:auto; }
 header { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:end; padding-bottom:36px; border-bottom:1px solid var(--line); }
 .eyebrow { margin:0 0 18px; font-size:11px; letter-spacing:.18em; color:var(--sage); }
 h1 { margin:0; font:normal clamp(29px,3.5vw,44px)/1.4 Georgia,"Songti SC",SimSun,serif; letter-spacing:.02em; }
 .lead { margin:18px 0 0; max-width:650px; color:var(--muted); line-height:1.9; font-size:14px; }
 .edition { text-align:right; color:var(--sage); font-size:12px; white-space:nowrap; } .edition strong { display:block; font:normal 52px/1.2 Georgia,serif; color:var(--ink); }
 .toolbar { display:flex; flex-wrap:wrap; gap:20px; align-items:center; justify-content:space-between; padding:30px 0 18px; }
 .filters { display:flex; flex-wrap:wrap; gap:7px; } .filters button { border:1px solid transparent; border-radius:5px; background:transparent; color:var(--muted); padding:7px 12px; font-size:13px; }
 .filters button[aria-pressed="true"] { border-color:var(--sage); background:var(--sage); color:var(--surface); } .filters button:hover { border-color:var(--sage); }
 .filters span { margin-left:7px; opacity:.78; font-size:11px; }
 .search { display:flex; align-items:center; gap:12px; font-size:13px; color:var(--muted); } .search input { width:260px; max-width:100%; border:1px solid var(--line); border-radius:5px; background:var(--surface); padding:9px 12px; font-size:13px; }
 .status-row { display:flex; justify-content:space-between; gap:16px; min-height:28px; margin-bottom:18px; color:var(--muted); font-size:12px; } #copy-status { color:var(--clay); }
 .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:24px; }
 .cover-card { border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--surface); }
 .cover-card img { display:block; width:100%; height:auto; aspect-ratio:800/420; border-bottom:1px solid var(--line); }
 .card-body { padding:21px 22px 17px; } .card-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; } h2 { margin:0; font-size:17px; font-weight:550; letter-spacing:.02em; }
 .family { flex-shrink:0; font-size:11px; color:var(--sage); border-bottom:1px solid var(--line); padding-bottom:2px; }
 .description { min-height:48px; margin:12px 0 19px; color:var(--muted); font-size:13px; line-height:1.85; }
 .reference { display:flex; border:1px solid var(--line); border-radius:4px; overflow:hidden; background:var(--paper); }
 .reference:focus-within { outline:2px solid var(--clay); outline-offset:3px; } .reference input { min-width:0; width:100%; border:0; background:transparent; padding:10px 9px; font:11px/1.6 Consolas,"SFMono-Regular",monospace; outline:none; }
 .reference input:focus-visible { outline:none; } .copy { flex-shrink:0; min-width:60px; border:0; border-left:1px solid var(--line); background:transparent; padding:8px 10px; font-size:12px; color:var(--sage); } .copy:hover { background:#eeede4; } .copy:focus-visible { outline-offset:-3px; }
 .asset-id { margin:12px 0 0; font:10px/1.5 Consolas,monospace; letter-spacing:.015em; color:var(--muted); }
 .empty { padding:72px 24px; text-align:center; border:1px dashed var(--line); border-radius:8px; color:var(--muted); }
 footer { display:flex; flex-wrap:wrap; gap:12px 28px; justify-content:space-between; margin-top:42px; padding-top:22px; border-top:1px solid var(--line); font-size:12px; color:var(--muted); } code { font-family:Consolas,monospace; }
 @media(max-width:1050px) { .grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .toolbar { align-items:flex-start; } }
 @media(max-width:620px) { .page { padding:34px 20px 24px; } header { grid-template-columns:1fr; gap:20px; padding-bottom:26px; } .edition { display:none; } .lead { font-size:13px; } .grid { grid-template-columns:1fr; gap:20px; } .toolbar { gap:16px; padding-top:22px; } .filters { gap:3px; } .filters button { padding:7px 9px; } .search { width:100%; } .search input { flex:1; width:0; } .status-row { display:block; } #copy-status { display:block; margin-top:5px; } }
</style></head><body>
<a class="skip" href="#covers">跳到封面列表</a><div class="page">
<header><div><p class="eyebrow">KREIITOR / COVER STUDIES</p><h1>为下一篇，选一张封面。</h1><p class="lead">统一纸色，各有题意。为文章、学习专题与项目准备的 ${catalog.length} 张插画，图片已内嵌，可直接离线挑选。复制引用后，粘贴到内容的 frontmatter。</p></div><div class="edition"><strong>${String(catalog.length).padStart(2,'0')}</strong>张原创主题封面<br/>800 × 420 · SVG + PNG</div></header>
<div class="toolbar"><div class="filters" role="group" aria-label="按用途筛选"><button type="button" data-filter="all" aria-pressed="true">全部<span>${catalog.length}</span></button>${Object.entries(families).map(([family,label])=>`<button type="button" data-filter="${family}" aria-pressed="false">${label}<span>${counts[family]}</span></button>`).join('')}</div><label class="search">查找封面<input id="search" type="search" placeholder="主题、用途或文件名" autocomplete="off"/></label></div>
<div class="status-row"><span id="result-status" role="status" aria-live="polite">显示 ${catalog.length} / ${catalog.length} 张</span><span id="copy-status" role="status" aria-live="polite"></span></div>
<main id="covers" tabindex="-1"><div class="grid">${cards.join('\n')}</div><p class="empty" id="empty" hidden>没有找到匹配的封面，试试其他关键词或用途。</p></main>
<footer><span>封面选图册 · 仅供作者维护</span><span>修改元数据后运行 <code>node scripts/prepare-cover-catalog.mjs</code> 更新此册。</span></footer>
</div><script>
 const cards = [...document.querySelectorAll('.cover-card')];
 const filters = [...document.querySelectorAll('[data-filter]')];
 const search = document.getElementById('search');
 const resultStatus = document.getElementById('result-status');
 const copyStatus = document.getElementById('copy-status');
 let family = 'all';
 function update() {
  const query = search.value.trim().normalize('NFKC').toLowerCase();
  let count = 0;
  for (const card of cards) {
   const visible = (family === 'all' || card.dataset.family === family) && card.dataset.search.normalize('NFKC').toLowerCase().includes(query);
   card.hidden = !visible;
   if (visible) count += 1;
  }
  resultStatus.textContent = '显示 ' + count + ' / ' + cards.length + ' 张';
  document.getElementById('empty').hidden = count > 0;
 }
 filters.forEach(button => button.addEventListener('click', () => {
  family = button.dataset.filter;
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  update();
 }));
 search.addEventListener('input', update);
 document.querySelectorAll('[data-copy]').forEach(button => {
  let resetTimer;
  button.addEventListener('click', async () => {
  const field = document.getElementById(button.dataset.copy);
  try {
   if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(field.value);
   button.textContent = '已复制';
   copyStatus.textContent = '已复制：' + field.value;
  } catch {
   field.focus();
   field.select();
   field.setSelectionRange(0, field.value.length);
   button.textContent = '已选中';
   copyStatus.textContent = '已选中引用文本，请按 Ctrl+C（Mac 为 ⌘C）复制。';
  }
   clearTimeout(resetTimer);
   resetTimer = setTimeout(() => { button.textContent = '复制'; }, 2200);
  });
 });
</script></body></html>`;
const output = path.join(root, 'docs/cover-catalog.html');
await writeFile(output, html);
console.log(`Prepared the offline cover catalog with ${catalog.length} embedded covers: ${output}`);
