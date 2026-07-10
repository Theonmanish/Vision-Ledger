import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icons', 'app-icon.svg');
const outDir = join(root, 'public', 'icons');

const sizes = [48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

const svg = await readFile(svgPath);
await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

// Maskable icon with safe zone padding
await sharp(svg)
  .resize(512, 512, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 1 } })
  .extend({
    top: 64,
    bottom: 64,
    left: 64,
    right: 64,
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  })
  .resize(512, 512)
  .png()
  .toFile(join(outDir, 'icon-maskable-512.png'));
console.log('Generated icon-maskable-512.png');
