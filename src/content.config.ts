import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { canonicalTag } from './utils/tags';

const posts = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).min(1).transform(tags => [...new Set(tags.map(canonicalTag))]),
		draft: z.boolean().default(false),
		cover: z.string().optional(),
		readingTime: z.number().int().positive().optional(),
		featured: z.boolean().optional(),
		category: z.enum(['writing', 'knowledge', 'course']).default('writing'),
		series: z.string().optional(),
		order: z.number().int().optional(),
	}).superRefine((post, ctx) => {
		if (post.category === 'course' && (!post.series || post.order === undefined)) {
			ctx.addIssue({ code: 'custom', message: '学习章节必须填写 series 和 order。' });
		}
	}),
});

const series = defineCollection({
	loader: glob({ pattern: '[^_]*.md', base: './src/content/series' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		englishTitle: z.string().optional(),
		emblem: z.string().default('↳'),
		order: z.number().int().default(0),
		facts: z.string().optional(),
		sourceNote: z.string().optional(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).min(1).transform(tags => [...new Set(tags.map(canonicalTag))]),
		status: z.enum(['规划中', '进行中', '已完成']),
		featured: z.boolean(),
		repoUrl: z.url().optional(),
		demoUrl: z.url().optional(),
		cover: z.string().optional(),
	}),
});

export const collections = { posts, projects, series };
