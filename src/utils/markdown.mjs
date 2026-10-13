import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { baseLinks } from './rehype-base-links.mjs';
import { journalCodeTheme } from '../styles/code-theme.mjs';

function contentStructure() {
 return tree => {
  function visit(node) {
   if (node.type === 'heading' && node.depth === 1) throw new Error('正文请从二级标题（##）开始；页面标题由 frontmatter 的 title 提供。');
   for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
 };
}

/**
 * Shared by content collections and the statically paginated reading pages.
 * @returns {import('@astrojs/markdown-remark').UnifiedProcessorOptions & import('@astrojs/markdown-remark').AstroMarkdownOptions}
 */
export function markdownOptions(base = '/') {
 return {
  shikiConfig: { theme: journalCodeTheme, langAlias: { gitignore: 'text' } },
  remarkPlugins: [remarkMath, contentStructure],
  rehypePlugins: [[rehypeKatex, { strict: 'ignore', throwOnError: true }], baseLinks(base)],
 };
}
