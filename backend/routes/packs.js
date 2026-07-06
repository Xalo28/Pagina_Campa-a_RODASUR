// Packs: agrupan 2 o más productos para venderse en paquete con descuento.
const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Expande un pack: incluye los productos y calcula el ahorro frente a comprarlos por separado.
function parsePack(row) {
  if (!row) return row;
  let ids = [];
  try { ids = JSON.parse(row.product_ids || '[]'); } catch (_) {}

  const getProduct = db.prepare('SELECT id, name, code, brand, image, price_regular, price_discount FROM products WHERE id = ?');
  const products = ids.map((id) => getProduct.get(id)).filter(Boolean);

  const sumIndividual = products.reduce((s, p) => s + (p.price_discount || p.price_regular || 0), 0);
  const pricePack = row.price_pack || 0;
  const savings = Math.max(0, sumIndividual - pricePack);
  const discountPct = sumIndividual > 0 ? Math.round((savings / sumIndividual) * 100) : 0;

  return { ...row, product_ids: ids, products, sum_individual: sumIndividual, savings, discount_pct: discountPct };
}

function buildPayload(body) {
  let ids = [];
  try { ids = typeof body.product_ids === 'string' ? JSON.parse(body.product_ids) : (body.product_ids || []); } catch (_) {}
  ids = (Array.isArray(ids) ? ids : []).map(Number).filter(Boolean);
  return {
    name: (body.name || '').trim(),
    description: (body.description || '').trim(),
    product_ids: JSON.stringify(ids),
    price_pack: parseFloat(body.price_pack) || 0,
    image: (body.image || '').trim() || null,
    active: body.active === '0' || body.active === false || body.active === 'false' ? 0 : 1,
    _count: ids.length,
  };
}

// GET /api/packs  (público: solo activos; ?all=1 para el admin)
router.get('/', (req, res) => {
  const all = req.query.all === '1';
  const rows = db.prepare(`SELECT * FROM packs ${all ? '' : 'WHERE active = 1'} ORDER BY created_at DESC`).all();
  res.json(rows.map(parsePack));
});

// GET /api/packs/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM packs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pack no encontrado.' });
  res.json(parsePack(row));
});

// POST /api/packs  (admin)
router.post('/', requireAuth, (req, res) => {
  const p = buildPayload(req.body);
  if (!p.name) return res.status(400).json({ error: 'El nombre del pack es obligatorio.' });
  if (p._count < 2) return res.status(400).json({ error: 'Un pack debe incluir al menos 2 productos.' });
  const info = db.prepare(`
    INSERT INTO packs (name, description, product_ids, price_pack, image, active)
    VALUES (@name, @description, @product_ids, @price_pack, @image, @active)
  `).run(p);
  res.status(201).json(parsePack(db.prepare('SELECT * FROM packs WHERE id = ?').get(info.lastInsertRowid)));
});

// PUT /api/packs/:id  (admin)
router.put('/:id', requireAuth, (req, res) => {
  const current = db.prepare('SELECT * FROM packs WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Pack no encontrado.' });
  const p = buildPayload(req.body);
  if (!p.name) return res.status(400).json({ error: 'El nombre del pack es obligatorio.' });
  if (p._count < 2) return res.status(400).json({ error: 'Un pack debe incluir al menos 2 productos.' });
  db.prepare(`
    UPDATE packs SET name=@name, description=@description, product_ids=@product_ids,
      price_pack=@price_pack, image=@image, active=@active, updated_at=datetime('now')
    WHERE id=@id
  `).run({ ...p, id: Number(req.params.id) });
  res.json(parsePack(db.prepare('SELECT * FROM packs WHERE id = ?').get(req.params.id)));
});

// DELETE /api/packs/:id  (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM packs WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Pack no encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
