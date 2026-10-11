/** A light Shiki palette matched to the journal's paper and ink colors.
 * @type {import('shiki').ThemeRegistration}
 */
export const journalCodeTheme = {
 name: 'research-paper',
 type: 'light',
 colors: {
  'editor.background': '#eef0e7',
  'editor.foreground': '#344539',
 },
 tokenColors: [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5f6d59', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: '#745168' } },
  { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#426039' } },
  { scope: ['constant', 'constant.numeric', 'constant.language'], settings: { foreground: '#80542f' } },
  { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.type'], settings: { foreground: '#315d63' } },
  { scope: ['variable', 'variable.parameter'], settings: { foreground: '#344539' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#5c675c' } },
  { scope: ['invalid'], settings: { foreground: '#943e40' } },
 ],
};
