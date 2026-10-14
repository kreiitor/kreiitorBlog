/** A light Shiki palette matched to the journal's paper and ink colors.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'research-paper',
 type: 'light',
 colors: {
  'editor.background': '#eee8dd',
  'editor.foreground': '#35382f',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#62685b', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#745168' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#426039' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#80542f' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#315d63' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#35382f' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#5c675c' } },
  { scope: ['invalid'], settings: { foreground: '#943e40' } },
 ],
};

/** The same scope map as {@link journalCodeTheme}, re-tuned for a warm dark page.
 * Every value clears 4.5:1 against #1b1a16 (measured with the WCAG relative
 * luminance formula; ratios in trailing comments) and keeps the light theme's hue.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeThemeDark = {
 name: 'research-paper-dark',
 type: 'dark',
 colors: {
  'editor.background': '#1b1a16',
  'editor.foreground': '#e6e2d6',
 },
 tokenColors: [
  // contrast against #1b1a16 (WCAG 2.x relative luminance): all >= 4.5:1
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#a8b39a', fontStyle: 'italic' } }, // 7.94:1
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#cfa3c0' } }, // 8.01:1
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#9dcb8a' } }, // 9.41:1
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#d8a67d' } }, // 8.02:1
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#8ec6cc' } }, // 9.20:1
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#e6e2d6' } }, // 13.45:1
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#a3aca3' } }, // 7.45:1
  { scope: ['invalid'], settings: { foreground: '#e2908e' } }, // 7.14:1
 ],
};
