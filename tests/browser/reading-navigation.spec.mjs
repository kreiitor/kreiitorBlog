import {test, expect} from '@playwright/test';

const articlePath = 'blog/fods-linear-algebra-calculus-convexity/';

test('Scrolling tracks h2 and h3 in both copies of the article navigation', async ({page}) => {
 await page.goto(articlePath);
 await page.evaluate(() => document.fonts.ready);
 const headings = await page.locator('.article-body :is(h2,h3)[id]').evaluateAll(nodes => {
  const h3 = nodes.find(node => node.tagName === 'H3');
  const h2 = nodes.slice(0, nodes.indexOf(h3)).findLast(node => node.tagName === 'H2');
  return [h2?.id, h3?.id];
 });
 for (const id of [...headings, headings[0]]) {
  expect(id).toBeTruthy();
  await page.evaluate(id => {
   const heading = document.getElementById(id);
   window.scrollTo({top: heading.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant'});
  }, id);
  await expect.poll(() => page.locator('[data-toc-link][aria-current="location"]').evaluateAll(
   links => links.map(link => decodeURIComponent(link.hash.slice(1))),
  )).toEqual([id, id]);
 }
 await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
 await expect(page.locator('[data-toc-link][aria-current="location"]')).toHaveCount(0);
});

test('Navigation math has native visual MathML and TeX annotations without duplicated visual spans', async ({page}) => {
 await page.goto(articlePath);
 const labels = page.locator('.toc-math');
 expect(await labels.count()).toBeGreaterThan(0);
 await expect(labels.locator('.katex-html, .katex-mathml, .katex-error')).toHaveCount(0);
 expect(await labels.locator('math semantics annotation[encoding="application/x-tex"]').count()).toBe(await labels.count());
 const desktop = await page.locator('.article-toc .toc-math math').allTextContents();
 const mobile = await page.locator('.mobile-toc .toc-math math').allTextContents();
 expect(desktop).toEqual(mobile);
 // The article retains the full KaTeX rendering and its semantic counterpart.
 expect(await page.locator('.article-body .katex-html').count()).toBeGreaterThan(0);
 expect(await page.locator('.article-body math').count()).toBeGreaterThan(0);
});

test('Mobile navigation and mathematical headings work without JavaScript', async ({browser, baseURL}) => {
 const context = await browser.newContext({javaScriptEnabled: false, baseURL, viewport: {width: 390, height: 844}});
 try {
  const page = await context.newPage();
  await page.goto(articlePath);
  const toc = page.locator('.mobile-toc');
  await toc.locator('summary').click();
  await expect(toc).toHaveAttribute('open', '');
  const formula = toc.locator('.toc-math math').first();
  await expect(formula).toBeVisible();
  expect(await formula.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  const link = toc.locator('a.toc-h3').first();
  const target = await link.getAttribute('href');
  await link.click();
  await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash))).toBe(decodeURIComponent(target));
  await expect(page.locator('.article-body h3').first()).toBeInViewport();
  await page.emulateMedia({media: 'print'});
  await expect(toc).toBeHidden();
  await expect(page.locator('.article-body')).toBeVisible();
 } finally {
  await context.close();
 }
});
