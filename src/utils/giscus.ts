const clean = (value: string | undefined) => value?.trim() ?? '';

export const giscusConfig = {
	repo: clean(import.meta.env.PUBLIC_GISCUS_REPO),
	repoId: clean(import.meta.env.PUBLIC_GISCUS_REPO_ID),
	category: clean(import.meta.env.PUBLIC_GISCUS_CATEGORY),
	categoryId: clean(import.meta.env.PUBLIC_GISCUS_CATEGORY_ID),
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
