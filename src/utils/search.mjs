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
 return entries.map((entry, index) => ({ entry, index, score: searchEntryScore(entry, query) }))
  .filter(item => item.score > 0)
  .sort((a,b) => b.score - a.score || a.index - b.index).map(item => item.entry);
}

// Pagefind can normalize repeated Latin characters (zzzzzzzz -> z). Verify
// candidates against actual text, including the body, before displaying them.
export function searchEntryScore(entry, query) {
 const terms = String(query).trim().split(/\s+/).map(normalizeSearchText).filter(Boolean);
 if (!terms.length) return 0;
 const title = titleMatchScore(entry.title, query);
 if (title) return title + 2;
 const summary = normalizeSearchText(`${entry.title ?? ''} ${entry.description ?? ''}`);
 if (terms.every(term => summary.includes(term))) return 2;
 const content = normalizeSearchText(entry.content);
 return terms.every(term => content.includes(term)) ? 1 : 0;
}
