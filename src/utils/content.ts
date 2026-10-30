import type { CollectionEntry } from 'astro:content';
import { canonicalTag } from './tags';
import { resolveCover } from './covers';

export type PostEntry = CollectionEntry<'posts'>;
export type ProjectEntry = CollectionEntry<'projects'>;

export type UpdateEntry =
	| { type: 'post'; title: string; summary: string; href: string; pubDate: Date; tags: string[] }
	| { type: 'project'; title: string; summary: string; href: string; pubDate: Date; tags: string[] };

export function sortByPubDate<T extends { data: { pubDate: Date } }>(items: T[]) {
	return [...items].sort((left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf());
}

export function getPublishedPosts(posts: PostEntry[]) {
	return sortByPubDate(posts.filter((post) => !post.data.draft));
}

export function getProjects(projects: ProjectEntry[]) {
	return sortByPubDate(projects);
}

export function getFeaturedPosts(posts: PostEntry[], limit = 3) {
	return getPublishedPosts(posts)
		.filter((post) => post.data.featured)
		.slice(0, limit);
}

export function getFeaturedProjects(projects: ProjectEntry[], limit = 3) {
	return getProjects(projects)
		.filter((project) => project.data.featured)
		.slice(0, limit);
}

export function estimateReadingTime(text: string) {
	const hanCharacters = (text.match(/\p{Script=Han}/gu) ?? []).length;
	const latinWords = (text.replace(/\p{Script=Han}/gu, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
	return Math.max(1, Math.ceil((hanCharacters + latinWords) / 300));
}

export function getReadingTime(post: PostEntry) {
	return post.data.readingTime ?? estimateReadingTime(post.body ?? '');
}

/** Explicit artwork always wins; infer a subject only when no cover is chosen. */
export function getPostCover(post: PostEntry) {
	if (post.data.cover) return resolveCover(post.data.cover);
	if (post.id.includes('infra')) return resolveCover('/covers/series-ai-infra.svg');
	if (/reading|literature|annotation|paper/.test(post.id)) return resolveCover('/covers/post-paper.svg');
	if (/algorithm|career|roadmap/.test(post.id)) return resolveCover('/covers/post-code-algorithm.svg');
	return resolveCover(post.data.category === 'knowledge' ? '/covers/post-tools.svg' : '/covers/post-paper.svg');
}

/** Preserve readable TOC labels before KaTeX adds visual and accessibility copies. */
export function getHeadingLabels(markdown: string, maxDepth = 2) {
	const labels: string[] = [];
	let fence: string | undefined;
	for (const line of markdown.split('\n')) {
		const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
		if (marker) {
			if (!fence) fence = marker[1][0];
			else if (fence === marker[1][0]) fence = undefined;
			continue;
		}
		if (fence) continue;
		const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
		if (heading && heading[1].length <= maxDepth) {
			labels.push(heading[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'));
		}
	}
	return labels;
}

export function getTagIndex(posts: PostEntry[], projects: ProjectEntry[]) {
	const index = new Map<string, { posts: PostEntry[]; projects: ProjectEntry[] }>();

	for (const post of getPublishedPosts(posts)) {
		for (const tag of new Set(post.data.tags.map(canonicalTag))) {
			const current = index.get(tag) ?? { posts: [], projects: [] };
			current.posts.push(post);
			index.set(tag, current);
		}
	}

	for (const project of getProjects(projects)) {
		for (const tag of new Set(project.data.tags.map(canonicalTag))) {
			const current = index.get(tag) ?? { posts: [], projects: [] };
			current.projects.push(project);
			index.set(tag, current);
		}
	}

	return index;
}

export function getTagSummaries(posts: PostEntry[], projects: ProjectEntry[]) {
	return [...getTagIndex(posts, projects).entries()]
		.map(([tag, record]) => ({
			tag,
			count: record.posts.length + record.projects.length,
			postCount: record.posts.length,
			projectCount: record.projects.length,
		}))
		.sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag, 'zh-Hans-CN'));
}

export function getArchiveGroups(posts: PostEntry[]) {
	const groups = new Map<
		string,
		{
			year: string;
			items: PostEntry[];
		}
	>();

	for (const post of getPublishedPosts(posts)) {
		const year = String(post.data.pubDate.getFullYear());
		const current = groups.get(year) ?? { year, items: [] };
		current.items.push(post);
		groups.set(year, current);
	}

	return [...groups.values()].sort((left, right) => Number(right.year) - Number(left.year));
}

/**
 * 相关文章：本地按「共享标签数 ×2 + 同系列 ×3」打分，只保留至少共享一个标签的文章。
 * 刻意不引入第二个搜索后端 —— 语料里 eugeneyan 的相关阅读绑死 Algolia Recommend
 * （容器初始 display:none，需索引 + 前端 SDK），而我们已有 Pagefind，
 * 多一套后端是纯负担。同系列权重更高，因为连载章节的关联强于偶发同标签。
 */
export function getRelatedPosts(post: PostEntry, posts: PostEntry[], limit = 3): PostEntry[] {
	const own = new Set(post.data.tags);
	return getPublishedPosts(posts)
		.filter((candidate) => candidate.id !== post.id)
		.map((candidate) => {
			const shared = candidate.data.tags.filter((tag) => own.has(tag)).length;
			const sameSeries = post.data.series && candidate.data.series === post.data.series ? 1 : 0;
			return { candidate, shared, score: shared * 2 + sameSeries * 3 };
		})
		.filter((item) => item.shared > 0)
		.sort(
			(left, right) =>
				right.score - left.score ||
				right.candidate.data.pubDate.valueOf() - left.candidate.data.pubDate.valueOf(),
		)
		.slice(0, limit)
		.map((item) => item.candidate);
}

export function getLatestUpdates(posts: PostEntry[], projects: ProjectEntry[], limit = 5): UpdateEntry[] {	const merged: UpdateEntry[] = [
		...getPublishedPosts(posts).map((post) => ({
			type: 'post' as const,
			title: post.data.title,
			summary: post.data.description,
			href: `/blog/${post.id}/`,
			pubDate: post.data.pubDate,
			tags: post.data.tags,
		})),
		...getProjects(projects).map((project) => ({
			type: 'project' as const,
			title: project.data.title,
			summary: project.data.summary,
			href: `/projects/${project.id}/`,
			pubDate: project.data.pubDate,
			tags: project.data.tags,
		})),
	];

	return merged.sort((left, right) => right.pubDate.valueOf() - left.pubDate.valueOf()).slice(0, limit);
}
