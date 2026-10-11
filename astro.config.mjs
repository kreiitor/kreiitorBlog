// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { baseLinks } from './src/utils/rehype-base-links.mjs';
import { unified } from '@astrojs/markdown-remark';
import { journalCodeTheme } from './src/styles/code-theme.mjs';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
	process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}` : '/');

export default defineConfig({
	site: process.env.SITE_URL ?? 'https://kreiitor.github.io',
	base,
	output: 'static',
	trailingSlash: 'always',
	devToolbar: { enabled: false },
	integrations: [sitemap()],
	markdown: {
		shikiConfig: { theme: journalCodeTheme, langAlias: { gitignore: 'text' } },
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [[rehypeKatex, { strict: 'ignore', throwOnError: false }], baseLinks(base)],
		}),
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
