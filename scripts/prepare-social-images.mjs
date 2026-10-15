import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
// Replace complete files so concurrent previews never read a half-written PNG.
async function writeAsset(target, data) {
 const temporary = `${target}.tmp`;
 await writeFile(temporary, data);
 await rename(temporary, target);
}
const sources = ['public/social-card.svg', ...(await readdir('public/covers')).filter(file => file.endsWith('.svg')).map(file => `public/covers/${file}`)];
for (const source of sources) {
 // librsvg does not resolve SVG custom properties. Bake the light palette into
 // sharing PNGs; browser SVGs retain their adaptive light/dark media query.
 const svg = await readFile(source, 'utf8');
 const declarations = svg.match(/<style>:root\{([^}]+)\}/)?.[1];
 const colors = new Map((declarations ?? '').split(';').filter(Boolean).map(entry => entry.split(':')));
 const staticSvg = svg.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/var\((--cover-[\w-]+)\)/g, (_, name) => {
  if (!colors.has(name)) throw new Error(`Missing light palette token ${name} in ${source}`);
  return colors.get(name);
 });
 const image = await sharp(Buffer.from(staticSvg)).resize(1200, 630, { fit: 'cover' }).png({ compressionLevel: 9 }).toBuffer();
 await writeAsset(source.replace(/\.svg$/, '.png'), image);
}
console.log(`Prepared ${sources.length} sharing images at 1200×630.`);

// Keep the legacy favicon in sync with the vector mark. PNG frames are supported
// in ICO and preserve sharp edges at each native browser / shortcut size.
const faviconSizes = [16, 32, 48];
const faviconFrames = await Promise.all(faviconSizes.map(size => sharp('public/favicon.svg').resize(size, size).png().toBuffer()));
const icoHeader = Buffer.alloc(6 + faviconFrames.length * 16);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(faviconFrames.length, 4);
let frameOffset = icoHeader.length;
faviconFrames.forEach((frame, index) => {
 const entry = 6 + index * 16;
 icoHeader[entry] = faviconSizes[index];
 icoHeader[entry + 1] = faviconSizes[index];
 icoHeader.writeUInt16LE(1, entry + 4);
 icoHeader.writeUInt16LE(32, entry + 6);
 icoHeader.writeUInt32LE(frame.length, entry + 8);
 icoHeader.writeUInt32LE(frameOffset, entry + 12);
 frameOffset += frame.length;
});
await writeAsset('public/favicon.ico', Buffer.concat([icoHeader, ...faviconFrames]));
console.log('Prepared the favicon at 16, 32 and 48 pixels.');
