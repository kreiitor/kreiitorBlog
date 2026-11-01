// 阅读位置记录的存储约定：文章页（ReadingTools）写，专题页读。
// 只在用户主动开启后才写入；全站开关让同一专题的其他章节自动沿用这一选择。
export interface ReadingPosition { id: string; fraction: number; progress: number; updatedAt?: number; }
export interface ReadingRecord { enabled: boolean; position?: ReadingPosition; }

const base = () => import.meta.env.BASE_URL;
export const articleKey = (slug: string) => `garden-reading:${base()}:${slug}`;
export const preferenceKey = () => `garden-reading-pref:${base()}`;
/** 读到 95% 以上算读完：文末通常是延伸阅读和评论区。 */
export const FINISHED = 95;

export function readRecord(slug: string): ReadingRecord | undefined {
 try {
  const data = JSON.parse(localStorage.getItem(articleKey(slug)) ?? 'null');
  if (!data || typeof data !== 'object') return undefined;
  const position = data.position;
  const valid = position && typeof position.id === 'string' && Number.isFinite(position.fraction) && Number.isFinite(position.progress);
  return { enabled: data.enabled === true, position: valid ? position : undefined };
 } catch { return undefined; }
}

export function readPreference() {
 try { return localStorage.getItem(preferenceKey()) === 'on'; } catch { return false; }
}

export function writePreference(enabled: boolean) {
 try { if (enabled) localStorage.setItem(preferenceKey(), 'on'); else localStorage.removeItem(preferenceKey()); } catch { /* 存储不可用时只影响跨章节沿用 */ }
}
