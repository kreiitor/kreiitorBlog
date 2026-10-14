import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const offline=process.argv.includes('--offline');
const directory=offline?'.artifacts/warm-garden/final-review':'.artifacts/warm-garden/review';await mkdir(directory,{recursive:true});
const base=process.env.PREVIEW_URL??'http://localhost:4321/';
const reports=[];
for(const width of [1440,390]) {
 const page=await browser.newPage({viewport:{width,height:1000}});
 for(const [name,route] of [['home',''],['blog','blog/'],['notes','notes/'],['series','notes/ai-agent/'],['project','projects/'],['about','about/'],['tags','tags/'],['archive','archive/'],['math','blog/fods-linear-algebra-calculus-convexity/']]) {
  await page.goto(new URL(route,base).href);await page.evaluate(()=>document.fonts.ready);
  if(name!=='math') { await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=800){scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,60));}scrollTo(0,0);}); }
  await page.waitForTimeout(700);
  if(name==='home')await page.screenshot({path:`${directory}/home-first-${width}.png`});
  await page.screenshot({path:`${directory}/${name}-${width}.png`,fullPage:name!=='math'});
  if(name==='math') {
   const data=await page.evaluate(()=>{
    const displays=[...document.querySelectorAll('.article-body .katex-display')];
    return {inlineScrollers:[...document.querySelectorAll('.article-body .katex:not(.katex-display .katex)')].filter(e=>getComputedStyle(e).overflowX==='auto').length,
     normalWithScroll:displays.filter(e=>e.querySelector(':scope > .katex').getBoundingClientRect().width<e.clientWidth-20&&e.scrollWidth>e.clientWidth+1).length,
     pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
   }); reports.push({width,...data});
  }
 }
 if(!offline){
 await page.goto(new URL('blog/uv-package-manager-guide/',base).href);
 await page.locator('.comments-panel').scrollIntoViewIfNeeded();
 await page.waitForTimeout(20000);
 const frame=page.frames().find(frame=>frame.url().startsWith('https://giscus.app/'));
 let frameText='';try{frameText=await frame?.locator('body').innerText({timeout:5000})??'';}catch{}
 reports.push({width,commentStatus:await page.locator('[data-comment-status]').innerText(),frameUrl:frame?.url(),frameText:frameText.slice(0,1800)});
 await page.screenshot({path:`${directory}/comments-${width}.png`});
 if(frame&&width===1440){
  const theme=await readFile('public/giscus-garden.css','utf8');
  await page.route(/https:\/\/kreiitor\.github\.io\/.*giscus-garden\.css/,route=>route.fulfill({contentType:'text/css',body:theme,headers:{'access-control-allow-origin':'*'}}));
  const themeUrl='https://kreiitor.github.io/kreiitorBlog/giscus-garden.css';
  await page.locator('#giscus-container iframe').evaluate((element,url)=>element.contentWindow.postMessage({giscus:{setConfig:{theme:url}}},'https://giscus.app'),themeUrl);
  await page.waitForTimeout(2500);
  reports.push({themePreviewIntercepted:true,iframePaper:await frame.locator('main').evaluate(e=>getComputedStyle(e).getPropertyValue('--color-canvas-default'))});
  await page.screenshot({path:`${directory}/comments-garden-theme.png`});
 }
 }
 await page.goto(new URL('',base).href);await page.locator('[data-search-link]').click();await page.getByRole('searchbox').fill('线性模型');
 await page.locator('.search-result').first().waitFor();await page.screenshot({path:`${directory}/search-${width}.png`});
 await page.close();
}
await writeFile(`${directory}/inspection.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));await browser.close();
