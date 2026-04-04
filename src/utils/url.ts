const normalizedBase = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path: string) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${normalizedBase}${normalizedPath}`;
}

export function stripBase(pathname: string) {
	if (!normalizedBase) {
		return pathname || '/';
	}

	const stripped = pathname.startsWith(normalizedBase) ? pathname.slice(normalizedBase.length) : pathname;
	return stripped || '/';
}
