// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { markdownOptions } from './src/utils/markdown.mjs';
import { tagAliases } from './src/utils/tags';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
	process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}` : '/');
// Configure the deployment origin and subdirectory separately.
const site = process.env.SITE_URL ?? 'https://kreiitor.github.io';

export default defineConfig({
	site,
	base,
	output: 'static',
	trailingSlash: 'always',
	devToolbar: { enabled: false },
	integrations: [sitemap({ filter: url => {
		const pathname = new URL(url).pathname;
		const tag = pathname.match(/\/tags\/([^/]+)\/?$/)?.[1];
		return !/\/(?:search|404)\/?$/.test(pathname) && !(tag && Object.hasOwn(tagAliases,decodeURIComponent(tag)));
	} })],
	markdown: {
		shikiConfig: markdownOptions(base).shikiConfig,
		processor: unified(markdownOptions(base)),
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			cssCodeSplit: true,
			assetsInlineLimit: 0,
		},
	},
});
