export function formatDate(value: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(value);
}

export function formatYearMonth(value: Date) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'short',
	}).format(value);
}
