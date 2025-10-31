// optimize-images.js
// Requiere Node 18+ y "type": "module" en package.json
import fs from "fs";
import path from "path";
import sharp from "sharp";

const INPUT_ROOT = "images-source";
const OUTPUT_ROOT = "images";

// Presets por subcarpeta
const PRESETS = {
  hero: {
    sizes: [1920, 2560],   // 1920 para desktop común; 2560 para pantallas grandes
    webpQuality: 85,
    avifQuality: 65,
  },
  hotel: {
    sizes: [800, 1200, 1600],
    webpQuality: 80,
    avifQuality: 60,
  },
  gallery: {
    sizes: [600, 1000, 1600],
    webpQuality: 78,
    avifQuality: 58,
  },
  thumbnails: {
    sizes: [400, 800, 1200],
    webpQuality: 70,
    avifQuality: 55,
  },
  heroMobile: { 
    sizes: [600, 1000, 1600], 
    webpQuality: 85, 
    avifQuality: 65 
  },

};

// Extensiones admitidas como entrada
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".avif"]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.join(dir, d.name))
    .filter((p) => VALID_EXT.has(path.extname(p).toLowerCase()));
}

async function processFile(inputPath, outDir, baseName, sizes, webpQuality, avifQuality) {
  // baseName sin extensión (p.ej. room-101)
  const image = sharp(inputPath).rotate(); // respeta EXIF orientation

  // Detecta ancho original para evitar "enlarge"
  const meta = await image.metadata();
  const originalWidth = meta.width || 0;

  for (const size of sizes) {
    const targetWidth = Math.min(size, originalWidth || size);

    // WebP
    await sharp(inputPath)
      .rotate()
      .resize({ width: targetWidth, fit: "inside", withoutEnlargement: true })
      .webp({ quality: webpQuality })
      .toFile(path.join(outDir, `${baseName}-${targetWidth}.webp`));

    // AVIF
    await sharp(inputPath)
      .rotate()
      .resize({ width: targetWidth, fit: "inside", withoutEnlargement: true })
      .avif({ quality: avifQuality })
      .toFile(path.join(outDir, `${baseName}-${targetWidth}.avif`));
  }
}

async function processFolder(folderName, preset) {
  const inDir = path.join(INPUT_ROOT, folderName);
  const outDir = path.join(OUTPUT_ROOT, folderName);
  ensureDir(outDir);

  const files = getFiles(inDir);
  if (files.length === 0) {
    console.log(`ℹ️  No se encontraron imágenes en ${inDir}`);
    return;
  }

  console.log(`\n▶︎ Procesando "${folderName}" (${files.length} archivo/s) …`);

  // Secuencial para no saturar CPU/memoria en entornos chicos; si querés, podés paralelizar con Promise.all
  for (const file of files) {
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    try {
      await processFile(file, outDir, baseName, preset.sizes, preset.webpQuality, preset.avifQuality);
      console.log(`   ✅ ${path.basename(file)} → ${folderName}/[${preset.sizes.join(", ")}]{webp,avif}`);
    } catch (err) {
      console.error(`   ❌ Error con ${file}:`, err.message);
    }
  }
}

async function main() {
  console.time("⏱ Optimización total");
  ensureDir(OUTPUT_ROOT);

  // Sólo procesa las carpetas definidas en PRESETS si existen en src/images
  const tasks = [];
  for (const [folder, preset] of Object.entries(PRESETS)) {
    const folderPath = path.join(INPUT_ROOT, folder);
    if (fs.existsSync(folderPath)) {
      // Ejecuta secuencial para logs ordenados; cambia a Promise.all si querés paralelizar por carpeta
      await processFolder(folder, preset);
    } else {
      console.log(`ℹ️  Carpeta omitida (no existe): ${folderPath}`);
    }
  }

  console.timeEnd("⏱ Optimización total");
}

main().catch((e) => {
  console.error("Error general:", e);
  process.exit(1);
});
