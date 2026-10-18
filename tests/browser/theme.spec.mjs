import {test,expect} from '@playwright/test';

// 两态主题：首次按系统偏好选择并持久化，之后显式 light/dark 优先。
// 关键不变量：首帧不能闪白（颜色必须在脚本执行前后一致）。

const readTheme=page=>page.evaluate(()=>({
 dataTheme:document.documentElement.getAttribute('data-theme'),
 stored:localStorage.getItem('theme'),
 colorScheme:getComputedStyle(document.documentElement).colorScheme,
 bg:getComputedStyle(document.documentElement).backgroundColor,
 meta:document.querySelector('meta[name="theme-color"]:not([media])')?.getAttribute('content'),
 pref:document.querySelector('[data-theme-toggle]')?.getAttribute('data-pref'),
}));

const LIGHT='rgb(249, 250, 247)';
const DARK='rgb(22, 29, 44)';

for(const system of ['light','dark']) {
 test(`First visit persists the ${system} system preference`,async({page})=>{
  await page.emulateMedia({colorScheme:system});
  await page.goto('');
  const s=await readTheme(page);
  expect([s.dataTheme,s.stored,s.pref]).toEqual([system,system,system]);
  expect(s.bg).toBe(system==='dark'?DARK:LIGHT);
  expect(String(s.colorScheme)).toContain(system);
  expect(s.meta).toBe(system==='dark'?'#161d2c':'#f9faf7');
  // 首次选择后，操作系统改色和刷新都不能覆盖已保存的选择。
  await page.emulateMedia({colorScheme:system==='dark'?'light':'dark'});
  await page.reload();
  expect(await readTheme(page)).toEqual(s);
 });
}

test('Theme toggle switches light → dark → light and persists both choices',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});
 await page.goto('');
 const btn=page.locator('[data-theme-toggle]');
 await expect(btn).toBeVisible();
 expect((await readTheme(page)).pref).toBe('light');

 await btn.click();
 let s=await readTheme(page);
 expect([s.pref,s.stored,s.dataTheme,s.bg]).toEqual(['dark','dark','dark',DARK]);
 // 显式选择必须压过系统偏好（此处系统为浅色）
 expect(s.meta).toBe('#161d2c');

 await page.reload();
 s=await readTheme(page);
 expect(s.dataTheme).toBe('dark');
 expect(s.bg).toBe(DARK);

 await btn.click();
 s=await readTheme(page);
 expect([s.pref,s.stored,s.dataTheme,s.bg]).toEqual(['light','light','light',LIGHT]);
 expect(s.meta).toBe('#f9faf7');
 await page.reload();
 expect(await readTheme(page)).toEqual(s);
});

test('Explicit light overrides a dark system preference',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.addInitScript(()=>localStorage.setItem('theme','light'));
 await page.goto('');
 const s=await readTheme(page);
 expect(s.dataTheme).toBe('light');
 expect(s.bg).toBe(LIGHT);
 await page.emulateMedia({colorScheme:'light'});
 await page.emulateMedia({colorScheme:'dark'});
 expect(await readTheme(page)).toEqual(s);
});

for(const failingMethod of ['getItem','setItem']) {
 test(`Theme remains switchable when localStorage.${failingMethod} throws`,async({page})=>{
  await page.emulateMedia({colorScheme:'light'});
  await page.addInitScript(method=>{
   Object.defineProperty(Storage.prototype,method,{configurable:true,value(){throw new DOMException('Storage disabled','SecurityError');}});
  },failingMethod);
  await page.goto('');
  const btn=page.locator('[data-theme-toggle]');
  await expect(btn).toHaveAttribute('data-pref','light');
  for(const [theme,bg,meta] of [['dark',DARK,'#161d2c'],['light',LIGHT,'#f9faf7']]) {
   await btn.click();
   await expect(btn).toHaveAttribute('data-pref',theme);
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
   expect(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor)).toBe(bg);
   await expect(page.locator('meta[name="theme-color"]:not([media])')).toHaveAttribute('content',meta);
  }
 });
}

test('Dark theme is applied during head parsing, before body paint',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});
 await page.addInitScript(()=>localStorage.setItem('theme','dark'));

 // ① 结构断言：防闪白的真正不变量是「主题脚本在 <head> 内、且是解析期阻塞的内联脚本」。
 //    这能直接抓住「脚本被挪到 body 末尾」或「被 Astro 打包成 module 而失去阻塞语义」这两类回归。
 const res=await page.goto('');
 const html=await res.text();
 const headEnd=html.indexOf('</head>');
 expect(headEnd).toBeGreaterThan(-1);
 const head=html.slice(0,headEnd);
 const scriptAt=head.indexOf('__applyTheme');
 // 主题脚本必须在 <head> 内（若被挪到 body，这里就找不到）
 expect(scriptAt).toBeGreaterThan(-1);
 // 且必须是内联（无 src）：Astro 里只有 is:inline 才保持解析期阻塞，
 // 普通 <script> 会被打包成 module 而失去阻塞语义。
 const tagStart=head.lastIndexOf('<script',scriptAt);
 expect(tagStart).toBeGreaterThan(-1);
 expect(head.slice(tagStart,scriptAt)).not.toContain('src=');

 // ② 行为断言：DOM 解析完成时（样式表已生效、尚未等 load）就已是暗色，
 //    说明换肤发生在解析期而非 load 之后。不用 'commit' —— 那时 CSS 尚未应用，
 //    计算样式必然是透明的，断言会变成竞态。
 await page.waitForLoadState('domcontentloaded');
 const s=await page.evaluate(()=>({
  dataTheme:document.documentElement.getAttribute('data-theme'),
  bg:getComputedStyle(document.documentElement).backgroundColor,
  colorScheme:getComputedStyle(document.documentElement).colorScheme,
 }));
 expect(s.dataTheme).toBe('dark');
 expect(s.bg).toBe(DARK);
 expect(String(s.colorScheme)).toContain('dark');
});

test('Dark theme keeps body text and code blocks readable',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('blog/ai-agent-ch01/');
 const m=await page.evaluate(()=>{
  const bodyBg=getComputedStyle(document.documentElement).backgroundColor;
  const text=getComputedStyle(document.querySelector('.rich-content')).color;
  const pre=document.querySelector('.astro-code');
  const preBg=pre?getComputedStyle(pre).backgroundColor:null;
  const preColor=pre?getComputedStyle(pre).color:null;
  const link=getComputedStyle(document.querySelector('.rich-content a')).color;
  const parse=s=>s.match(/rgba?\(([^)]+)\)/)[1].split(',').slice(0,3).map(Number);
  const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  const lum=s=>{const[r,g,b]=parse(s).map(lin);return 0.2126*r+0.7152*g+0.0722*b;};
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);const[hi,lo]=l1>l2?[l1,l2]:[l2,l1];return (hi+0.05)/(lo+0.05);};
  return {bodyBg,textRatio:ratio(text,bodyBg),linkRatio:ratio(link,bodyBg),
          preBg,preRatio:preBg&&preColor?ratio(preColor,preBg):null};
 });
 expect(m.bodyBg).toBe(DARK);
 // WCAG AA：正文与链接在暗底上均需 >=4.5:1
 expect(m.textRatio).toBeGreaterThanOrEqual(4.5);
 expect(m.linkRatio).toBeGreaterThanOrEqual(4.5);
 // 代码块必须整体换肤（浅色底/深色字同时翻转），否则会出现深字配深底
 expect(m.preBg).not.toBeNull();
 expect(m.preRatio).toBeGreaterThanOrEqual(4.5);
});

// 禁用 JS 时也要拿到暗色：纯 CSS 的 prefers-color-scheme 通路必须独立成立。
test.describe('without JavaScript',()=>{
 test.use({javaScriptEnabled:false});
 test('System dark preference still applies',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('');
  const bg=await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor);
  expect(bg).toBe(DARK);
 });
});
