import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { markdownOptions } from './markdown.mjs';

const rendererByBase = new Map();
const articleCache = new Map();
const ELEMENT_BUDGET = 10000;
const TEXT_BUDGET = 12500;

function size(node) {
 let elements = node.type === 'element' ? 1 : 0;
 let text = node.type === 'text' ? node.value.length : 0;
 for (const child of node.children ?? []) {
  const childSize = size(child);
  elements += childSize.elements;
  text += childSize.text;
 }
 return { elements, text };
}

/** Never split a list, table, code block or formula; every part is valid HTML. */
export function splitReadingHtml(html, budget = ELEMENT_BUDGET, textBudget = TEXT_BUDGET) {
 const tree = fromHtml(html, { fragment: true });
 const total = size(tree);
 if (total.elements <= budget && total.text <= textBudget) return [{ html, title: '', elements: total.elements }];
 const sections = [];
 let section = { nodes: [], title: '', elements: 0, text: 0 };
 for (const node of tree.children) {
  const heading = node.type === 'element' && /^h[234]$/.test(node.tagName);
  if (heading && section.nodes.length && section.elements) {
   sections.push(section);
   section = { nodes: [], title: '', elements: 0, text: 0 };
  }
  const weight = size(node);
  if ((section.elements + weight.elements > budget || section.text + weight.text > textBudget) && section.elements) {
   sections.push(section);
   section = { nodes: [], title: section.title, elements: 0, text: 0 };
  }
  if (heading) section.title = plainText(node);
  section.nodes.push(node);
  section.elements += weight.elements;
  section.text += weight.text;
 }
 if (section.elements) sections.push(section);
 const groups = [];
 let group = { nodes: [], title: '', elements: 0, text: 0 };
 for (const section of sections) {
  if ((group.elements + section.elements > budget || group.text + section.text > textBudget) && group.elements) {
   groups.push(group);
   group = { nodes: [], title: '', elements: 0, text: 0 };
  }
  if (!group.title) group.title = section.title;
  group.nodes.push(...section.nodes);
  group.elements += section.elements;
  group.text += section.text;
 }
 if (group.elements) groups.push(group);
 return groups.map(group => ({ html: toHtml({ type: 'root', children: group.nodes }), title: group.title, elements: group.elements }));
}

function plainText(node) {
 if (node.type === 'text') return node.value;
 if (node.type === 'element' && (node.tagName === 'math' || node.properties?.ariaHidden === 'true')) return '';
 return (node.children ?? []).map(plainText).join('');
}

/**
 * @param {import('./content').PostEntry} post
 * @param {string} base
 * @returns {Promise<{parts: {html:string,title:string,elements:number,number:number,path:string}[], headings: {depth:number,slug:string,text:string,part:number}[], allHeadings: {depth:number,slug:string,text:string,part:number}[]}>}
 */
export async function getReadingParts(post, base = '/') {
 const key = `${base}:${post.id}`;
 const cached = articleCache.get(key);
 if (!cached || cached.body !== post.body) {
  const promise = (async () => {
   let rendered;
   if (post.rendered?.html && !post.rendered.metadata?.imagePaths?.length) {
    rendered = { code:post.rendered.html, metadata:post.rendered.metadata };
   } else {
    if (!rendererByBase.has(base)) rendererByBase.set(base, createMarkdownProcessor(markdownOptions(base)));
    const renderer = await rendererByBase.get(base);
    rendered = await renderer.render(post.body ?? '', { frontmatter: post.data });
   }
   const parts = splitReadingHtml(rendered.code).map((part, index) => ({ ...part, number: index + 1, path: readingPath(post.id, index + 1) }));
   const allHeadings = rendered.metadata.headings.map(heading => ({
    ...heading,
    part: parts.findIndex(part => part.html.includes(`id="${heading.slug}"`)) + 1,
   }));
   const prefix = base === '/' ? '' : base.replace(/\/$/, '');
   const destinations = new Map(allHeadings.map(h => [h.slug, `${prefix}${readingPath(post.id, h.part)}#${h.slug}`]));
   for (const part of parts) {
    part.html = part.html.replace(/(<a\b[^>]*\bhref=")#([^"]+)"/g, (match, start, fragment) => {
     let slug = fragment;
     try { slug = decodeURIComponent(fragment); } catch {}
     const heading = allHeadings.find(h => h.slug === slug);
     return heading && heading.part !== part.number ? `${start}${destinations.get(slug)}"` : match;
    });
   }
   return { parts, headings: allHeadings.filter(h => h.depth === 2), allHeadings };
  })();
  articleCache.set(key,{body:post.body,promise});
 }
 return articleCache.get(key).promise;
}

export function readingPath(slug, number = 1) {
 return number === 1 ? `/blog/${slug}/` : `/blog/${slug}/${number}/`;
}
