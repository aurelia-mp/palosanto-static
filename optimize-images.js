/// optimize-images.js
/// Para procesar una sola imagen: npm run optimize:images -- hotel/nueva-habitacion.jpg
/// Para procesar un carpeta: npm run optimize:images -- hotel
/// Para procesar una subcarpeta: npm run optimize:images -- hotel/Terrace-Suite-NEW
/// Para procesar todo: npm run optimize:images
/// (Las subcarpetas heredan el preset de su carpeta raíz y sólo se procesan si se piden explícitamente.)

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
    sizes: [480, 600, 800], 
    webpQuality: 85, 
    avifQuality: 65 
  },
};

// Extensiones admitidas como entrada
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".avif", ".heic", ".heif"]);

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

async function processFolder(folderName, preset, onlyFileBaseName = null) {
  const inDir = path.join(INPUT_ROOT, folderName);
  const outDir = path.join(OUTPUT_ROOT, folderName);
  ensureDir(outDir);

  const files = getFiles(inDir);
  if (files.length === 0) {
    console.log(`ℹ️  No se encontraron imágenes en ${inDir}`);
    return;
  }

  // Si se especificó un archivo, filtramos por ese baseName
  const filteredFiles = onlyFileBaseName
    ? files.filter((f) => path.basename(f, path.extname(f)) === onlyFileBaseName)
    : files;

  if (filteredFiles.length === 0) {
    console.log(`ℹ️  No se encontró el archivo "${onlyFileBaseName}" en ${inDir}`);
    return;
  }

  console.log(
    `\n▶︎ Procesando "${folderName}" (${filteredFiles.length} archivo/s)${
      onlyFileBaseName ? ` (solo "${onlyFileBaseName}")` : ""
    }…`
  );

  // Secuencial para no saturar CPU/memoria
  for (const file of filteredFiles) {
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

  // Lee argumento opcional: carpeta o carpeta/archivo
  // Ej:
  //  node optimize-images.js hotel
  //  node optimize-images.js hotel/nueva-habitacion.jpg
  const args = process.argv.slice(2);
  let onlyFolder = null;
  let onlyFileBaseName = null;

  if (args[0]) {
    // Soporta "hotel", "hotel/Terrace-Suite-NEW" (subcarpeta) y "hotel/nombre.jpg"
    const rel = args[0].replace(/\\/g, "/").replace(/\/+$/, "");
    const asPath = path.join(INPUT_ROOT, rel);

    if (fs.existsSync(asPath) && fs.statSync(asPath).isDirectory()) {
      // carpeta o subcarpeta
      onlyFolder = rel;
    } else {
      // carpeta (o subcarpeta) + archivo
      const parts = rel.split("/");
      const fileName = parts.pop();
      onlyFolder = parts.join("/") || fileName;
      onlyFileBaseName = parts.length ? fileName.replace(/\.[^.]+$/, "") : null;
    }
  }

  if (onlyFolder) {
    // Una ruta concreta: el preset lo define su carpeta raíz ("hotel/Sub" usa el preset "hotel")
    const rootFolder = onlyFolder.split("/")[0];
    const preset = PRESETS[rootFolder];
    const folderPath = path.join(INPUT_ROOT, onlyFolder);

    if (!preset) {
      console.log(
        `ℹ️  No hay preset para "${rootFolder}". Disponibles: ${Object.keys(PRESETS).join(", ")}`
      );
    } else if (fs.existsSync(folderPath)) {
      await processFolder(onlyFolder, preset, onlyFileBaseName);
    } else {
      console.log(`ℹ️  Carpeta omitida (no existe): ${folderPath}`);
    }
  } else {
    // Sin argumento: procesa las carpetas definidas en PRESETS si existen en images-source
    for (const [folder, preset] of Object.entries(PRESETS)) {
      const folderPath = path.join(INPUT_ROOT, folder);
      if (fs.existsSync(folderPath)) {
        await processFolder(folder, preset, null);
      } else {
        console.log(`ℹ️  Carpeta omitida (no existe): ${folderPath}`);
      }
    }
  }

  console.timeEnd("⏱ Optimización total");
}

main().catch((e) => {
  console.error("Error general:", e);
  process.exit(1);
});
