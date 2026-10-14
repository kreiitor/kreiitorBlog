import { test, expect } from '@playwright/test';

test('Quick search stays on the article, supports keyboard selection and restores focus', async ({page}) => {
 await page.goto('blog/uv-package-manager-guide/');
 const trigger=page.locator('[data-search-link]');await trigger.focus();await trigger.press('ControlOrMeta+k');
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 const input=dialog.getByRole('searchbox');await expect(input).toBeFocused();await input.fill('线性模型');
 await expect(dialog.locator('.search-result h2 a').first()).toHaveText('线性模型：从最小二乘到 Lasso');
 await input.press('ArrowDown');await expect(dialog.locator('.search-result h2 a').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
 await expect(page).toHaveURL(/uv-package-manager-guide\/$/);
 await trigger.click();await expect(input).toHaveValue('线性模型');
 await dialog.locator('[data-full-search]').click();await expect(page).toHaveURL(/search\/\?q=/);
 await expect(page.getByRole('searchbox')).toHaveValue('线性模型');
});

test('Comments load lazily with original public configuration and recover from a network failure', async ({page}) => {
 let attempts=0;
 await page.route('https://giscus.app/client.js',route=>{attempts++;return route.abort();});
 await page.goto('blog/uv-package-manager-guide/');
 await expect(page.locator('#giscus-container script')).toHaveCount(0);
 await page.locator('.comments-panel').scrollIntoViewIfNeeded();
 await expect(page.locator('[data-comment-status]')).toContainText('暂时无法连接');
 const script=page.locator('#giscus-container script');
 await expect(script).toHaveAttribute('data-repo','kreiitor/kreiitorBlog');
 await expect(script).toHaveAttribute('data-repo-id','R_kgDOR5wNCw');
 await expect(script).toHaveAttribute('data-category-id','DIC_kwDOR5wNC84C6DIZ');
 await expect(script).toHaveAttribute('data-term',new URL(page.url()).pathname.slice(1));
 await expect(script).toHaveAttribute('data-theme','light');
 await page.locator('[data-comment-retry]').click();
 await expect.poll(()=>attempts).toBe(2);
 await expect(page.locator('[data-comment-retry]')).toBeVisible();
});

test('Inline and normal display formulas have no tiny scrollbars; wide equations are fully reachable',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:390,height:844});
 await page.goto('blog/fods-linear-algebra-calculus-convexity/');await page.evaluate(()=>document.fonts.ready);
 const inline=page.locator('.article-body .katex:not(.katex-display .katex)').filter({has:page.locator('annotation')});
 const shortIndex=await inline.evaluateAll(nodes=>nodes.findIndex(e=>(e.querySelector('annotation')?.textContent??'').length<15));
 const short=inline.nth(shortIndex);await short.scrollIntoViewIfNeeded();
 await expect.poll(()=>short.evaluate(e=>getComputedStyle(e).overflowX)).toBe('visible');
 // Inline emphasis has clientWidth=0; it must not be treated as the available line width.
 await short.evaluate(e=>{const strong=document.createElement('strong');e.before(strong);strong.append(e);});
 await page.setViewportSize({width:420,height:844});
 await expect.poll(()=>short.evaluate(e=>e.classList.contains('is-overflowing'))).toBe(false);
 await page.setViewportSize({width:390,height:844});
 const displays=page.locator('.article-body .katex-display');
 const indexes=await displays.evaluateAll(nodes=>({
  normal:nodes.findIndex(e=>e.querySelector(':scope > .katex').getBoundingClientRect().width<e.clientWidth-20),
  wide:nodes.findIndex(e=>e.querySelector(':scope > .katex').getBoundingClientRect().width>e.clientWidth+30)
 }));
 expect(indexes.normal).toBeGreaterThanOrEqual(0);expect(indexes.wide).toBeGreaterThanOrEqual(0);
 const normal=displays.nth(indexes.normal);await normal.scrollIntoViewIfNeeded();
 expect(await normal.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 const wide=displays.nth(indexes.wide);await wide.scrollIntoViewIfNeeded();
 await expect(wide).toHaveClass(/is-overflowing/);await expect(wide).toHaveAttribute('tabindex','0');
 expect(await wide.evaluate(e=>e.querySelector(':scope > .katex').getBoundingClientRect().left-e.getBoundingClientRect().left)).toBeGreaterThanOrEqual(0);
 expect(await wide.evaluate(e=>{e.scrollLeft=e.scrollWidth;return e.scrollLeft;})).toBeGreaterThan(20);
 await page.setViewportSize({width:1440,height:1000});await short.scrollIntoViewIfNeeded();
 await expect.poll(()=>short.evaluate(e=>getComputedStyle(e).overflowX)).toBe('visible');
 await expect(page.locator('.math-scroll-hint')).toHaveCount(0);
});

test('Reading history is opt-in, resumes locally, and can be cleared or disabled',async({page})=>{
 await page.route('https://giscus.app/**',route=>route.abort());
 await page.goto('blog/uv-package-manager-guide/');
 const toggle=page.locator('[data-memory-toggle]');await expect(toggle).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('garden-reading:')))).toBe(false);
 await toggle.click();const target=page.locator('.article-body h2[id]').nth(2);await target.scrollIntoViewIfNeeded();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('garden-reading:')))).position.progress)).toBeGreaterThan(0);
 await page.goto('blog/uv-package-manager-guide/');await expect(page.locator('[data-memory-resume]')).toBeVisible();
 await page.locator('[data-memory-resume]').click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(500);
 const id=await target.getAttribute('id');await page.goto(`blog/uv-package-manager-guide/#${encodeURIComponent(id)}`);
 await expect(page.locator('[data-memory-resume]')).toBeHidden();await expect(target).toBeInViewport();
 await page.goto('blog/uv-package-manager-guide/');await page.locator('[data-memory-clear]').click();await expect(page.locator('[data-memory-resume]')).toBeHidden();
 await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('garden-reading:')))).position)).toBeUndefined();
});

test('Reduced motion and mobile navigation retain keyboard access',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('');
 const menu=page.locator('.mobile-menu summary');await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');
 await menu.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await expect(menu).toBeFocused();
 // 减少动态效果：断言「面向用户意图」的结果——动画不产生可见时长，
 // 而不是绑死某一种实现（当前用时长归零以保留 animationend/transitionend；
 // 早期用 animation:none。两者都满足，故断言同时接受）。
 const anim=await page.locator('.hero-copy').evaluate(e=>{const s=getComputedStyle(e);return{name:s.animationName,dur:s.animationDuration,tr:s.transitionDuration};});
 const toMs=v=>v.endsWith('ms')?parseFloat(v):parseFloat(v)*1000;
 expect(anim.name==='none'||toMs(anim.dur)<=1).toBe(true);
 expect(anim.tr.split(',').every(v=>toMs(v.trim())<=1)).toBe(true);
 await page.locator('[data-search-link]').click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('[data-search-link]')).toBeFocused();
});

test('Search index errors expose a working retry action',async({page})=>{
 let fail=true;await page.route('**/search-catalog.json',route=>fail?route.abort():route.continue());
 await page.goto('search/');await page.getByRole('searchbox').fill('线性模型');
 await expect(page.locator('[data-search-retry]')).toBeVisible();
 await expect(page.locator('[data-search-status]')).toContainText('暂时无法加载');
 fail=false;await page.locator('[data-search-retry]').click();
 await expect(page.locator('.search-result h2 a').first()).toHaveText('线性模型：从最小二乘到 Lasso');
 await expect(page.locator('[data-search-retry]')).toBeHidden();
});

test('Mobile contents close after selection; printing retains the complete article and MathML',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('blog/fods-linear-models/');
 const toc=page.locator('.mobile-toc');await toc.locator('summary').click();const link=toc.locator('a').nth(2);const hash=await link.getAttribute('href');await link.click();
 await expect(toc).not.toHaveAttribute('open','');
 await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toBeInViewport();
 const mathCount=await page.locator('.article-body math').count();expect(mathCount).toBeGreaterThan(0);
 const text=await page.locator('.article-body').textContent();
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.reading-memory')).toBeHidden();
 expect(await page.locator('.article-body math').count()).toBe(mathCount);expect(await page.locator('.article-body').textContent()).toBe(text);
});

test('Numbered equations reserve room for their tags without clipping',async({page})=>{
 await page.goto('blog/ai-infra-ch06/');await page.evaluate(()=>document.fonts.ready);
 const equations=page.locator('.article-body .katex-display').filter({has:page.locator('.katex-tag')});
 expect(await equations.count()).toBeGreaterThan(0);
 const equation=equations.first();await equation.scrollIntoViewIfNeeded();
 const geometry=await equation.evaluate(e=>{
  const tag=e.querySelector('.katex-tag').getBoundingClientRect(), bases=[...e.querySelectorAll('.katex-html > .katex-base')], inner=e.querySelector(':scope > .katex').getBoundingClientRect();
  return{tagLeft:tag.left,tagRight:tag.right,baseRight:Math.max(...bases.map(base=>base.getBoundingClientRect().right)),innerRight:inner.right};
 });
 expect(geometry.tagLeft).toBeGreaterThanOrEqual(geometry.baseRight-1);
 expect(geometry.tagRight).toBeLessThanOrEqual(geometry.innerRight+1);
 await expect(page.locator('.katex-error')).toHaveCount(0);
});
