/** A light Shiki palette matched to the journal's paper and ink colors.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'research-paper',
 type: 'light',
 colors: {
  'editor.background': '#f1e8d8',
  'editor.foreground': '#3b3024',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6f5d47', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#7a4a5e' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#3f6b3f' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#8a5a2b' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#3d6260' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#3b3024' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#5f4f3c' } },
  { scope: ['invalid'], settings: { foreground: '#9a3f3f' } },
 ],
};

/** The same scope map as {@link journalCodeTheme}, re-tuned for a warm dark page.
 * Every value clears 4.5:1 against #1a1611 and keeps the light theme's hue.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeThemeDark = {
 name: 'research-paper-dark',
 type: 'dark',
 colors: {
  'editor.background': '#1a1611',
  'editor.foreground': '#f4ebdc',
 },
 tokenColors: [
  // contrast against #1a1611 (WCAG 2.x relative luminance): all >= 4.5:1
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#b9a78e', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#d8bfe0' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#bcd3a3' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#e8d39a' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#b9d0c4' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#f4ebdc' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#b9a78e' } },
  { scope: ['invalid'], settings: { foreground: '#e8a0a0' } },
 ],
};
