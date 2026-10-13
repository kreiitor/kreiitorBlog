import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fromHtml} from 'hast-util-from-html';
const root=path.resolve('dist'),pages=new Map(),failures=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else if(file.endsWith('.html')){
 const html=await readFile(file,'utf8');
 const tree=fromHtml(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,''),{fragment:false});
 const ids=new Set(),refs=[];let h1=0;
 function visit(node){if(node.type==='element'){
  if(node.tagName==='h1')h1++;
  if(node.properties?.id)ids.add(String(node.properties.id));
  if(node.properties?.className?.includes('katex-error'))failures.push(`${path.relative(root,file)}: invalid formula`);
  for(const attr of ['href','src'])if(node.properties?.[attr])refs.push(String(node.properties[attr]));
 }for(const child of node.children??[])visit(child);}
 visit(tree);
 if(h1!==1)failures.push(`${path.relative(root,file)}: expected one page H1, found ${h1}`);
 const share=html.match(/<meta property="og:image" content="([^"]+)"/);
 if(share&&share[1].endsWith('.svg'))failures.push(`${path.relative(root,file)}: SVG social preview`);
 pages.set(file,{ids,refs,html});
}}}
await walk(root);
let checked=0;
for(const [file,page]of pages){
 const relative=path.relative(root,file).split(path.sep).join('/');
 const sourcePath=relative==='index.html'?'/':relative.endsWith('/index.html')?'/'+relative.slice(0,-10):'/'+relative;
 // The build's base is present in canonical URLs, not in the on-disk folder tree.
 const base=process.env.BASE_PATH?.replace(/\/$/,'')||'';
 const pageUrl=new URL(base+sourcePath,'http://site.local');
 for(const ref of page.refs){
  let url;try{url=new URL(ref,pageUrl);}catch{continue;}
  if(url.origin!==pageUrl.origin)continue;
  checked++;
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{continue;}
  if(base&&pathname.startsWith(base+'/'))pathname=pathname.slice(base.length);
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))continue;
  try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);}catch{failures.push(`${relative}: missing ${ref}`);continue;}
  if(url.hash&&pages.has(target)){
   let fragment;try{fragment=decodeURIComponent(url.hash.slice(1));}catch{continue;}
   if(!pages.get(target).ids.has(fragment)){
    // Original full-article fragment URLs are forwarded to their static reading part.
    const legacy=pages.get(target).html.match(/(?:var|const) legacyAnchors = (\{[\s\S]*?\});/);
    let redirects={};try{redirects=JSON.parse(legacy?.[1]??'{}');}catch{}
    if(!redirects[fragment])failures.push(`${relative}: missing anchor ${ref}`);
   }
  }
 }
}
const sitemapFiles=(await readdir(root)).filter(file=>/^sitemap-\d+\.xml$/.test(file));
for(const file of sitemapFiles)if(/<loc>[^<]*\/search\/?<\/loc>/.test(await readFile(path.join(root,file),'utf8')))failures.push('Search page must not appear in sitemap');
if(failures.length){console.error(failures.slice(0,30).join('\n'));process.exitCode=1;}else console.log(`Site checks passed: ${pages.size} HTML pages, ${checked} local references, one H1 per page and no formula errors.`);
