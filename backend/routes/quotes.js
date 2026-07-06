// Solicitudes de cotización (leads). Crear es público; ver/gestionar es de admin.
const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getClientIp } = require('../lib/clientinfo');
const { publicWriteLimiter } = require('../middleware/limiters');

const router = express.Router();
const STATUSES = ['nuevo', 'contactado', 'venta_concretada', 'venta_perdida'];

// POST /api/quotes  -> el cliente solicita una cotización (público)
router.post('/', publicWriteLimiter, async (req, res) => {
  const b = req.body || {};
  // Honeypot: si un bot rellena este campo oculto, ignoramos en silencio.
  if (b.website) return res.status(201).json({ ok: true });

  const name = (b.name || '').trim();
  const phone = (b.phone || '').trim();
  const email = (b.email || '').trim();

  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!phone && !email) return res.status(400).json({ error: 'Deja un teléfono o un correo para contactarte.' });

  const info = await db.prepare(`
    INSERT INTO quotes (product_id, product_code, product_name, name, company, phone, email, message, ip)
    VALUES (:product_id, :product_code, :product_name, :name, :company, :phone, :email, :message, :ip)
  `).run({
    product_id: b.product_id ? Number(b.product_id) : null,
    product_code: (b.product_code || '').slice(0, 80) || null,
    product_name: (b.product_name || '').slice(0, 200) || null,
    name: name.slice(0, 120),
    company: (b.company || '').slice(0, 120) || null,
    phone: phone.slice(0, 40) || null,
    email: email.slice(0, 120) || null,
    message: (b.message || '').slice(0, 1000) || null,
    ip: getClientIp(req),
  });
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// GET /api/quotes  -> lista de leads (admin)
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all();
  res.json(rows);
});

// PATCH /api/quotes/:id  -> cambia el estado (admin). Para "venta_perdida" guarda la razón.
router.patch('/:id', requireAuth, async (req, res) => {
  const status = (req.body?.status || '').trim();
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Estado inválido.' });
  // La razón solo aplica a ventas perdidas; en otros estados se limpia.
  const lostReason = status === 'venta_perdida' ? (req.body?.lost_reason || '').trim().slice(0, 500) : null;
  const r = await db.prepare('UPDATE quotes SET status = ?, lost_reason = ? WHERE id = ?').run(status, lostReason, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Cotización no encontrada.' });
  res.json({ ok: true });
});

// DELETE /api/quotes/:id  (admin)
router.delete('/:id', requireAuth, async (req, res) => {
  await db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
