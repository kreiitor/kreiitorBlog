import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2] ?? 'after';
const base = process.env.PREVIEW_URL ?? 'http://localhost:4321/';
const directory = `.artifacts/warm-garden/${phase}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const reports = [];
for (const width of [1440, 390]) {
 for (const route of ['', 'blog/fods-linear-algebra-calculus-convexity/']) {
  for (let run = 0; run < 3; run++) {
   const context = await browser.newContext({ viewport: { width, height: 1000 } });
   const page = await context.newPage();
   await page.addInitScript(() => {
    window.auditMetrics = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 };
    for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
     new PerformanceObserver(list => { for (const entry of list.getEntries()) {
      if (type === 'largest-contentful-paint') window.auditMetrics.lcp = entry.startTime;
      if (type === 'layout-shift' && !entry.hadRecentInput) window.auditMetrics.cls += entry.value;
      if (type === 'longtask') { window.auditMetrics.longTasks++; window.auditMetrics.longTaskMs += entry.duration; }
     } }).observe({ type, buffered: true });
    }
   });
   await page.goto(new URL(route, base).href);
   await page.evaluate(() => document.fonts.ready);
   await page.waitForTimeout(1500);
   const metrics = await page.evaluate(() => ({ ...window.auditMetrics,
    dom: document.querySelectorAll('*').length,
    htmlBytes: performance.getEntriesByType('navigation')[0].decodedBodySize,
    loadMs: performance.getEntriesByType('navigation')[0].loadEventEnd,
    transferBytes: [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce((sum, e) => sum + e.transferSize, 0),
    fonts: performance.getEntriesByType('resource').filter(e => /woff/.test(e.name)).map(e => e.name),
    inlineScrollContainers: [...document.querySelectorAll('.rich-content .katex:not(.katex-display .katex)')].filter(e => getComputedStyle(e).overflowX === 'auto').length
   }));
   reports.push({ width, route, run, ...metrics });
   if (run === 0) await page.screenshot({ path: `${directory}/${route ? 'math' : 'home'}-${width}.png`, fullPage: !route });
   await context.close();
  }
 }
}
await writeFile(`${directory}/metrics.json`, JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports.map(({fonts,...report}) => report), null, 2));
await browser.close();
