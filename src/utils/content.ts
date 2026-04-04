import type { CollectionEntry } from 'astro:content';

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

export function getTagIndex(posts: PostEntry[], projects: ProjectEntry[]) {
	const index = new Map<string, { posts: PostEntry[]; projects: ProjectEntry[] }>();

	for (const post of getPublishedPosts(posts)) {
		for (const tag of post.data.tags) {
			const current = index.get(tag) ?? { posts: [], projects: [] };
			current.posts.push(post);
			index.set(tag, current);
		}
	}

	for (const project of getProjects(projects)) {
		for (const tag of project.data.tags) {
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

export function getLatestUpdates(posts: PostEntry[], projects: ProjectEntry[], limit = 5): UpdateEntry[] {
	const merged: UpdateEntry[] = [
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
