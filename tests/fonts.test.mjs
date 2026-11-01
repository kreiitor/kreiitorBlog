import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// 与 scripts/prepare-fonts.py 收集的范围一致：src 下所有会渲染出中文的源文件。
const SOURCE_EXTENSIONS = new Set(['.md', '.mdx', '.astro', '.ts', '.json']);

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* walk(path);
		else if (SOURCE_EXTENSIONS.has(path.slice(path.lastIndexOf('.')))) yield path;
	}
}

function parseRanges(value) {
	return value.split(',').map(part => {
		const [start, end = start] = part.trim().replace(/^U\+/i, '').split('-');
		return [parseInt(start, 16), parseInt(end, 16)];
	});
}

function coverage(css, weight) {
	const ranges = [];
	for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
		if (!block.includes("'Journal Serif SC'") || !block.includes(`font-weight: ${weight};`)) continue;
		const range = block.match(/unicode-range:\s*([^;]+);/);
		if (range) ranges.push(...parseRanges(range[1]));
	}
	return codePoint => ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

const used = new Set();
for (const file of walk('src')) {
	for (const char of readFileSync(file, 'utf8')) {
		const codePoint = char.codePointAt(0);
		if (codePoint >= 0x3400 && codePoint <= 0x9fff) used.add(char);
	}
}
const css = readFileSync('src/styles/fonts.css', 'utf8');

for (const weight of [400, 600]) {
	test(`Journal Serif SC ${weight} covers every Han character on the site`, () => {
		const covered = coverage(css, weight);
		const missing = [...used].filter(char => !covered(char.codePointAt(0)));
		assert.equal(missing.length, 0, `${weight} 字重缺 ${missing.length} 个字：${missing.slice(0, 60).join('')}。运行 npm run fonts:prepare`);
	});
}

test('No CJK font face is declared without being used', () => {
	assert.doesNotMatch(css, /Journal Kai SC/);
});

test('Font declarations match the committed asset manifest', () => {
	const manifest = JSON.parse(readFileSync('docs/font-manifest.json', 'utf8'));
	const declared = [...css.matchAll(/url\('\.\.\/assets\/fonts\/([^']+)'\)/g)].map(match => match[1]);
	assert.deepEqual([...new Set(declared)].sort(), Object.keys(manifest.files).sort());
	for (const name of declared) {
		const data = readFileSync(join('src/assets/fonts', name));
		assert.equal(data.length, manifest.files[name].bytes, `${name}: incorrect size`);
		assert.equal(createHash('sha256').update(data).digest('hex'), manifest.files[name].sha256, `${name}: incorrect hash`);
	}
});
