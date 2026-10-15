import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const phase = process.argv[2] ?? 'after';
const directory = `.artifacts/optimization/${phase}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const reports = [];
try {
 for (const cpu of [1, 6]) {
  for (const route of ['', 'blog/fods-linear-algebra-calculus-convexity/']) {
   const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
   const page = await context.newPage();
   const session = await context.newCDPSession(page);
   await session.send('Emulation.setCPUThrottlingRate', { rate: cpu });
   await session.send('Network.setCacheDisabled', { cacheDisabled: true });
   await page.addInitScript(() => {
    window.readingAudit = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 };
    for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
     new PerformanceObserver(list => { for (const entry of list.getEntries()) {
      if (type === 'largest-contentful-paint') window.readingAudit.lcp = entry.startTime;
      if (type === 'layout-shift' && !entry.hadRecentInput) window.readingAudit.cls += entry.value;
      if (type === 'longtask') { window.readingAudit.longTasks++; window.readingAudit.longTaskMs += entry.duration; }
     } }).observe({ type, buffered: true });
    }
   });
   await page.goto(new URL(route, process.env.PREVIEW_URL ?? 'http://localhost:4321/').href, { timeout: 120000 });
   await page.evaluate(() => document.fonts.ready);
   await page.waitForTimeout(800);
   const initial = await page.evaluate(() => ({
    ...window.readingAudit,
    dom: document.querySelectorAll('*').length,
    articleDom: document.querySelector('.article-body')?.querySelectorAll('*').length ?? 0,
    htmlBytes: performance.getEntriesByType('navigation')[0].decodedBodySize,
    fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2?(?:$|\?)/.test(entry.name)).map(entry => ({ name: new URL(entry.name).pathname.split('/').at(-1), bytes: entry.transferSize })),
    totalResourceBytes: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0),
   }));
   const scrolling = await page.evaluate(async () => {
    const frames = [];
    let last = performance.now();
    for (let index = 0; index < 36; index++) {
     scrollTo(0, index * 120);
     await new Promise(requestAnimationFrame);
     const now = performance.now(); frames.push(now - last); last = now;
    }
    return { maxFrameMs: Math.max(...frames), framesOver50ms: frames.filter(time => time > 50).length };
   });
   const report = { phase, cpu, route: route || '/', width: 390, ...initial, fontBytes: initial.fonts.reduce((sum, font) => sum + font.bytes, 0), scrolling };
   reports.push(report);
   await writeFile(`${directory}/performance.json`, JSON.stringify(reports, null, 2));
   console.log(JSON.stringify(report));
   await context.close();
  }
 }
} finally { await browser.close(); }
await writeFile(`${directory}/performance.json`, JSON.stringify(reports, null, 2));
