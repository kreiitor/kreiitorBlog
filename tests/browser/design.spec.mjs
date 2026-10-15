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

test('Layered illustration settles and stays still with reduced motion', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.goto('');
 const art = page.locator('.research-art');
 await expect(art.locator('.art-layer')).toHaveCount(3);
 await expect.poll(() => art.evaluate(node => node.getAnimations({subtree:true}).filter(animation => animation.playState === 'running').length)).toBe(0);
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await expect.poll(() => art.locator('.art-layer').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).animationName === 'none'))).toBe(true);
 for (const layer of await art.locator('.art-layer').all()) await expect(layer).toHaveCSS('opacity', '1');
});

test('Enabling reduced motion cancels card entrances already in flight', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.goto('');
 await page.evaluate(() => document.fonts.ready);
 const wasAnimating = await page.locator('.series-grid').evaluate(node => new Promise(resolve => {
  node.scrollIntoView({block:'center',behavior:'instant'});
  const until = performance.now() + 1200;
  function inspect() {
   const active = node.getAnimations({subtree:true}).some(animation => animation.playState === 'running' && animation.effect?.target?.matches('.series-card'));
   if (active || performance.now() > until) resolve(active);
   else requestAnimationFrame(inspect);
  }
  requestAnimationFrame(inspect);
 }));
 expect(wasAnimating).toBe(true);
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await expect.poll(() => page.locator('.series-grid').evaluate(node => node.getAnimations({subtree:true}).filter(animation => animation.playState === 'running').length)).toBe(0);
 await expect(page.locator('.series-card').first()).toHaveCSS('opacity','1');
});
