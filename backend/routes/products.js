// API de productos: consulta pública + CRUD protegido para el administrador.
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { optimizeUploads } = require('../lib/images');

const router = express.Router();

// --- Configuración de subida de imágenes ---
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = 'prod_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|gif)/.test(file.mimetype);
    cb(ok ? null : new Error('Solo se permiten imágenes (png, jpg, webp, gif).'), ok);
  },
});
// Acepta hasta 10 fotos nuevas por producto (campo "newImages").
const uploadGallery = upload.array('newImages', 10);

// --- Helpers ---
function parseRow(row) {
  if (!row) return row;
  let features = [];
  let specs = [];
  let images = [];
  try { features = JSON.parse(row.features || '[]'); } catch (_) {}
  try { specs = JSON.parse(row.specs || '[]'); } catch (_) {}
  try { images = JSON.parse(row.images || '[]'); } catch (_) {}
  if (!images.length && row.image) images = [row.image]; // compatibilidad
  const discountPct = row.price_regular > 0
    ? Math.round((1 - row.price_discount / row.price_regular) * 100)
    : 0;
  return { ...row, features, specs, images, discount_pct: discountPct };
}

function buildPayload(body, files) {
  let features = [];
  let specs = [];
  let tokens = [];
  try { features = typeof body.features === 'string' ? JSON.parse(body.features) : (body.features || []); } catch (_) {}
  try { specs = typeof body.specs === 'string' ? JSON.parse(body.specs) : (body.specs || []); } catch (_) {}
  try { tokens = typeof body.gallery === 'string' ? JSON.parse(body.gallery) : (body.gallery || []); } catch (_) {}

  // Reconstruye la galería en el orden enviado: URLs existentes tal cual,
  // y tokens "new:N" reemplazados por el archivo N recién subido.
  const newFiles = files || [];
  let gallery = (Array.isArray(tokens) ? tokens : []).map((t) => {
    const m = /^new:(\d+)$/.exec(String(t));
    if (m) { const f = newFiles[Number(m[1])]; return f ? '/uploads/' + f.filename : null; }
    return t;
  }).filter(Boolean);

  // Compatibilidad si no se envió galería.
  if (!gallery.length) {
    if (newFiles.length) gallery = newFiles.map((f) => '/uploads/' + f.filename);
    else if (body.image) gallery = [body.image];
  }

  const image = gallery[0] || null; // portada

  return {
    code: (body.code || '').trim(),
    name: (body.name || '').trim(),
    brand: (body.brand || '').trim(),
    category: (body.category || '').trim(),
    description: (body.description || '').trim(),
    features: JSON.stringify(features),
    specs: JSON.stringify(specs),
    price_regular: parseFloat(body.price_regular) || 0,
    price_discount: parseFloat(body.price_discount) || 0,
    image,
    images: JSON.stringify(gallery),
    stock: parseInt(body.stock, 10) || 0,
    on_discount: body.on_discount === '0' || body.on_discount === false || body.on_discount === 'false' ? 0 : 1,
    active: body.active === '0' || body.active === false || body.active === 'false' ? 0 : 1,
    valid_until: body.valid_until || null,
  };
}

// Borra archivos subidos (prod_*) que ya no se usan.
function removeUploaded(urls) {
  (urls || []).forEach((u) => {
    if (u && u.startsWith('/uploads/prod_')) {
      const f = path.join(config.UPLOAD_DIR, path.basename(u));
      fs.existsSync(f) && fs.unlink(f, () => {});
    }
  });
}

// =================== RUTAS PÚBLICAS ===================

// GET /api/products  -> lista (soporta ?brand= &category= &search= &discount=1 &all=1)
router.get('/', async (req, res) => {
  const { brand, category, search, discount, all } = req.query;
  const where = [];
  const params = {};

  // Por defecto, el cliente solo ve productos activos.
  if (all !== '1') where.push('active = 1');
  if (discount === '1') where.push('on_discount = 1');
  if (brand) { where.push('brand = :brand'); params.brand = brand; }
  if (category) { where.push('category = :category'); params.category = category; }
  if (search) {
    where.push('(LOWER(name) LIKE :q OR LOWER(code) LIKE :q OR LOWER(description) LIKE :q OR LOWER(brand) LIKE :q)');
    params.q = '%' + String(search).toLowerCase() + '%';
  }

  const sql = 'SELECT * FROM products'
    + (where.length ? ' WHERE ' + where.join(' AND ') : '')
    + ' ORDER BY category, name';
  const rows = (await db.prepare(sql).all(params)).map(parseRow);
  res.json(rows);
});

// GET /api/products/meta -> marcas y categorías disponibles + totales
router.get('/meta', async (req, res) => {
  const brands = (await db.prepare("SELECT DISTINCT brand FROM products WHERE brand <> '' ORDER BY brand").all()).map(r => r.brand);
  const categories = (await db.prepare("SELECT DISTINCT category FROM products WHERE category <> '' ORDER BY category").all()).map(r => r.category);
  const total = (await db.prepare('SELECT COUNT(*) AS n FROM products WHERE active = 1').get()).n;
  res.json({ brands, categories, total });
});

// GET /api/products/:id -> detalle
router.get('/:id', async (req, res) => {
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(parseRow(row));
});

// =================== RUTAS ADMIN (protegidas) ===================

// POST /api/products -> crear
router.post('/', requireAuth, uploadGallery, async (req, res) => {
  await optimizeUploads(req.files);
  const p = buildPayload(req.body, req.files);
  if (!p.code || !p.name) {
    return res.status(400).json({ error: 'El código y el nombre son obligatorios.' });
  }
  const exists = await db.prepare('SELECT id FROM products WHERE code = ?').get(p.code);
  if (exists) {
    return res.status(409).json({ error: `Ya existe un producto con el código "${p.code}".` });
  }
  try {
    const info = await db.prepare(`
      INSERT INTO products
        (code, name, brand, category, description, features, specs,
         price_regular, price_discount, image, images, stock, on_discount, active, valid_until)
      VALUES
        (:code, :name, :brand, :category, :description, :features, :specs,
         :price_regular, :price_discount, :image, :images, :stock, :on_discount, :active, :valid_until)
    `).run(p);
    const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(parseRow(row));
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear el producto: ' + err.message });
  }
});

// PUT /api/products/:id -> actualizar
router.put('/:id', requireAuth, uploadGallery, async (req, res) => {
  const current = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Producto no encontrado.' });

  await optimizeUploads(req.files);
  const p = buildPayload(req.body, req.files);
  if (!p.code || !p.name) {
    return res.status(400).json({ error: 'El código y el nombre son obligatorios.' });
  }
  const clash = await db.prepare('SELECT id FROM products WHERE code = ? AND id <> ?').get(p.code, req.params.id);
  if (clash) {
    return res.status(409).json({ error: `Ya existe otro producto con el código "${p.code}".` });
  }
  try {
    await db.prepare(`
      UPDATE products SET
        code=:code, name=:name, brand=:brand, category=:category, description=:description,
        features=:features, specs=:specs, price_regular=:price_regular, price_discount=:price_discount,
        image=:image, images=:images, stock=:stock, on_discount=:on_discount, active=:active, valid_until=:valid_until,
        updated_at=NOW()
      WHERE id=:id
    `).run({ ...p, id: Number(req.params.id) });
    // Limpia archivos que quedaron fuera de la galería
    let oldImages = [];
    try { oldImages = JSON.parse(current.images || '[]'); } catch (_) {}
    if (!oldImages.length && current.image) oldImages = [current.image];
    let newImages = [];
    try { newImages = JSON.parse(p.images || '[]'); } catch (_) {}
    removeUploaded(oldImages.filter((u) => !newImages.includes(u)));

    const row = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(parseRow(row));
  } catch (err) {
    res.status(500).json({ error: 'No se pudo actualizar: ' + err.message });
  }
});

// DELETE /api/products/:id -> eliminar
router.delete('/:id', requireAuth, async (req, res) => {
  const current = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Producto no encontrado.' });
  await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  // Borra las imágenes subidas (no toca los flyers precargados en /uploads)
  let gallery = [];
  try { gallery = JSON.parse(current.images || '[]'); } catch (_) {}
  removeUploaded([...gallery, current.image]);
  res.json({ ok: true });
});

module.exports = router;
