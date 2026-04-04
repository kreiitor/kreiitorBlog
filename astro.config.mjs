// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
	process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}` : '/');

export default defineConfig({
	site: process.env.SITE_URL ?? 'https://example.github.io',
	base,
	output: 'static',
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
