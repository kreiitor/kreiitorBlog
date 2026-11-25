/** Strip fenced blocks, code spans, HTML tags, and link destinations before counting prose words.
 * @param {string} markdown
 * @returns {string}
 */
export function stripCodeAndHtml(markdown) {
	return markdown
		.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
		.replace(/<(code|pre)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
		.replace(/`[^`\n]+`/g, ' ')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, ' ');
}

/** Count readable Han characters and standalone Latin words in prose.
 * @param {string} markdown
 * @returns {number}
 */
export function countProseWords(markdown) {
	const cleaned = stripCodeAndHtml(markdown);
	const han = cleaned.match(/\p{Script=Han}/gu)?.length ?? 0;
	const latin = cleaned.match(/\b[A-Za-z]+\b/g)?.length ?? 0;
	return han + latin;
}

/** Estimate reading minutes while ignoring raw LaTeX command names and HTML markup.
 * @param {string} text
 * @returns {number}
 */
export function estimateReadingTime(text) {
	const fencedBlocks = text.match(/```[\s\S]*?```|~~~[\s\S]*?~~~/g) ?? [];
	const codeLines = fencedBlocks.reduce(
		(total, block) => total + block.split('\n').slice(1, -1).filter((line) => line.trim().length > 0).length,
		0,
	);
	const withoutCode = text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ');
	const displayMathCount = (withoutCode.match(/\$\$[\s\S]*?\$\$/g) ?? []).length;
	const prose = stripCodeAndHtml(withoutCode.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/(?<!\\)\$[^$\n]+\$/g, ' '));
	const hanCharacters = (prose.match(/\p{Script=Han}/gu) ?? []).length;
	const latinWords = (prose.match(/\b[A-Za-z0-9_]+\b/g) ?? []).length;
	const weightedWords = hanCharacters + latinWords + codeLines * 8 + displayMathCount * 15;
	return Math.max(1, Math.ceil(weightedWords / 300));
}
