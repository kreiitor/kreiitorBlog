const clean = (value: string | undefined) => value?.trim() ?? '';

export const giscusConfig = {
	repo: clean(import.meta.env.PUBLIC_GISCUS_REPO) || 'kreiitor/kreiitorBlog',
	repoId: clean(import.meta.env.PUBLIC_GISCUS_REPO_ID) || 'R_kgDOR5wNCw',
	category: clean(import.meta.env.PUBLIC_GISCUS_CATEGORY) || 'Announcements',
	categoryId: clean(import.meta.env.PUBLIC_GISCUS_CATEGORY_ID) || 'DIC_kwDOR5wNC84C6DIZ',
	mapping: clean(import.meta.env.PUBLIC_GISCUS_MAPPING) || 'pathname',
	strict: clean(import.meta.env.PUBLIC_GISCUS_STRICT) || '0',
	reactionsEnabled: clean(import.meta.env.PUBLIC_GISCUS_REACTIONS_ENABLED) || '1',
	emitMetadata: clean(import.meta.env.PUBLIC_GISCUS_EMIT_METADATA) || '0',
	inputPosition: clean(import.meta.env.PUBLIC_GISCUS_INPUT_POSITION) || 'top',
	lang: clean(import.meta.env.PUBLIC_GISCUS_LANG) || 'zh-CN',
};

export const isGiscusConfigured = Boolean(
	giscusConfig.repo && giscusConfig.repoId && giscusConfig.category && giscusConfig.categoryId,
);

/** The two schemes the site's three-state switch can end up showing. */
export type GiscusColorScheme = 'light' | 'dark';

/**
 * Skins served from `public/` and handed to the widget as its `theme` value.
 * giscus forwards `data-theme` verbatim to giscus.app, which resolves it either as
 * a built-in theme name or as a URL to a stylesheet.
 */
export const giscusThemeFiles: Record<GiscusColorScheme, string> = {
	light: '/giscus-garden.css',
	dark: '/giscus-garden-dark.css',
};

/**
 * giscus' built-in Primer themes, used while the published CSS is not reachable:
 * the widget runs on giscus.app, so a local preview cannot hand it a localhost file.
 */
export const giscusBuiltinThemes: Record<GiscusColorScheme, string> = {
	light: 'light',
	dark: 'dark',
};

const previewHostnames = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isGiscusPreviewHost(hostname: string): boolean {
	return previewHostnames.has(hostname);
}

/**
 * The scheme the site is currently showing. An explicit `<html data-theme>` wins;
 * with the attribute absent the site is in its "follow the system" state, and the OS
 * preference decides.
 */
export function resolveGiscusScheme(dataTheme: string | null, prefersDark: boolean): GiscusColorScheme {
	if (dataTheme === 'light' || dataTheme === 'dark') return dataTheme;
	return prefersDark ? 'dark' : 'light';
}

/**
 * Value for the widget's `theme` parameter: the matching public stylesheet in
 * production, a built-in theme on a preview host.
 */
export function selectGiscusTheme(options: {
	scheme: GiscusColorScheme;
	hostname: string;
	urls: Record<GiscusColorScheme, string>;
}): string {
	const { scheme, hostname, urls } = options;
	return isGiscusPreviewHost(hostname) ? giscusBuiltinThemes[scheme] : urls[scheme];
}
