import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';
import { getPublishedPosts } from '../utils/content';
import { withBase } from '../utils/url';

export async function GET(context: APIContext) {
	const posts = getPublishedPosts(await getCollection('posts'));

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site ?? siteConfig.siteUrl,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: withBase(`/blog/${post.id}/`),
		})),
	});
}
