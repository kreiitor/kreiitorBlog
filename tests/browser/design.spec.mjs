import { test, expect } from '@playwright/test';
import sharp from 'sharp';

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
 await page.getByRole('button', { name: /全部札记/ }).click();
 await expect(paths).not.toHaveAttribute('open', '');
});

test('Vector covers follow manual theme choices even when they override the operating system', async ({ page }) => {
 await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
 await page.addInitScript(() => localStorage.setItem('theme', 'light'));
 await page.goto('');
 const cover = page.locator('.selected-writing .card-cover img');
 const sample = async () => {
  await cover.scrollIntoViewIfNeeded();
  const screenshot = await cover.screenshot();
  const { data } = await sharp(screenshot).extract({ left: 8, top: 8, width: 2, height: 2 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [...data].reduce((sum, value) => sum + value, 0) / data.length;
 };
 expect(await sample()).toBeGreaterThan(200);
 await page.locator('[data-theme-toggle]').click();
 expect(await sample()).toBeLessThan(80);
 await page.locator('[data-theme-toggle]').click();
 expect(await sample()).toBeGreaterThan(200);
});

test('Practical articles lead directly into their text without a decorative cover', async ({ page }) => {
 await page.goto('blog/uv-package-manager-guide/');
 await expect(page.locator('.article-cover')).toHaveCount(0);
 await expect(page.locator('.article-body')).toBeVisible();
});
