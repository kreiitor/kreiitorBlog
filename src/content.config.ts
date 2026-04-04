import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).min(1),
		draft: z.boolean().default(false),
		cover: z.string().optional(),
		readingTime: z.number().int().positive().optional(),
		featured: z.boolean().optional(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).min(1),
		status: z.enum(['规划中', '进行中', '已完成']),
		featured: z.boolean(),
		repoUrl: z.url().optional(),
		demoUrl: z.url().optional(),
		cover: z.string().optional(),
	}),
});

export const collections = { posts, projects };
