import { test, expect } from '@playwright/test';

test('Home presents 札记 and 长卷 in date order, then 闲笔', async ({ page }) => {
 await page.goto('');
 await page.evaluate(() => document.fonts.ready);
 const recent = page.locator('#recent');
 await expect(recent.getByRole('heading', { name: '札记' })).toBeVisible();
 await expect(recent.getByRole('heading', { name: '长卷' })).toBeVisible();
 await expect(recent.locator('.column').first().locator('.feed-item')).toHaveCount(6);
 await expect(recent.locator('.column').last().locator('.feed-item')).toHaveCount(6);
 const links = await recent.locator('.feed-item a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
 expect(new Set(links).size).toBe(12);
 for (const column of await recent.locator('.column').all()) {
  const dates = await column.locator('time').evaluateAll(nodes => nodes.map(node => Date.parse(node.dateTime)));
  expect(dates).toEqual([...dates].sort((a, b) => b - a));
 }
 // 首屏只放欢迎：栏目从第二屏开始，紧接在首屏之后，不留整屏空白。
 const recentTop = await recent.evaluate(node => node.getBoundingClientRect().top - innerHeight);
 expect(recentTop).toBeGreaterThanOrEqual(-1);
 expect(recentTop).toBeLessThan(150);
 await expect(page.locator('.timeline .months a')).toHaveCount(12);
 const jottings = page.locator('.jottings');
 await expect(jottings.getByRole('heading', { name: '闲笔' })).toBeVisible();
 await expect(jottings.locator('.jotting-feed a')).not.toHaveCount(0);
});

test('Mobile 札记 keeps articles in the first screen and filters by tag', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('blog/');
 expect(await page.locator('[data-post-row]:visible').first().evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(760);
 const tag = page.locator('[data-tag-filter]:not([data-tag-filter="all"])').first();
 const name = await tag.getAttribute('data-tag-filter');
 await tag.click();
 await expect(tag).toHaveAttribute('aria-pressed', 'true');
 for (const tags of await page.locator('[data-post-row]:visible').evaluateAll(nodes => nodes.map(node => node.dataset.tags.split('|')))) expect(tags).toContain(name);
});
test('Post cards and articles carry no decorative cover images', async ({ page }) => {
 await page.goto('');
 await expect(page.locator('.post-card img')).toHaveCount(0);
 await page.goto('blog/llm-eval-pipeline/');
 await expect(page.locator('.article-body')).toBeVisible();
 await expect(page.locator('.article-header ~ img, .article-cover')).toHaveCount(0);
});

test('Practical articles lead directly into their text without a decorative cover', async ({ page }) => {
 await page.goto('blog/uv-package-manager-guide/');
 await expect(page.locator('.article-cover')).toHaveCount(0);
 await expect(page.locator('.article-body')).toBeVisible();
});

test('Learning paths are immediately visible without scroll-triggered entrances', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.goto('notes/');
 for (const card of [page.locator('.notes-lead .series-card'), page.locator('.notes-rows .series-card').last()]) {
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity','1');
  expect(await card.evaluate(node => node.getAnimations().length)).toBe(0);
 }
});

test('Home fits narrow and wide viewports without horizontal overflow', async ({ page }) => {
 for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await expect(page.getByRole('heading', { name: /我是 kreiitor/ })).toBeVisible();
  await expect(page.locator('#recent .feed-item').first()).toBeVisible();
 }
});

test('Home typing completes once and respects reduced motion', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.goto('');
 await expect(page.locator('[data-typed-text]')).toHaveText('可复用的知识', { timeout: 8000 });
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await expect(page.locator('[data-typed-text]')).toHaveText('札记');
 await expect(page.locator('.claim .sr-only')).toHaveText('札记、长卷与闲笔');
});

test('Topic aliases keep their canonical page and matching entries', async ({ page }) => {
 for (const [alias, canonical] of [['Benchmark', '评测'], ['文献阅读', '论文阅读'], ['ai知识库', 'AI']]) {
  await page.goto(`tags/${encodeURIComponent(alias)}/`);
  await expect(page.getByRole('heading', { level: 1, name: canonical, exact: true })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/tags/${encodeURIComponent(canonical)}/$`));
  const aliasLinks = await page.locator('.tag-body a[href*="/blog/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(aliasLinks.length).toBeGreaterThan(0);
  await page.goto(`tags/${encodeURIComponent(canonical)}/`);
  expect(await page.locator('.tag-body a[href*="/blog/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(aliasLinks);
 }
});

test('Page introduction artwork stays clear of text across breakpoints', async ({ page }) => {
 for (const route of ['blog/', 'notes/', 'projects/', 'about/', 'tags/']) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await expect(page.locator('.page-intro .page-mark')).toBeHidden();
  await page.setViewportSize({ width: 800, height: 900 });
  const intro = page.locator('.page-intro');
  await expect(intro.locator('.page-mark')).toBeVisible();
  const overlap = await intro.evaluate(node => {
   const mark = node.querySelector('.page-mark').getBoundingClientRect();
   return [...node.querySelectorAll('h1, p')].some(element => {
    const text = element.getBoundingClientRect();
    return text.left < mark.right && text.right > mark.left && text.top < mark.bottom && text.bottom > mark.top;
   });
  });
  expect(overlap, `${route} introduction overlaps its artwork`).toBe(false);
 }
});

test('Home remains readable without JavaScript', async ({ browser, baseURL }) => {
 const context = await browser.newContext({ javaScriptEnabled: false });
 try {
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('[data-typed-text]')).toHaveText('札记');
  await expect(page.locator('#recent .feed-item').first()).toBeVisible();
  await expect(page.locator('.feed-time').first()).not.toBeEmpty();
 } finally {
  await context.close();
 }
});
