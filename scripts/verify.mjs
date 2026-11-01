// 完整验证：npm run check && npm run test:unit && npm run build 的并行版本。
// 类型检查、单元测试和构建互不依赖，三者同时跑；构建自带的 postbuild（锚点、搜索索引、站点检查）随构建完成。
// 任何一步失败都让整体失败，并打印该步的输出尾部。
import { spawn } from 'node:child_process';

const steps = [
	['类型检查', 'npm run check --silent'],
	['单元测试', 'npm run test:unit --silent'],
	['构建与站点检查', 'npm run build --silent'],
];

const started = performance.now();
const run = ([label, command]) => new Promise(resolve => {
	const begin = performance.now();
	const child = spawn(command, { shell: true, env: { ...process.env, FORCE_COLOR: '0' } });
	let output = '';
	child.stdout.on('data', chunk => { output += chunk; });
	child.stderr.on('data', chunk => { output += chunk; });
	child.on('close', code => resolve({ label, code, output, seconds: (performance.now() - begin) / 1000 }));
});

const results = await Promise.all(steps.map(run));
for (const { label, code, output, seconds } of results) {
	const summary = output.trim().split('\n').filter(line => /errors|pass |fail |checks passed|Site checks/.test(line)).slice(-2).join(' | ');
	console.log(`${code === 0 ? '✓' : '✗'} ${label.padEnd(8, '　')} ${seconds.toFixed(1).padStart(5)}s  ${summary}`);
	if (code !== 0) console.log(output.trim().split('\n').slice(-30).join('\n'));
}
console.log(`完整验证用时 ${((performance.now() - started) / 1000).toFixed(1)}s`);
process.exitCode = results.some(result => result.code !== 0) ? 1 : 0;
