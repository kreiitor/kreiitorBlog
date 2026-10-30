/**
 * 首页主视觉的「线索」画布：若干细线从左侧出发，摆动着汇聚到右侧一个焦点，
 * 少数几条用朱砂色，线上有缓慢移动的光点。焦点会轻微跟随指针。
 * 只在画布可见且页面处于前台时逐帧绘制；减少动态效果时只画一帧静止画面。
 */
interface Thread {
	y0: number;
	amp: number;
	freq: number;
	phase: number;
	speed: number;
	accent: boolean;
	dot: number;
	dotSpeed: number;
}

const INK = '236, 230, 218';
const ACCENT = '242, 137, 107';

function createThreads(count: number): Thread[] {
	let seed = 7;
	const random = () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
	return Array.from({ length: count }, (_, index) => ({
		y0: (index + 0.5) / count,
		amp: 18 + random() * 46,
		freq: 1.6 + random() * 2.6,
		phase: random() * Math.PI * 2,
		speed: 0.18 + random() * 0.32,
		accent: index % 7 === 3,
		dot: random(),
		dotSpeed: 0.028 + random() * 0.05,
	}));
}

export function mountThreads(canvas: HTMLCanvasElement, reduced: MediaQueryList) {
	const context = canvas.getContext('2d');
	const host = canvas.parentElement;
	if (!context || !host) return;
	let width = 0;
	let height = 0;
	let threads: Thread[] = [];
	let frame = 0;
	let visible = true;
	let last = performance.now();
	let time = 0;
	const focus = { x: 0, y: 0, tx: 0, ty: 0 };

	function base() {
		const narrow = width < 700;
		return { x: width * (narrow ? 0.9 : 0.8), y: height * (narrow ? 0.2 : 0.42) };
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		context!.setTransform(ratio, 0, 0, ratio, 0, 0);
		threads = createThreads(width < 700 ? 13 : 24);
		const point = base();
		focus.x = focus.tx = point.x;
		focus.y = focus.ty = point.y;
		draw();
	}

	function pointAt(thread: Thread, t: number) {
		const startX = -40;
		const x = startX + (focus.x - startX) * t;
		const spread = height * 1.25;
		const startY = height / 2 + (thread.y0 - 0.5) * spread;
		const eased = 1 - Math.pow(1 - t, 2.2);
		const wave = Math.sin(t * thread.freq * Math.PI + thread.phase + time * thread.speed) * thread.amp * Math.pow(1 - t, 1.1);
		return { x, y: startY + (focus.y - startY) * eased + wave };
	}

	function draw() {
		context!.clearRect(0, 0, width, height);
		const steps = Math.max(40, Math.round(focus.x / 14));
		for (const thread of threads) {
			const gradient = context!.createLinearGradient(0, 0, focus.x, 0);
			const color = thread.accent ? ACCENT : INK;
			const peak = thread.accent ? 0.55 : 0.2;
			gradient.addColorStop(0, `rgba(${color}, 0)`);
			gradient.addColorStop(0.45, `rgba(${color}, ${peak * 0.35})`);
			gradient.addColorStop(1, `rgba(${color}, ${peak})`);
			context!.strokeStyle = gradient;
			context!.lineWidth = thread.accent ? 1.2 : 0.8;
			context!.beginPath();
			for (let step = 0; step <= steps; step++) {
				const point = pointAt(thread, step / steps);
				if (step === 0) context!.moveTo(point.x, point.y);
				else context!.lineTo(point.x, point.y);
			}
			context!.stroke();
			const dot = pointAt(thread, thread.dot);
			context!.fillStyle = `rgba(${color}, ${(thread.accent ? 0.9 : 0.55) * Math.min(1, thread.dot * 2.2)})`;
			context!.beginPath();
			context!.arc(dot.x, dot.y, thread.accent ? 2.2 : 1.5, 0, Math.PI * 2);
			context!.fill();
		}
		const pulse = (Math.sin(time * 1.6) + 1) / 2;
		const halo = context!.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, 70);
		halo.addColorStop(0, `rgba(${ACCENT}, ${0.28 + pulse * 0.12})`);
		halo.addColorStop(1, `rgba(${ACCENT}, 0)`);
		context!.fillStyle = halo;
		context!.beginPath();
		context!.arc(focus.x, focus.y, 70, 0, Math.PI * 2);
		context!.fill();
		context!.strokeStyle = `rgba(${ACCENT}, ${0.5 - pulse * 0.35})`;
		context!.lineWidth = 1;
		context!.beginPath();
		context!.arc(focus.x, focus.y, 10 + pulse * 14, 0, Math.PI * 2);
		context!.stroke();
		context!.fillStyle = `rgb(${ACCENT})`;
		context!.beginPath();
		context!.arc(focus.x, focus.y, 4.5, 0, Math.PI * 2);
		context!.fill();
	}

	function tick(now: number) {
		frame = 0;
		const delta = Math.min(0.05, (now - last) / 1000);
		last = now;
		time += delta;
		focus.x += (focus.tx - focus.x) * Math.min(1, delta * 3);
		focus.y += (focus.ty - focus.y) * Math.min(1, delta * 3);
		for (const thread of threads) thread.dot = (thread.dot + thread.dotSpeed * delta) % 1;
		draw();
		schedule();
	}

	function schedule() {
		if (frame || reduced.matches || !visible || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function stop() {
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
	}

	host.addEventListener('pointermove', event => {
		if (event.pointerType !== 'mouse') return;
		const rect = canvas.getBoundingClientRect();
		const point = base();
		focus.tx = point.x + (event.clientX - rect.left - point.x) * 0.12;
		focus.ty = point.y + (event.clientY - rect.top - point.y) * 0.18;
	});
	host.addEventListener('pointerleave', () => {
		const point = base();
		focus.tx = point.x;
		focus.ty = point.y;
	});
	new ResizeObserver(() => resize()).observe(canvas);
	new IntersectionObserver(entries => {
		visible = entries.some(entry => entry.isIntersecting);
		if (visible) schedule();
		else stop();
	}).observe(canvas);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : schedule()));
	reduced.addEventListener('change', () => (reduced.matches ? (stop(), draw()) : schedule()));
	resize();
	schedule();
}
