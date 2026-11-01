import {readdir,readFile,stat} from 'node:fs/promises';
import {availableParallelism} from 'node:os';
import path from 'node:path';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {fromHtml} from 'hast-util-from-html';

// 工作线程：只负责把一批 HTML 解析成 { ids, refs, failures }。
// 解析是瓶颈（带 KaTeX 的长文单页 1–4 MB，hast 解析一页要几百毫秒），所以按页分给多个线程。
if(!isMainThread){
 const results=[];
 for(const file of workerData.files){
  const html=await readFile(file,'utf8');
  const failures=[],refs=[],ids=[];
  // 必须先剥注释再去剥 script/style：注释放首位。
  // 否则注释里若出现字面 `<script>`（例如"普通 <script> 会被提升"这类说明文字），
  // 下面的惰性正则会从注释内部开始匹配、吃掉真正的 </script>，连注释自己的 `-->` 一起删除，
  // 留下一个未闭合的 `<!--`，把整篇文档吞成注释 → 解析出空 body → 全部页面误报 "found 0 H1"。
  const tree=fromHtml(html.replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,''),{fragment:false});
  const relative=path.relative(workerData.root,file);
  let h1=0;
  const stack=[tree];
  while(stack.length){
   const node=stack.pop();
   if(node.type==='element'){
    if(node.tagName==='h1')h1++;
    if(node.properties?.id)ids.push(String(node.properties.id));
    if(node.properties?.className?.includes('katex-error'))failures.push(`${relative}: invalid formula`);
    for(const attr of ['href','src'])if(node.properties?.[attr])refs.push(String(node.properties[attr]));
   }
   if(node.children)for(let i=node.children.length-1;i>=0;i--)stack.push(node.children[i]);
  }
  if(h1!==1)failures.push(`${relative}: expected one page H1, found ${h1}`);
  const share=html.match(/<meta property="og:image" content="([^"]+)"/);
  if(share&&share[1].endsWith('.svg'))failures.push(`${relative}: SVG social preview`);
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/);
  if(share&&canonical){
   const imageUrl=new URL(share[1],canonical[1]);
   if(imageUrl.origin===new URL(canonical[1]).origin)refs.push(imageUrl.pathname);
  }
  results.push({file,ids,refs,failures});
 }
 parentPort.postMessage(results);
 process.exit(0);
}

const root=path.resolve('dist'),pages=new Map(),failures=[];
// dist 不存在就明确报错退出，而不是抛未捕获的 ENOENT。
if(!await stat(root).then(s=>s.isDirectory()).catch(()=>false)){console.error(`Site checks: ${root} does not exist — build first.`);process.exit(2);}
async function list(dir){const out=[];for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())out.push(...await list(file));else if(file.endsWith('.html'))out.push(file);}return out;}

// 按文件大小轮流分配，避免几篇超长文章挤在同一个线程里。
const files=(await Promise.all((await list(root)).map(async file=>({file,size:(await stat(file)).size})))).sort((a,b)=>b.size-a.size);
const threads=Math.max(1,Math.min(availableParallelism()-1,8,files.length));
const buckets=Array.from({length:threads},()=>[]);
files.forEach(({file},index)=>buckets[index%threads].push(file));
const batches=await Promise.all(buckets.map(bucket=>new Promise((resolve,reject)=>{
 const worker=new Worker(new URL(import.meta.url),{workerData:{root,files:bucket}});
 worker.once('message',resolve);worker.once('error',reject);
 worker.once('exit',code=>{if(code!==0)reject(new Error(`site check worker exited with ${code}`));});
})));
for(const batch of batches)for(const page of batch){pages.set(page.file,{ids:new Set(page.ids),refs:page.refs});failures.push(...page.failures);}

// dist 为空（或构建被中断）时，下面的循环会一个页面都不检查却报「通过」，
// 是危险的假阳性（并发构建或先清空 dist 时出现过）。这里显式拦住。
if (pages.size === 0) {console.error(`Site checks: found no HTML under ${root} — build first, or dist was cleared mid-run.`);process.exit(2);}
let checked=0;
// 同一个资源（字体、样式、共享图片）被上百个页面引用；每个路径只 stat 一次。
const resolved=new Map();
const resolve=target=>{if(!resolved.has(target))resolved.set(target,stat(target).then(async s=>{if(!s.isDirectory())return target;const index=path.join(target,'index.html');await stat(index);return index;}).catch(()=>null));return resolved.get(target);};
// The build's base is present in canonical URLs, not in the on-disk folder tree.
const base=process.env.BASE_PATH?.replace(/\/$/,'')||'';
for(const [file,page]of [...pages].sort(([a],[b])=>a.localeCompare(b))){
 const relative=path.relative(root,file).split(path.sep).join('/');
 const sourcePath=relative==='index.html'?'/':relative.endsWith('/index.html')?'/'+relative.slice(0,-10):'/'+relative;
 const pageUrl=new URL(base+sourcePath,'http://site.local');
 for(const ref of page.refs){
  let url;try{url=new URL(ref,pageUrl);}catch{continue;}
  if(url.origin!==pageUrl.origin)continue;
  checked++;
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{continue;}
  if(base&&pathname.startsWith(base+'/'))pathname=pathname.slice(base.length);
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))continue;
  target=await resolve(target);
  if(!target){failures.push(`${relative}: missing ${ref}`);continue;}
  if(url.hash&&pages.has(target)){
   let fragment;try{fragment=decodeURIComponent(url.hash.slice(1));}catch{continue;}
   if(!pages.get(target).ids.has(fragment))failures.push(`${relative}: missing anchor ${ref}`);
  }
 }
}
const sitemapFiles=(await readdir(root)).filter(file=>/^sitemap-\d+\.xml$/.test(file));
for(const file of sitemapFiles)if(/<loc>[^<]*\/search\/?<\/loc>/.test(await readFile(path.join(root,file),'utf8')))failures.push('Search page must not appear in sitemap');
if(failures.length){console.error(failures.slice(0,30).join('\n'));process.exitCode=1;}else console.log(`Site checks passed: ${pages.size} HTML pages, ${checked} local references, one H1 per page and no formula errors.`);
