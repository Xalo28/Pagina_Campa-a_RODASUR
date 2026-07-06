// Analítica propia: registro de visitas (público) y estadísticas (admin).
const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getClientIp, geoFromIp, parseUserAgent } = require('../lib/clientinfo');
const { trackLimiter } = require('../middleware/limiters');

const router = express.Router();

// POST /api/analytics/track  -> registra una visita (llamado por el frontend)
// La analítica nunca debe romper la experiencia del usuario: siempre responde ok.
router.post('/track', trackLimiter, async (req, res) => {
  try {
    const { visitor_id, path, product_id, referrer } = req.body || {};
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';
    const { device, browser, os } = parseUserAgent(ua);
    const { country, city } = geoFromIp(ip);

    await db.prepare(`
      INSERT INTO visits (visitor_id, path, product_id, ip, country, city, device, browser, os, referrer, user_agent)
      VALUES (:visitor_id, :path, :product_id, :ip, :country, :city, :device, :browser, :os, :referrer, :user_agent)
    `).run({
      visitor_id: (visitor_id || '').slice(0, 60) || null,
      path: (path || '').slice(0, 300),
      product_id: product_id ? Number(product_id) : null,
      ip,
      country,
      city,
      device,
      browser,
      os,
      referrer: (referrer || '').slice(0, 300) || null,
      user_agent: ua.slice(0, 400),
    });
  } catch (err) {
    console.error('[track]', err.message);
  }
  res.json({ ok: true });
});

// POST /api/analytics/advisor  -> registra que un visitante pidió hablar con un asesor
router.post('/advisor', trackLimiter, async (req, res) => {
  try {
    const { advisor_name, advisor_phone, visitor_id } = req.body || {};
    await db.prepare(`
      INSERT INTO advisor_requests (advisor_name, advisor_phone, visitor_id, ip)
      VALUES (?, ?, ?, ?)
    `).run(
      (advisor_name || '').slice(0, 120),
      (advisor_phone || '').slice(0, 30),
      (visitor_id || '').slice(0, 60) || null,
      getClientIp(req)
    );
  } catch (err) {
    console.error('[advisor]', err.message);
  }
  res.json({ ok: true });
});

// GET /api/analytics/stats?days=14  -> resumen para el dashboard (protegido)
router.get('/stats', requireAuth, async (req, res) => {
  // Periodo: hoy | 7 días | 30 días
  const range = ['today', '7d', '30d'].includes(req.query.range) ? req.query.range : '7d';
  const rangeDays = range === '30d' ? 30 : range === 'today' ? 1 : 7;

  // Predicado de filtro por periodo (por columna created_at de cada tabla)
  const pred = (col = 'created_at') =>
    range === 'today'
      ? `DATE(${col}) = CURDATE()`
      : `DATE(${col}) >= DATE_SUB(CURDATE(), INTERVAL ${rangeDays - 1} DAY)`;

  const total = (await db.prepare(`SELECT COUNT(*) AS n FROM visits WHERE ${pred()}`).get()).n;
  const uniques = (await db.prepare(`SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE ${pred()}`).get()).n;

  // Serie temporal: por hora si es "hoy", por día si es 7d / 30d
  let series;
  if (range === 'today') {
    const rows = await db.prepare(`
      SELECT DATE_FORMAT(created_at, '%H') AS k, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS uniques
      FROM visits WHERE ${pred()} GROUP BY k
    `).all();
    const map = Object.fromEntries(rows.map((r) => [r.k, r]));
    series = [];
    for (let h = 0; h < 24; h++) {
      const k = String(h).padStart(2, '0');
      series.push({ label: `${k}h`, visits: map[k]?.visits || 0, uniques: map[k]?.uniques || 0 });
    }
  } else {
    const rows = await db.prepare(`
      SELECT DATE(created_at) AS d, COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS uniques
      FROM visits WHERE ${pred()} GROUP BY d
    `).all();
    const map = Object.fromEntries(rows.map((r) => [r.d, r]));
    series = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
      series.push({ label: key.slice(5), visits: map[key]?.visits || 0, uniques: map[key]?.uniques || 0 });
    }
  }

  const topProducts = await db.prepare(`
    SELECT v.product_id AS id, p.name, p.code, COUNT(*) AS views
    FROM visits v JOIN products p ON p.id = v.product_id
    WHERE v.product_id IS NOT NULL AND ${pred('v.created_at')}
    GROUP BY v.product_id ORDER BY views DESC LIMIT 8
  `).all();

  const quotesTotal = (await db.prepare(`SELECT COUNT(*) AS n FROM quotes WHERE ${pred()}`).get()).n;
  const quotesNew = (await db.prepare(`SELECT COUNT(*) AS n FROM quotes WHERE status = 'nuevo' AND ${pred()}`).get()).n;

  const advisorTotal = (await db.prepare(`SELECT COUNT(*) AS n FROM advisor_requests WHERE ${pred()}`).get()).n;
  const topAdvisors = await db.prepare(`
    SELECT COALESCE(NULLIF(advisor_name, ''), 'Sin nombre') AS label, COUNT(*) AS n
    FROM advisor_requests WHERE ${pred()}
    GROUP BY label ORDER BY n DESC LIMIT 12
  `).all();

  res.json({
    range,
    total, uniques,
    series, topProducts,
    quotesTotal, quotesNew,
    advisorTotal, topAdvisors,
  });
});

// GET /api/analytics/notifications -> feed de eventos recientes para el admin (protegido)
// Une cotizaciones, solicitudes de asesor y suscriptores en un solo listado.
router.get('/notifications', requireAuth, async (req, res) => {
  const quotes = (await db.prepare(`
    SELECT id, name, product_name, created_at FROM quotes ORDER BY created_at DESC LIMIT 25
  `).all()).map((q) => ({
    type: 'quote',
    id: 'q' + q.id,
    title: 'Nueva cotización',
    detail: q.name + (q.product_name ? ` · ${q.product_name}` : ''),
    created_at: q.created_at,
  }));

  const advisors = (await db.prepare(`
    SELECT id, advisor_name, created_at FROM advisor_requests ORDER BY created_at DESC LIMIT 25
  `).all()).map((a) => ({
    type: 'advisor',
    id: 'a' + a.id,
    title: 'Solicitud de asesor',
    detail: `Pidió hablar con ${a.advisor_name || 'un asesor'}`,
    created_at: a.created_at,
  }));

  const subs = (await db.prepare(`
    SELECT id, name, email, created_at FROM subscribers ORDER BY created_at DESC LIMIT 25
  `).all()).map((s) => ({
    type: 'subscriber',
    id: 's' + s.id,
    title: 'Nuevo suscriptor',
    detail: s.name ? `${s.name} · ${s.email}` : s.email,
    created_at: s.created_at,
  }));

  const items = [...quotes, ...advisors, ...subs]
    .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
    .slice(0, 40);

  res.json({ items });
});

module.exports = router;
