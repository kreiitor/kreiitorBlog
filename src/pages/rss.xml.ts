import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';
import { getPublishedPosts } from '../utils/content';
import { withBase } from '../utils/url';

export async function GET(context: APIContext) {
	const posts = getPublishedPosts(await getCollection('posts'));
	// Astro's `context.site` is the configured origin only: `base` is not part of it,
	// so under a subdirectory deploy the channel <link> would point at the domain root.
	// Resolving `withBase('/')` against that origin gives the real site entry point
	// while keeping the helper (and therefore the item links below) as the single
	// source of truth for the base path.
	const site = new URL(withBase('/'), context.site ?? siteConfig.siteUrl);

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: withBase(`/blog/${post.id}/`),
		})),
	});
}
