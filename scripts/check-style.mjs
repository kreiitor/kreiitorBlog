#!/usr/bin/env node
// 插图与文字的“机器味”体检：只报告，不修改。
// 用法：node scripts/check-style.mjs [--strict]
// --strict 时有问题就退出 1，可挂到 CI。

import fs from 'node:fs';
import path from 'node:path';

const strict = process.argv.includes('--strict');
const postDir = 'src/content/posts';
const figDir = 'public/figures';

const figureRules = [
  {id: 'canvas-title', test: (s) => /font-size="2[4-7]"[^>]*>[^<]+<\/text>/.test(s) || /class="title"/.test(s), hint: '画布内大标题：图题交给 figcaption'},
  {id: 'subtitle', test: (s) => /<text x="400" y="(?:5[6-9]|6[0-2])"[^>]*>/.test(s), hint: '居中副标题：和第一段图注重复'},
  {id: 'bullet-list', test: (s) => (s.match(/>•</g) || []).length >= 3, hint: '• 列表当图：多半该写成表格或正文'},
  {id: 'circled-number', test: (s) => /[①②③④⑤⑥⑦⑧]/.test(s), hint: '①②③ 装饰性编号：除非正文按序号引用'},
  {id: 'box-heavy', test: (s) => (s.match(/<rect/g) || []).length >= 10 && (s.match(/<path/g) || []).length <= 2, hint: '满屏等大矩形：没有几何关系，只有卡片'},
  {id: 'text-heavy', test: (s) => [...s.matchAll(/>([^<>]{3,})<\/text>/g)].reduce((a, m) => a + m[1].length, 0) > 320, hint: '图上文字超过 320 字：该拆图或改正文'},
  {id: 'inside-summary', test: (s) => /<text[^>]*y="4[0-4][0-9]"[^>]*>[^<]{12,}<\/text>/.test(s), hint: '底部总结句：图注已经承担了这件事'},
];

const proseRules = [
  {id: 'meta-note', re: /这里(补充|复算|补算|整理|特意|明确指出)|（这里|图内|图侧|图底|原文|本书/g, hint: '编辑过程/出处交代：直接陈述事实'},
  {id: 'ai-connector', re: /换句话说|本质上|值得注意的是|不仅.{0,12}而且|这就解释了|这解释了|一句话总结|一句话说/g, hint: '套话连接词：删掉后句子通常更清楚'},
];

function walk(dir, ext) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const report = {};
for (const rule of figureRules) report[rule.id] = [];
for (const f of walk(figDir, '.svg')) {
  const s = fs.readFileSync(f, 'utf8');
  for (const rule of figureRules) if (rule.test(s)) report[rule.id].push(f);
}

const prose = {};
for (const rule of proseRules) prose[rule.id] = [];
const posts = walk(postDir, '.md').filter((p) => /ai-(agent|infra)/.test(p));
for (const p of posts) {
  const s = fs.readFileSync(p, 'utf8');
  for (const rule of proseRules) {
    const hits = s.match(rule.re);
    if (hits) prose[rule.id].push({file: p, n: hits.length});
  }
}

console.log('插图体检 · 共', walk(figDir, '.svg').length, '张');
for (const rule of figureRules) {
  const list = report[rule.id];
  console.log(`  ${String(list.length).padStart(3)}  ${rule.id.padEnd(15)} ${rule.hint}`);
  if (process.argv.includes('--verbose') && list.length) console.log('       ' + list.slice(0, 8).join('\n       '));
}
console.log('\n文字体检 · 共', posts.length, '篇');
for (const rule of proseRules) {
  const list = prose[rule.id];
  const total = list.reduce((a, x) => a + x.n, 0);
  console.log(`  ${String(total).padStart(3)}  ${rule.id.padEnd(15)} ${rule.hint}  (${list.length} 篇)`);
  if (process.argv.includes('--verbose') && list.length) console.log('       ' + list.slice(0, 8).map((x) => `${x.file} ${x.n}`).join('\n       '));
}

const failures = Object.values(report).reduce((a, l) => a + l.length, 0) + Object.values(prose).reduce((a, l) => a + l.length, 0);
if (strict && failures) {
  console.error('\n风格体检未通过：共', failures, '处。');
  process.exit(1);
}
