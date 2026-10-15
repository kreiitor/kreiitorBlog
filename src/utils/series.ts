import type { CollectionEntry } from 'astro:content';
import type { PostEntry } from './content';

export const DEFAULT_SERIES_COVER = '/covers/series-research.svg';

export interface LearningSeries {
	entry: CollectionEntry<'series'>;
	chapters: PostEntry[];
}

/** One shared index for cards, directory pages and article navigation. */
export function getLearningSeries(entries: CollectionEntry<'series'>[], posts: PostEntry[]): LearningSeries[] {
	const byId = new Map(entries.map(entry => [entry.id, { entry, chapters: [] as PostEntry[] }]));
	for (const item of byId.values()) {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.entry.id)) {
			throw new Error(`系列文件名必须使用小写英文、数字和连字符：${item.entry.id}`);
		}
	}
	for (const post of posts) {
		if (post.data.draft || !post.data.series) continue;
		const group = byId.get(post.data.series);
		if (!group) throw new Error(`文章 ${post.id} 的系列 ${post.data.series} 缺少 src/content/series/ 中的配置。`);
		if (post.data.order === undefined) throw new Error(`系列文章 ${post.id} 缺少 order。`);
		if (group.chapters.some(chapter => chapter.data.order === post.data.order)) {
			throw new Error(`系列 ${post.data.series} 的章节 order ${post.data.order} 重复。`);
		}
		group.chapters.push(post);
	}
	return [...byId.values()]
		.filter(group => group.chapters.length > 0)
		.map(group => ({ ...group, chapters: group.chapters.sort((a, b) => a.data.order! - b.data.order!) }))
		.sort((a, b) => a.entry.data.order - b.entry.data.order || a.entry.id.localeCompare(b.entry.id));
}
