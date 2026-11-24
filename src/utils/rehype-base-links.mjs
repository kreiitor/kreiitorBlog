/** Prefix Markdown links and images (both AST elements and inline HTML blocks) for subpath deployments. */
export function baseLinks(base) {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rawAttrRe = prefix ? new RegExp(`(\\b(?:href|src)=["'])/(?!/)`, 'g') : null;
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
        } else if (node.type === 'raw' && rawAttrRe && typeof node.value === 'string') {
          node.value = node.value.replace(
            new RegExp(`(\\b(?:href|src)=["'])/(?!/)((?!${escaped}(?:/|["']))[^"']*["'])`, 'g'),
            `$1${prefix}/$2`,
          );
        }
        if (node.children) node.children.forEach(visit);
      }
      visit(tree);
    };
  };
}
