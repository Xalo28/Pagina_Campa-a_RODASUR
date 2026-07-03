// Servidor Express - Portal de descuentos RODASUR
// Sirve el API REST + las imágenes subidas + la SPA de React (client/dist).
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const quotesRoutes = require('./routes/quotes');
const subscribersRoutes = require('./routes/subscribers');
const packsRoutes = require('./routes/packs');
const { autoBackup } = require('./scripts/backup');

const app = express();

// Cabeceras de seguridad (CSP desactivada para no romper fuentes/estilos del build).
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Imágenes de productos subidas por el admin
app.use('/uploads', express.static(config.UPLOAD_DIR));

// Chequeo de salud
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/packs', packsRoutes);

// Frontend React compilado (se genera con: npm run build)
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

// --- Open Graph: al compartir un producto (WhatsApp/Facebook) muestra imagen + precio ---
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function injectOG(html, req) {
  const m = /^\/product\/(\d+)/.exec(req.path);
  if (!m) return html;
  const p = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(m[1]);
  if (!p) return html;
  const base = `${req.protocol}://${req.get('host')}`;
  const price = p.price_discount || p.price_regular;
  const title = esc(`${p.name} · RODASUR`);
  const desc = esc(`${p.brand ? p.brand + ' · ' : ''}$ ${Number(price).toLocaleString('es-PE', { minimumFractionDigits: 2 })} + IGV${p.description ? ' · ' + p.description.slice(0, 120) : ''}`);
  const img = p.image ? (p.image.startsWith('http') ? p.image : base + p.image) : `${base}/logo.png`;
  const tags = `
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${esc(img)}" />
    <meta property="og:url" content="${esc(base + req.originalUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>${title}</title>`;
  return html.replace('</head>', tags + '\n</head>');
}

// Fallback para el enrutado del lado del cliente (React Router)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ruta no encontrada.' });
  const indexFile = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    return res.status(503).send('<h2>Falta compilar el frontend</h2><p>Ejecuta <code>npm run build</code> (o <code>npm run client</code> para desarrollo).</p>');
  }
  let html = fs.readFileSync(indexFile, 'utf8');
  try { html = injectOG(html, req); } catch (_) { /* si falla, sirve el html normal */ }
  res.set('Content-Type', 'text/html').send(html);
});

// Manejo de errores (incluye errores de Multer)
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

app.listen(config.PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║   RODASUR - Portal de Descuentos (React + API)    ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log(`  App:      http://localhost:${config.PORT}/`);
  console.log(`  Admin:    http://localhost:${config.PORT}/admin`);
  if (config.USING_DEFAULT_SECRETS) {
    console.log('');
    console.log('  ⚠  ADVERTENCIA: estás usando la contraseña y/o el JWT_SECRET por defecto.');
    console.log('     Antes de publicar, crea un archivo .env (ver .env.example) y cámbialos.');
  }
  console.log(`  Correos a suscriptores: ${config.MAIL_ENABLED ? 'ACTIVADOS' : 'desactivados (configura SMTP_* en .env)'}`);
  console.log('');
  autoBackup(); // respaldo automático de la BD (1 vez al día)
});
