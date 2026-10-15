import { test, expect } from '@playwright/test';

const routes = ['', 'blog/fods-linear-algebra-calculus-convexity/'];

// Capture the whole transition: an assertion at its end misses the content jump.
async function observeScroll(page, top) {
 return page.evaluate(top => new Promise(resolve => {
  const frames = [];
  const until = performance.now() + 700;
  function sample() {
   frames.push({
    y: scrollY,
    header: document.querySelector('.site-header').getBoundingClientRect().height,
    main: document.querySelector('main').getBoundingClientRect().top + scrollY,
   });
   if (performance.now() < until) requestAnimationFrame(sample);
   else resolve(frames);
  }
  // Start sampling and scrolling in the same browser task. A separate tool
  // round trip can outlast the window while tracing this very large article.
  sample();
  if (typeof top === 'number') scrollTo({ top, behavior: 'instant' });
 }), top);
}

const range = values => Math.max(...values) - Math.min(...values);

for (const route of routes) {
 const label = route ? 'article' : 'home';

 test(`${label}: crossing the top threshold keeps the header and content layout stable`, async ({ page }) => {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  for (const top of [30, 5, 40, 0]) {
   const frames = await observeScroll(page, top);
   expect(frames.length).toBeGreaterThan(1);
   expect(range(frames.map(frame => frame.header))).toBeLessThanOrEqual(1);
   expect(range(frames.map(frame => frame.main))).toBeLessThanOrEqual(1);
   expect(frames.at(-1).y).toBe(top);
  }
 });

 test(`${label}: upward wheel and both top links reach zero and stay there`, async ({ page }) => {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  for (const method of ['wheel', 'floating link', 'footer link', 'keyboard']) {
   await page.evaluate(() => scrollTo({ top: 1600, behavior: 'instant' }));
   await expect(page.locator('[data-back-to-top]')).toBeVisible();
   if (method === 'wheel') {
    await page.mouse.move(100, 400);
    await page.mouse.wheel(0, -10000);
   } else if (method === 'keyboard') {
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('Control+Home');
   } else {
    await page.locator(method === 'floating link' ? '[data-back-to-top]' : '.footer-bottom a[href="#top"]').click();
   }
   await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
   const frames = await observeScroll(page);
   expect(frames.every(frame => frame.y === 0)).toBe(true);
   expect(range(frames.map(frame => frame.main))).toBeLessThanOrEqual(1);
  }
 });
}

test('Touch swiping toward the document start reaches zero and stays there', async ({ page, isMobile }) => {
 test.skip(!isMobile, 'Touch input is covered by the mobile project.');
 await page.goto('');
 await page.evaluate(() => document.fonts.ready);
 await page.evaluate(() => scrollTo({ top: 200, behavior: 'instant' }));
 const session = await page.context().newCDPSession(page);
 try {
  // Dispatch native touch input: Chrome's synthesized scroll gesture can be
  // a no-op in mobile emulation even though the protocol command succeeds.
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 180 }] });
  for (let y = 200; y <= 700; y += 20) {
   await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
   await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const frames = await observeScroll(page);
  expect(frames.every(frame => frame.y === 0)).toBe(true);
 } finally { await session.detach(); }
});
