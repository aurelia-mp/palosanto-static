// One-off: optimiza una subcarpeta de images-source con el preset "hotel"
import fs from "fs";
import path from "path";
import sharp from "sharp";

const REL = process.argv[2];                 // ej: hotel/Terrace-Suite-NEW
const DRY = process.argv.includes("--dry");
const PRESET = { sizes: [800, 1200, 1600], webpQuality: 80, avifQuality: 60 };
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".avif", ".heic"]);

const inDir = path.join("images-source", REL);
const outDir = path.join("images", REL);
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(inDir, { withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => path.join(inDir, d.name))
  .filter((p) => VALID_EXT.has(path.extname(p).toLowerCase()));

console.log(`\n▶︎ ${inDir} → ${outDir} (${files.length} archivo/s)`);

for (const file of files) {
  const baseName = path.basename(file, path.extname(file));
  if (DRY) { console.log(`   · ${baseName}`); continue; }
  try {
    const meta = await sharp(file).metadata();
    for (const size of PRESET.sizes) {
      const w = Math.min(size, meta.width || size);
      for (const [fmt, q] of [["webp", PRESET.webpQuality], ["avif", PRESET.avifQuality]]) {
        await sharp(file).rotate()
          .resize({ width: w, fit: "inside", withoutEnlargement: true })
          [fmt]({ quality: q })
          .toFile(path.join(outDir, `${baseName}-${w}.${fmt}`));
      }
    }
    console.log(`   ✅ ${path.basename(file)}`);
  } catch (err) {
    console.error(`   ❌ ${path.basename(file)}: ${err.message}`);
  }
}
