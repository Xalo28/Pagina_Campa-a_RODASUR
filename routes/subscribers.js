// Suscriptores: alta pública + gestión protegida para el administrador.
const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { publicWriteLimiter } = require('../middleware/limiters');
const { sendCampaign, mailEnabled } = require('../lib/mailer');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribers  -> alta pública { name, email, phone }
router.post('/', publicWriteLimiter, (req, res) => {
  if (req.body?.website) return res.json({ ok: true }); // honeypot anti-bots
  const name = (req.body?.name || '').trim().slice(0, 120);
  const email = (req.body?.email || '').trim().toLowerCase().slice(0, 160);
  const phone = (req.body?.phone || '').trim().slice(0, 40);
  const company = (req.body?.company || '').trim().slice(0, 140);
  const position = (req.body?.position || '').trim().slice(0, 100);

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }

  const existing = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(email);
  if (existing) {
    // Reactiva y actualiza datos si vuelve a suscribirse
    db.prepare(`UPDATE subscribers SET
        name = COALESCE(NULLIF(?, ''), name),
        phone = COALESCE(NULLIF(?, ''), phone),
        company = COALESCE(NULLIF(?, ''), company),
        position = COALESCE(NULLIF(?, ''), position),
        active = 1 WHERE id = ?`)
      .run(name, phone, company, position, existing.id);
    return res.json({ ok: true, already: true, message: '¡Ya estabas suscrito! Actualizamos tus datos.' });
  }

  db.prepare('INSERT INTO subscribers (name, email, phone, company, position) VALUES (?, ?, ?, ?, ?)')
    .run(name || null, email, phone || null, company || null, position || null);
  res.status(201).json({ ok: true, message: '¡Listo! Te avisaremos de nuevas campañas y descuentos.' });
});

// GET /api/subscribers  -> lista (protegido)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all();
  res.json(rows);
});

// DELETE /api/subscribers/:id  -> eliminar (protegido)
router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Suscriptor no encontrado.' });
  res.json({ ok: true });
});

// GET /api/subscribers/mail-status -> ¿está configurado el envío de correos? (admin)
router.get('/mail-status', requireAuth, (req, res) => {
  res.json({ enabled: mailEnabled() });
});

// POST /api/subscribers/campaign { subject, message } -> envía correo a todos los suscriptores (admin)
router.post('/campaign', requireAuth, async (req, res) => {
  const subject = (req.body?.subject || '').trim();
  const message = (req.body?.message || '').trim();
  if (!subject || !message) return res.status(400).json({ error: 'Asunto y mensaje son obligatorios.' });
  if (!mailEnabled()) {
    return res.status(400).json({ error: 'El envío de correos no está configurado. Define SMTP_* en el archivo .env.' });
  }
  const emails = db.prepare('SELECT email FROM subscribers WHERE active = 1').all().map((r) => r.email);
  if (!emails.length) return res.status(400).json({ error: 'No hay suscriptores a quién enviar.' });

  const safe = message.replace(/</g, '&lt;').replace(/\n/g, '<br>');
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <div style="background:#0d2149;color:#fff;padding:16px 20px;font-size:22px;font-weight:800">RODA<span style="color:#e2001a">SUR</span></div>
    <div style="padding:20px;color:#17202e;font-size:15px;line-height:1.6">${safe}</div>
    <div style="padding:14px 20px;background:#eef1f7;color:#6b7688;font-size:12px">Recibiste este correo porque te suscribiste en rodasur.com</div>
  </div>`;

  try {
    const result = await sendCampaign(subject, html, emails);
    res.json({ ok: true, ...result, total: emails.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
