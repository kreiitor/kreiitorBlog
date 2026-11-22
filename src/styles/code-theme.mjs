/** Warm Porcelain light Shiki palette matched to #f0eee8.
 * Every foreground token clears WCAG AA (>= 4.5:1) against #f0eee8.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'porcelain-light',
 type: 'light',
 colors: {
  'editor.background': '#f0eee8',
  'editor.foreground': '#18181b',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5f5f66', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#2f5268' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#2d6a54' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#9e331f' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#3d4e7a' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#18181b' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#52525b' } },
  { scope: ['invalid'], settings: { foreground: '#b42318' } },
 ],
};

/** Warm Obsidian dark Shiki palette matched to #161614.
 * Every foreground token clears WCAG AA (>= 4.5:1) against #161614.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeThemeDark = {
 name: 'porcelain-dark',
 type: 'dark',
 colors: {
  'editor.background': '#161614',
  'editor.foreground': '#eeede9',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#9d9a91', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#8cb4cb' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#6ec4a3' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#e08c75' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#b4d2e3' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#eeede9' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#9d9a91' } },
  { scope: ['invalid'], settings: { foreground: '#f28b82' } },
 ],
};
