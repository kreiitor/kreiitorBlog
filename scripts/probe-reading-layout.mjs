import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const base=process.env.PREVIEW_URL??'http://localhost:4321/';
const directory='.artifacts/warm-garden/layout-probe';await mkdir(directory,{recursive:true});
const reports=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.goto(new URL('blog/fods-linear-algebra-calculus-convexity/',base).href);await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>{
  const body=document.querySelector('.article-body');const fullHeight=body.getBoundingClientRect().height;
  let section;
  for(const child of [...body.children]){if(child.matches('h2')){section=document.createElement('section');section.className='probe-section';child.before(section);}if(section)section.append(child);}
  const sections=[...body.querySelectorAll('.probe-section')];
  const actualHeights=sections.map(e=>e.getBoundingClientRect().height);
  sections.forEach(e=>{e.style.contentVisibility='auto';e.style.containIntrinsicSize='auto 2000px';});
  const estimatedHeight=body.getBoundingClientRect().height;
  const beforeMeasure=performance.now();
  const headings=[...body.querySelectorAll('h2')].map(e=>e.getBoundingClientRect().top+scrollY);
  const measurementMs=performance.now()-beforeMeasure;
  const measuredHeight=body.getBoundingClientRect().height;
  return{fullHeight,sections:sections.length,minSectionHeight:Math.min(...actualHeights),maxSectionHeight:Math.max(...actualHeights),estimatedHeight,measuredHeight,measurementMs,headings};
 });
 reports.push({width,...result});await page.close();
}
await writeFile(`${directory}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(({headings,...r})=>r),null,2));await browser.close();
