import type { APIRoute } from 'astro';
import { siteConfig } from '../data/site';
import { withBase } from '../utils/url';

export const GET: APIRoute = ({ site }) => {
	const origin = site ?? new URL(siteConfig.siteUrl);
	const sitemapUrl = new URL(withBase('/sitemap-index.xml'), origin).toString();
	const searchPath = withBase('/search/');
	return new Response(
		`User-agent: *\nAllow: /\nDisallow: ${searchPath}\n\nSitemap: ${sitemapUrl}\n`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
	);
};
