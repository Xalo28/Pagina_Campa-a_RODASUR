// Optimiza imágenes subidas: reduce tamaño y peso para acelerar la carga del catálogo.
const fs = require('fs');
const path = require('path');

let sharp = null;
try { sharp = require('sharp'); } catch { /* si sharp no está disponible, se omite */ }

const MAX_WIDTH = 1400;

async function optimizeFile(filePath) {
  if (!sharp) return;
  try {
    const input = fs.readFileSync(filePath);
    let img = sharp(input).rotate(); // respeta orientación EXIF
    const meta = await img.metadata();
    if (meta.width && meta.width > MAX_WIDTH) img = img.resize({ width: MAX_WIDTH });

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') img = img.png({ compressionLevel: 9, quality: 82 });
    else if (ext === '.webp') img = img.webp({ quality: 80 });
    else if (ext === '.gif') { /* deja el gif tal cual para no perder animación */ return; }
    else img = img.jpeg({ quality: 78, mozjpeg: true });

    const out = await img.toBuffer();
    if (out.length < input.length) fs.writeFileSync(filePath, out); // solo si quedó más liviana
  } catch (err) {
    console.error('[images] no se pudo optimizar', path.basename(filePath), err.message);
  }
}

// Optimiza todos los archivos recién subidos por multer.
async function optimizeUploads(files) {
  for (const f of files || []) {
    if (f?.path) await optimizeFile(f.path);
  }
}

module.exports = { optimizeUploads };
