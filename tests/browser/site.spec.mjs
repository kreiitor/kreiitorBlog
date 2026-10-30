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
 const category=page.getByRole('button',{name:/知识笔记/});
 const total=Number(await category.locator('span').textContent());
 expect(total).toBeGreaterThan(12);
 const allCategoryLinks=await page.locator('[data-post-row][data-category="knowledge"]').evaluateAll(rows=>rows.map(row=>row.getAttribute('href')));
 expect(allCategoryLinks).toHaveLength(total);
 await category.click();
 const rows=page.locator('[data-post-row]:visible');
 await expect(rows).toHaveCount(12);
 const visited=new Set(await rows.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))));
 await expect(page.getByRole('button',{name:'← 上一页'})).toBeDisabled();
 let currentPage=1;
 const next=page.getByRole('button',{name:'下一页 →'});
 while(await next.isEnabled()) {
  await next.click();
  currentPage++;
  await expect(rows).toHaveCount(Math.min(12,total-visited.size));
  const links=await rows.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  for(const href of links) {
   expect(visited.has(href),`Article ${href} must appear on only one page`).toBe(false);
   visited.add(href);
  }
  await expect.poll(()=>new URL(page.url()).searchParams.get('category')).toBe('knowledge');
  await expect.poll(()=>new URL(page.url()).searchParams.get('page')).toBe(String(currentPage));
  await page.reload();
  await expect(rows).toHaveCount(links.length);
  expect(await rows.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')))).toEqual(links);
  await expect(page.getByRole('button',{name:/知识笔记/})).toHaveAttribute('aria-pressed','true');
 }
 expect([...visited].sort()).toEqual([...allCategoryLinks].sort());
 await expect(next).toBeDisabled();
 await expect(page.locator('[data-blog-series]')).toBeHidden();
 await page.getByRole('button',{name:'← 上一页'}).click();
 await expect(rows).toHaveCount(12);
 await expect.poll(()=>new URL(page.url()).searchParams.get('page')).toBe(currentPage===2?null:String(currentPage-1));
});
test('Full-text results still find phrases absent from the title catalog',async({page})=>{
 await page.goto('search/?q=Fischer');
 await expect(page.locator('.search-result').first()).toBeVisible();
 await expect(page.locator('.search-result h2 a').first()).toHaveAttribute('href',/fods-/);
});
test('Long-form reading renders the whole article on one page with working anchors',async({page})=>{
 await page.goto('blog/fods-linear-algebra-calculus-convexity/');
 await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.katex-error')).toHaveCount(0);
 expect(await page.locator('.rich-content math').count()).toBeGreaterThan(0);
 await expect(page.locator('.reading-parts,[data-reading-select]')).toHaveCount(0);
 const ids=await page.locator('.article-body :is(h2,h3)[id]').evaluateAll(nodes=>nodes.map(node=>node.id));
 const h2count=await page.locator('.article-body h2[id]').count();
 const h3count=await page.locator('.article-body h3[id]').count();
 expect(h2count).toBeGreaterThan(12);
 // 目录覆盖 h2 与 h3（实测该篇 26 个 h2 + 83 个 h3），这是本轮把 depth===2 放宽到 h3 的契约。
 expect(h3count).toBeGreaterThan(0);
 expect(ids.length).toBe(h2count+h3count);
 const hashes=await page.locator('.article-toc a[data-toc-link]').evaluateAll(nodes=>nodes.map(node=>decodeURIComponent(node.hash.slice(1))));
 expect(hashes).toEqual(ids);
 // h3 条目应带缩进类，与 h2 在视觉上分层
 const h3Links=await page.locator('.article-toc a[data-toc-link].toc-h3').count();
 expect(h3Links).toBe(h3count);
 const pathname=new URL(page.url()).pathname;
 await page.goto(`blog/fods-linear-algebra-calculus-convexity/#${encodeURIComponent(ids.at(-1))}`);
 await expect.poll(()=>new URL(page.url()).pathname).toBe(pathname);
 await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.katex-error')).toHaveCount(0);
 // 跳到最后一个条目（可能是 h3）后，目标标题应在视口内
 await expect(page.locator(`[id="${ids.at(-1)}"]`)).toBeInViewport();
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
 await page.mouse.wheel(0,-160);
 await expect(page.locator('[data-back-to-top]')).toBeVisible();
 await page.locator('[data-back-to-top]').click();
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
});
test('Viewport boundaries retain readable content without horizontal page scrolling',async({page},info)=>{
 test.setTimeout(120000);
 for(const width of info.project.name==='mobile'?[320,390]:[768,900,901,1024,1440]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('');await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
  await page.goto('blog/fods-linear-algebra-calculus-convexity/');await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
 }
});
test('Heading permalinks resolve to real ids and are keyboard reachable',async({page})=>{
 await page.goto('blog/fods-linear-algebra-calculus-convexity/');
 // 由 scripts/inject-heading-anchors.mjs 在构建后注入（Astro 的 components 覆盖只对 .mdx 生效）
 const anchors=page.locator('.heading-anchor');
 expect(await anchors.count()).toBeGreaterThan(50);
 // 每个锚点的 href 都必须指向页面上真实存在的 id
 const bad=await page.evaluate(()=>[...document.querySelectorAll('.heading-anchor')]
  .map(a=>decodeURIComponent(a.getAttribute('href').slice(1)))
  .filter(id=>!document.getElementById(id)));
 expect(bad).toEqual([]);
 // 键盘可达，且点击后地址栏 hash 更新到该节
 const first=anchors.first();
 await first.focus();
 await expect(first).toBeFocused();
 const target=await first.getAttribute('href');
 await first.click();
 await expect.poll(()=>page.evaluate(()=>decodeURIComponent(location.hash))).toBe(target);
});
test('Related posts link to same-site articles and follow the shared-tag signal',async({page})=>{
 await page.goto('blog/ai-agent-ch01/');
 const section=page.locator('.related-posts');
 await expect(section).toBeVisible();
 const items=section.locator('li a');
 const count=await items.count();
 expect(count).toBeGreaterThan(0);
 expect(count).toBeLessThanOrEqual(3);
 // 全部是站内文章链接，且不指向自己
 const hrefs=await items.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 for(const href of hrefs){
  expect(href).toMatch(/^\/blog\/[^/]+\/$/);
  expect(href).not.toBe('/blog/ai-agent-ch01/');
 }
 // 同系列的第 2 章应出现在首位（同系列权重高于普通共享标签）
 expect(decodeURIComponent(hrefs[0])).toContain('ai-agent-ch02');
});
