import { readdir } from 'node:fs/promises';
import sharp from 'sharp';
const sources = ['public/social-card.svg', ...(await readdir('public/covers')).filter(file => file.endsWith('.svg')).map(file => `public/covers/${file}`)];
for (const source of sources) {
 await sharp(source).resize(1200, 630, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(source.replace(/\.svg$/, '.png'));
}
console.log(`Prepared ${sources.length} sharing images at 1200×630.`);
