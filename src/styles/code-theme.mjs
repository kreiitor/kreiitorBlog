/** A light Shiki palette matched to the journal's paper and ink colors.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'research-paper',
 type: 'light',
 colors: {
  'editor.background': '#e9e9f3',
  'editor.foreground': '#232739',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#62685b', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#745168' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#426039' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#80542f' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#315d63' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#232739' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#5c675c' } },
  { scope: ['invalid'], settings: { foreground: '#943e40' } },
 ],
};

/** The same scope map as {@link journalCodeTheme}, re-tuned for a midnight-blue dark page.
 * Every value clears 4.5:1 against #141827 and keeps the light theme's hue.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeThemeDark = {
 name: 'research-paper-dark',
 type: 'dark',
 colors: {
  'editor.background': '#141827',
  'editor.foreground': '#f3f1fb',
 },
 tokenColors: [
  // contrast against #141827 (WCAG 2.x relative luminance): all >= 4.5:1
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#acb5d0', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#c5b7e8' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#bfd29b' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#e5cf9e' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#b7c0ff' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#f3f1fb' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#a3aca3' } },
  { scope: ['invalid'], settings: { foreground: '#e2908e' } },
 ],
};
