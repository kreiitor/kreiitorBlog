import {test,expect} from '@playwright/test';

// 使用浏览器实际渲染色，逐层合成透明背景；卡片、标签和侧栏各有不同表面色。
const measureContrast=locator=>locator.evaluateAll(nodes=>{
 const rgba=value=>{
  const values=value.match(/[\d.]+/g)?.map(Number);
  if(!values||values.length<3)throw new Error(`Unsupported computed color: ${value}`);
  return [...values.slice(0,3),values[3]??1];
 };
 const over=(front,back)=>{
  const alpha=front[3]+back[3]*(1-front[3]);
  return [...front.slice(0,3).map((value,index)=>(value*front[3]+back[index]*back[3]*(1-front[3]))/alpha),alpha];
 };
 const luminance=color=>{
  const [r,g,b]=color.slice(0,3).map(value=>{
   const c=value/255;
   return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
  });
  return .2126*r+.7152*g+.0722*b;
 };
 return nodes.filter(node=>node.getClientRects().length>0).map(node=>{
  const layers=[];
  for(let parent=node;parent;parent=parent.parentElement)layers.unshift(rgba(getComputedStyle(parent).backgroundColor));
  const background=layers.reduce((back,front)=>over(front,back),[255,255,255,1]);
  const foreground=over(rgba(getComputedStyle(node).color),background);
  const a=luminance(foreground),b=luminance(background);
  return {text:node.textContent.trim().slice(0,80),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),foreground,background};
 });
});

for(const theme of ['light','dark']) {
 test(`${theme} primary actions and small text meet AA contrast on their rendered surfaces`,async({page},info)=>{
  await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  await page.addInitScript(value=>localStorage.setItem('theme',value),theme);
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  const selectors=[
   '.hero-title',
   '.hero-bio',
   '.hero-issue',
   '.hero-stats',
   '.zen-btn-primary',
   '.zen-btn-secondary',
   '.now-head h2',
   '.now-status',
   '.now-label',
   '.now-text',
   '.now-foot',
   '.panel-head h2',
   '.home-tag-filters button',
   '.feed-time',
   '.feed-title',
   '.more',
   '.life-photo-title',
   '.life-photo-no',
   '.life-essay-meta',
   '.life-essay-card h3',
   '.life-essay-card p',
   '.monograph-vol',
   '.monograph-count',
   '.monograph-card h3',
   '.monograph-en',
   '.monograph-desc',
   '.month',
   '.latest',
   '.outro-greet',
   '.outro-desc',
   '.outro-action-label',
   '.outro-action-val',
   '.topic-row a',
  ];
  if(info.project.name==='desktop')selectors.push('.feed-tag','.feed-read');
  for(const selector of selectors) {
   const samples=await measureContrast(page.locator(selector));
   expect(samples.length,`${selector} must exercise a rendered element`).toBeGreaterThan(0);
   for(const sample of samples)expect(sample.ratio,`${theme} ${selector}: ${JSON.stringify(sample)}`).toBeGreaterThanOrEqual(4.5);
  }
  // 浏览器触屏项目不模拟 hover；桌面同时检查按钮悬浮后色彩。
  if(info.project.name==='desktop') {
   const primary=page.locator('.more').first();
   await primary.hover();
   for(const sample of await measureContrast(primary))expect(sample.ratio,`${theme} hovered primary action`).toBeGreaterThanOrEqual(4.5);
  }
 });
}
