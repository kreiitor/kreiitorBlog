import { readFile } from 'node:fs/promises';

// One vector master supplies the header, avatars, favicon and sharing artwork.
export const brandSvg = await readFile(new URL('../public/logo.svg', import.meta.url), 'utf8');
export const brandSymbol = brandSvg
 .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
 .replace(/<title\b[^>]*>[\s\S]*?<\/title>/, '')
 .replace(/<\/svg>\s*$/, '').trim();
