/** Prefix Markdown links and images for GitHub Pages subdirectory deployments. */
export function baseLinks(base) {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  return function rehypeBaseLinks() {
    return function transform(tree) {
      function visit(node) {
        if (node.type === 'element' && node.properties) {
          for (const key of ['href', 'src']) {
            const value = node.properties[key];
            if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && prefix && !value.startsWith(`${prefix}/`)) {
              node.properties[key] = `${prefix}${value}`;
            }
          }
        }
        if (node.children) node.children.forEach(visit);
      }
      visit(tree);
    };
  };
}
