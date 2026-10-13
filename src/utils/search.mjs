export function normalizeSearchText(value) {
 return String(value ?? '').toLocaleLowerCase().replace(/[\s:：·,，、。！？?!–—\-_/()（）《》「」'"“”‘’]+/g,'');
}
export function titleMatchScore(title, query) {
 const needle = normalizeSearchText(query), text = normalizeSearchText(title);
 if (!needle) return 0;
 if (text === needle) return 4;
 if (text.startsWith(needle)) return 3;
 return text.includes(needle) ? 2 : 0;
}
export function rankSearchEntries(entries, query) {
 return entries.map((entry, index) => ({ entry, index, score: titleMatchScore(entry.title, query) }))
  .sort((a,b) => b.score - a.score || a.index - b.index).map(item => item.entry);
}
