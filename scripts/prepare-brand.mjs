import { writeFile } from 'node:fs/promises';
import { brandSvg } from './brand-art.mjs';

await writeFile(new URL('../public/favicon.svg', import.meta.url), brandSvg);
await writeFile(new URL('../public/avatar.svg', import.meta.url), brandSvg.replace('width="64" height="64"', 'width="256" height="256"'));
console.log('Prepared avatar and favicon from the master logo.');
