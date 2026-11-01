/** A light Shiki palette matched to the journal's paper and ink colors.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'research-paper',
 type: 'light',
 colors: {
  'editor.background': '#e8e0d0',
  'editor.foreground': '#1d2230',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#675d4c', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#2c4a86' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#2d6648' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#9a3a1c' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#5b3a7a' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#2a2e3a' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#5b5444' } },
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
  'editor.background': '#0e1118',
  'editor.foreground': '#ece6da',
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
