import {test,expect} from '@playwright/test';

test('Chinese title search, readable summaries, query-preserving shortcut and keyboard navigation',async({page})=>{
 await page.goto('search/');
 const input=page.getByRole('searchbox',{name:'搜索关键词'});
 await input.fill('线性模型');
 await expect(page.locator('.search-result h2 a').first()).toHaveText('线性模型：从最小二乘到 Lasso');
 await expect(page.locator('.search-result > p:last-child').first()).toHaveText('把风险、偏差与方差讲清楚，完整推导 OLS、Ridge 和 Lasso。');
 await input.press('ControlOrMeta+k');
 await expect(input).toBeFocused();await expect(input).toHaveValue('线性模型');
 await expect(page).toHaveURL(/q=/);
 await input.press('ArrowDown');
 await expect(page.locator('.search-result h2 a').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(input).toBeFocused();await expect(input).toHaveValue('');
 await expect(page.locator('.search-result')).toHaveCount(0);
});
test('Blog categories and paging survive reload',async({page})=>{
 await page.goto('blog/');
 await page.getByRole('button',{name:/知识笔记/}).click();
 await expect(page.locator('[data-post-row]:visible')).toHaveCount(12);
 await page.getByRole('button',{name:'下一页 →'}).click();
 await expect(page.locator('[data-post-row]:visible')).toHaveCount(2);
 await expect(page).toHaveURL(/category=knowledge.*page=2/);
 await page.reload();await expect(page.locator('[data-post-row]:visible')).toHaveCount(2);
 await expect(page.locator('[data-blog-series]')).toBeHidden();
});
test('Full-text results still find phrases absent from the title catalog',async({page})=>{
 await page.goto('search/?q=Fischer');
 await expect(page.locator('.search-result').first()).toBeVisible();
 await expect(page.locator('.search-result h2 a').first()).toHaveAttribute('href',/fods-/);
});
test('Long-form reading retains formulas, one page heading and legacy deep links',async({page})=>{
 await page.goto('blog/fods-linear-algebra-calculus-convexity/');
 await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.katex-error')).toHaveCount(0);
 expect(await page.locator('.rich-content math').count()).toBeGreaterThan(0);
 const link=page.locator('.article-toc a[data-part]').filter({hasText:/./});
 const targets=await link.evaluateAll(nodes=>nodes.filter(n=>Number(n.dataset.part)>1).map(n=>n.href));
 expect(targets.length).toBeGreaterThan(0);
 const destination=new URL(targets[0]);
 await page.goto(`blog/fods-linear-algebra-calculus-convexity/${destination.hash}`);
 await expect(page).toHaveURL(destination.href);
 await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.katex-error')).toHaveCount(0);
});
test('Configured project actions have a mobile-safe location and placeholder URLs are absent',async({page})=>{
 await page.goto('projects/paper-replication-workbench/');
 await expect(page.getByRole('link',{name:'交流这个项目 ↗'})).toBeVisible();
 await expect(page.locator('a[href*="your-name"],a[href*="example.com/demo"]')).toHaveCount(0);
});
test('Copy announces its result without changing the host clipboard',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedTestCode=value;}}}));
 await page.goto('blog/uv-package-manager-guide/');
 const expected=await page.locator('.rich-content pre code').first().textContent();
 await page.getByRole('button',{name:'复制代码'}).first().click();
 await expect(page.locator('[data-copy-status]')).toHaveText('代码已复制');
 expect(await page.evaluate(()=>window.copiedTestCode)).toBe(expected);
});
test('Back to top reaches the document start',async({page})=>{
 await page.goto('');await page.mouse.wheel(0,1800);
 await expect(page.locator('[data-back-to-top]')).toBeVisible();
 await page.locator('[data-back-to-top]').click();
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
});
test('Viewport boundaries retain readable content without horizontal page scrolling',async({page},info)=>{
 for(const width of info.project.name==='mobile'?[320,390]:[768,900,901,1024,1440]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('');await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
  await page.goto('blog/fods-linear-algebra-calculus-convexity/');await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
 }
});
