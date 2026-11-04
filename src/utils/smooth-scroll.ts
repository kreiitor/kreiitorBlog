// 站内锚点跳转：先加速、再减速（easeInOutCubic），时长随距离增长但有上限。
// 读者一旦滚轮、触摸或按键，就把控制权交还给读者。减少动态效果时直接跳到目标。
const easeInOutCubic = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cancelCurrent: (() => void) | undefined;
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

// 与浏览器原生 hash 跳转一致：落点 = 根元素 scroll-padding-top + 目标自身 scroll-margin-top。
function scrollOffset(target: HTMLElement) {
 const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
 const margin = parseFloat(getComputedStyle(target).scrollMarginTop);
 return (Number.isFinite(padding) ? padding : 0) + (Number.isFinite(margin) ? margin : 0);
}

export function scrollToElement(target: HTMLElement, { onDone }: { onDone?: () => void } = {}) {
 cancelCurrent?.();
 const startY = scrollY;
 // 偏移量在开始时算一次；目标位置每帧重新测量，折叠目录、图片加载等布局变化不会让落点偏掉。
 const offset = scrollOffset(target);
 const endOf = () => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, target.getBoundingClientRect().top + scrollY - offset));
 const distance = endOf() - startY;
 if (reduced.matches || Math.abs(distance) < 2) { scrollTo({ top: endOf(), behavior: 'instant' }); onDone?.(); return; }
 const duration = Math.min(900, Math.max(360, 260 + Math.sqrt(Math.abs(distance)) * 12));
 const startTime = performance.now();
 let frame = 0;
 // 只有会滚动页面的键才打断动画；Tab、Shift 这类按键不算读者接管。
 const onKey = (event: KeyboardEvent) => { if (scrollKeys.has(event.key)) stop(); };
 const stop = () => {
  cancelAnimationFrame(frame);
  for (const type of ['wheel', 'touchstart', 'pointerdown'] as const) removeEventListener(type, stop);
  removeEventListener('keydown', onKey);
  if (cancelCurrent === stop) cancelCurrent = undefined;
 };
 for (const type of ['wheel', 'touchstart', 'pointerdown'] as const) addEventListener(type, stop, { passive: true });
 addEventListener('keydown', onKey, { passive: true });
 cancelCurrent = stop;
 const step = (now: number) => {
  const progress = Math.min(1, (now - startTime) / duration);
  scrollTo({ top: startY + (endOf() - startY) * easeInOutCubic(progress), behavior: 'instant' });
  if (progress < 1) frame = requestAnimationFrame(step);
  else { stop(); requestAnimationFrame(() => { scrollTo({ top: endOf(), behavior: 'instant' }); onDone?.(); }); }
 };
 frame = requestAnimationFrame(step);
}

/** 接管同页 hash 链接：动画滚动，更新地址栏，并把焦点交给目标标题（不再触发滚动）。 */
export function enhanceAnchor(link: HTMLAnchorElement, before?: () => void) {
 link.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  let target: HTMLElement | null = null;
  try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
  if (!target) return;
  event.preventDefault();
  before?.();
  if (location.hash !== link.hash) { history.pushState(null, '', link.hash); dispatchEvent(new HashChangeEvent('hashchange')); }
  scrollToElement(target, { onDone: () => {
   if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.tabIndex = -1;
   target.focus({ preventScroll: true });
  } });
 });
}
