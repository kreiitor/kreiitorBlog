// 完整验证：单元测试与 Astro（构建 + 类型检查）两条线并行执行。
// build 与 check 串行共享 .astro/ 缓存，避免并行写入 data-store.json 冲突。
import { spawn } from 'node:child_process';

const started = performance.now();
const env = { ...process.env, FORCE_COLOR: '0', ASTRO_TELEMETRY_DISABLED: '1' };
const run = (label, command) => new Promise(resolve => {
	const begin = performance.now();
	const child = spawn(command, { shell: true, env });
	let output = '';
	child.stdout.on('data', chunk => { output += chunk; });
	child.stderr.on('data', chunk => { output += chunk; });
	child.on('close', code => resolve({ label, code, output, seconds: (performance.now() - begin) / 1000 }));
});

const astroTrack = async () => {
	const buildResult = await run('构建与站点检查', 'npm run build --silent');
	const checkResult = await run('类型检查', 'npm run check --silent');
	return [checkResult, buildResult];
};

const [unitResult, astroResults] = await Promise.all([
	run('单元测试', 'npm run test:unit --silent'),
	astroTrack(),
]);

const results = [astroResults[0], unitResult, astroResults[1]];
for (const { label, code, output, seconds } of results) {
	const summary = output.trim().split('\n').filter(line => /errors|pass |fail |checks passed|Site checks/.test(line)).slice(-2).join(' | ');
	console.log(`${code === 0 ? '✓' : '✗'} ${label.padEnd(8, '　')} ${seconds.toFixed(1).padStart(5)}s  ${summary}`);
	if (code !== 0) console.log(output.trim().split('\n').slice(-30).join('\n'));
}
console.log(`完整验证用时 ${((performance.now() - started) / 1000).toFixed(1)}s`);
process.exitCode = results.some(result => result.code !== 0) ? 1 : 0;
