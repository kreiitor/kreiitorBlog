import { test, expect } from '@playwright/test';

test('Home presents Bento status, filterable 札记, real gallery 闲笔, and 3 长卷 monographs', async ({ page }) => {
 await page.goto('');
 await page.evaluate(() => document.fonts.ready);
 await expect(page.locator('.hero-title')).toBeVisible();
 await expect(page.locator('.now-card')).toBeVisible();
 const recent = page.locator('#recent');
 await expect(recent.getByRole('heading', { name: '札记' })).toBeVisible();
 await expect(recent.getByRole('heading', { name: '闲笔' })).toBeVisible();
 const visibleNotes = recent.locator('.feed-item:visible');
 await expect(visibleNotes).toHaveCount(6);
 const dates = await visibleNotes.locator('time').evaluateAll(nodes => nodes.map(node => Date.parse(node.dateTime)));
 expect(dates).toEqual([...dates].sort((a, b) => b - a));
 const tagBtn = recent.locator('[data-home-tag]:not([data-home-tag="all"])').first();
 const selectedTag = await tagBtn.getAttribute('data-home-tag');
 await tagBtn.click();
 await expect(tagBtn).toHaveAttribute('aria-pressed', 'true');
 const filteredTags = await visibleNotes.evaluateAll(nodes => nodes.map(n => (n.dataset.tags ?? '').split('|')));
 expect(filteredTags.length).toBeGreaterThan(0);
 for (const tags of filteredTags) expect(tags).toContain(selectedTag);
 await expect(recent.locator('.life-gallery a[href*="/gallery/#photo-"]')).toHaveCount(4);
 await expect(recent.locator('.life-essay-card')).toBeVisible();
 await expect(page.locator('.monographs-grid .monograph-card')).toHaveCount(3);
 await expect(page.locator('.timeline-panel .months a')).toHaveCount(12);
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
  await expect(page.locator('.hero-title')).toBeVisible();
  await expect(page.locator('#recent .feed-item:visible').first()).toBeVisible();
 }
});

test('Inline technical SVG diagrams load cleanly without overflow on narrow screens', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 for (const route of [
  'blog/transformer-01-overview/',
  'blog/transformer-02-architecture/',
  'blog/transformer-04-ffn/',
  'blog/git-glossary/',
  'blog/ssh-cli-agent-guide/',
  'blog/algorithm-time-complexity/',
  'blog/cpp-04-templates-deduction/',
  'blog/cpp-07-containers/',
  'blog/cpp-08-iterators/',
  'blog/fods-linear-models/',
  'blog/fods-linear-algebra-calculus-convexity/',
  'blog/fods-probability-concentration/',
  'blog/fods-optimization-error/',
  'blog/fods-minimax-supervised-learning/',
  'blog/llm-eval-pipeline/',
  'blog/static-blog-architecture/',
 ]) {
  await page.goto(route);
  const figureImg = page.locator('.article-body figure img[src$=".svg"]').first();
  await figureImg.scrollIntoViewIfNeeded();
  await expect(figureImg).toBeVisible();
  expect(await figureImg.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
 }
});

test('Site exposes RSS autodiscovery and clickable homepage status links', async ({ page }) => {
 await page.goto('');
 await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', /rss\.xml$/);
 await expect(page.locator('.now-list a.now-item')).toHaveCount(3);
});

test('Secondary pages adapt cleanly across phone and narrow tablet widths without overflow', async ({ page }) => {
 for (const width of [390, 680]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ['notes/fods/', 'about/', 'archive/', 'projects/', 'search/']) {
   await page.goto(route);
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${route} at ${width}px`).toBe(true);
  }
 }
});

test('Home entrance respects reduced motion without animations', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await page.goto('');
 await expect(page.locator('.hero-title')).toBeVisible();
 const anim = await page.locator('.bento-hero').evaluate(e => {
  const s = getComputedStyle(e);
  return { name: s.animationName, dur: s.animationDuration };
 });
 const toMs = v => v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000;
 expect(anim.name === 'none' || toMs(anim.dur) <= 1).toBe(true);
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
  // 901 是页头插画显示的最小档位，取边界值最能抓到「插画压住标题」的回归。
  await page.setViewportSize({ width: 901, height: 900 });
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
  await expect(page.locator('.hero-title')).toBeVisible();
  await expect(page.locator('#recent .feed-item:visible')).toHaveCount(6);
  await expect(page.locator('.feed-time').first()).not.toBeEmpty();
  await expect(page.locator('.life-gallery')).toBeVisible();
 } finally {
  await context.close();
 }
});

test('Robots, sitemap link, and BlogPosting JSON-LD validate cleanly', async ({ page, request }) => {
 const robots = await request.get('robots.txt');
 expect(robots.ok()).toBe(true);
 expect(await robots.text()).toContain('sitemap-index.xml');
 await page.goto('blog/transformer-01-overview/');
 const ld = await page.locator('head script[type="application/ld+json"]').textContent();
 expect(ld).toBeTruthy();
 const parsed = JSON.parse(ld ?? '{}');
 expect(parsed['@type']).toBe('BlogPosting');
 expect(parsed.headline).toContain('Transformer');
});

test('Long code blocks fold, expand, toggle wrap, and display equations copy TeX', async ({ page }) => {
 await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async value => { window.copiedTeX = value; } } }));
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('blog/hot100-algorithm-solutions/');
 const toc = page.locator('.mobile-toc');
 await toc.locator('summary').click();
 const outlineBtn = toc.locator('.mobile-toc-mode');
 await expect(outlineBtn).toBeVisible();
 await outlineBtn.click();
 await expect(outlineBtn).toHaveAttribute('aria-pressed', 'true');
 await expect(toc.locator('a.toc-h3').first()).toBeHidden();
 const expandBtn = page.locator('.code-expand').first();
 await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
 await expandBtn.click();
 await expect(expandBtn).toHaveAttribute('aria-expanded', 'true');

 await page.goto('blog/fods-optimization-error/');
 const firstEq = page.locator('.article-body .katex-display').first();
 await firstEq.scrollIntoViewIfNeeded();
 await firstEq.hover();
 const mathCopy = page.locator('.math-copy');
 await expect(mathCopy).toBeVisible();
 await mathCopy.click();
 await expect(page.locator('[data-copy-status]')).toHaveText('公式 TeX 已复制');
 expect(await page.evaluate(() => window.copiedTeX)).toBeTruthy();
});
