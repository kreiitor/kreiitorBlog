import { test, expect } from '@playwright/test';

test('Home brings varied editorial selections into view before the second screen', async ({ page }) => {
 await page.goto('');
 await page.evaluate(() => document.fonts.ready);
 const selections = page.locator('.selected-writing');
 const links = await selections.locator('h3 a, .selected-row').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
 expect(new Set(links).size).toBe(3);
 expect(links.some(href => href.includes('llm-eval-pipeline'))).toBe(true);
 expect(links.some(href => href.includes('paper-reading-notes'))).toBe(true);
 expect(links.some(href => href.includes('fods-overview'))).toBe(true);
 expect(await selections.evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(850);
});

test('Mobile blog keeps articles ahead of expandable learning paths and opens paths for the course filter', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('blog/');
 const paths = page.locator('[data-blog-series]');
 await expect(paths).not.toHaveAttribute('open', '');
 expect(await page.locator('[data-post-row]:visible').first().evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(760);
 await paths.locator('summary').click();
 await expect(paths.locator('.series-card').first()).toBeVisible();
 await page.getByRole('button', { name: /知识笔记/ }).click();
 await expect(paths).toBeHidden();
 await page.getByRole('button', { name: /系列学习/ }).click();
 await expect(paths).toHaveAttribute('open', '');
 await page.reload();
 await expect(paths).toHaveAttribute('open', '');
 await page.getByRole('button', { name: /独立札记/ }).click();
 await expect(paths).not.toHaveAttribute('open', '');
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
 await page.goto('');
 const card = page.locator('.series-grid .series-card').first();
 await card.scrollIntoViewIfNeeded();
 await expect(card).toHaveCSS('opacity','1');
 expect(await card.evaluate(node => node.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});

test('Home fits narrow and wide viewports without horizontal overflow', async ({ page }) => {
 for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await expect(page.getByRole('heading', { name: /研究札记/ })).toBeVisible();
  await expect(page.locator('.selected-writing .post-featured')).toBeVisible();
 }
});
