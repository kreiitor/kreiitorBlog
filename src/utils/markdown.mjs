import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { baseLinks } from './rehype-base-links.mjs';
import { journalCodeTheme, journalCodeThemeDark } from '../styles/code-theme.mjs';

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
 * Shared by content collections and full single-page articles.
 * @returns {import('@astrojs/markdown-remark').UnifiedProcessorOptions & import('@astrojs/markdown-remark').AstroMarkdownOptions}
 */
export function markdownOptions(base = '/') {
 return {
  // Dual-theme output: the light palette stays as literal inline styles and Shiki
  // adds --shiki-dark / --shiki-dark-bg variables for the dark palette. The
  // switcher that consumes them (with !important) lives in global.css.
  shikiConfig: {
   themes: { light: journalCodeTheme, dark: journalCodeThemeDark },
   langAlias: { gitignore: 'text' },
  },
  remarkPlugins: [remarkMath, contentStructure],
  rehypePlugins: [[rehypeKatex, { strict: 'ignore', throwOnError: true }], baseLinks(base)],
  // remark-gfm 由 Astro 默认注入，所以 [^1] 脚注语法本来就能解析。
  // 但它的文末标签默认是 <h2 class="sr-only" id="footnote-label">Footnotes</h2>，
  // 而我们的页内目录取 depth<=3 —— 那样每篇用脚注的文章都会多出一个假目录条目（已实测复现）。
  // 改 tag 名并本地化文案，即可让标签完全避开目录，同时保留 aria-describedby 指向。
  remarkRehype: { footnoteLabel: '脚注', footnoteLabelTagName: 'p' },
 };
}
