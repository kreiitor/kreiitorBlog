// Generate responsive WebP variants for the gallery photos. The original JPEGs
// remain the lightbox source; the gallery grid uses these smaller candidates.
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve('public/gallery');
const outputDir = path.join(sourceDir, 'optimized');
await mkdir(outputDir, { recursive: true });
const files = (await readdir(sourceDir)).filter((file) => /\.jpe?g$/i.test(file)).sort();
let count = 0;

for (const file of files) {
	const source = path.join(sourceDir, file);
	const metadata = await sharp(source).metadata();
	if (!metadata.width) continue;
	const widths = [...new Set([480, 800, Math.min(1200, metadata.width)].filter((width) => width > 0 && width <= metadata.width))].sort((a, b) => a - b);
	for (const width of widths) {
		const stem = file.replace(/\.jpe?g$/i, '');
		const resized = sharp(source).resize({ width, withoutEnlargement: true });
		await resized.clone().webp({ quality: 74 }).toFile(path.join(outputDir, `${stem}-${width}.webp`));
		await resized.clone().avif({ quality: 55, effort: 4 }).toFile(path.join(outputDir, `${stem}-${width}.avif`));
		count += 1;
	}
}

console.log(`Generated ${count * 2} gallery variants (WebP + AVIF) for ${files.length} photos in ${path.relative(process.cwd(), outputDir)}`);
