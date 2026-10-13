import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the pure index without requiring Astro's content runtime or extra tools.
const source = await readFile(new URL('../src/utils/series.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { getLearningSeries } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const entry = (id, order = 0) => ({ id, data: { title: id, description: id, order } });
const chapter = (id, series, order, draft = false) => ({ id, data: { series, order, draft } });
const entries = [entry('agent', 10), entry('infra', 20), entry('fods'), entry('empty')];
const posts = [chapter('agent-next', 'agent', 2), chapter('agent-draft', 'agent', 1, true), chapter('agent-start', 'agent', 0), chapter('infra-start', 'infra', 0), chapter('fods-start', 'fods', 0), chapter('plain'), chapter('unconfigured-draft', 'missing', 0, true)];
const groups = getLearningSeries(entries, posts);
assert.deepEqual(groups.map(group => group.entry.id), ['fods', 'agent', 'infra']);
assert.deepEqual(groups[1].chapters.map(post => post.id), ['agent-start', 'agent-next']);
assert.deepEqual(groups[2].chapters.map(post => post.id), ['infra-start']);
assert.deepEqual(getLearningSeries(entries, []), []);
assert.throws(() => getLearningSeries(entries, [chapter('missing', 'unknown', 0)]), /缺少.*配置/);
assert.throws(() => getLearningSeries(entries, [chapter('no-order', 'agent')]), /缺少 order/);
assert.throws(() => getLearningSeries(entries, [chapter('first', 'agent', 0), chapter('duplicate', 'agent', 0)]), /重复/);
assert.throws(() => getLearningSeries([entry('Invalid_ID')], []), /系列文件名/);
console.log('Series checks passed: multiple groups, ordering, draft/empty filtering and invalid metadata.');
