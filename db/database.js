// Conexión a SQLite y definición del esquema.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Asegura que exista la carpeta /data
const dataDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(config.DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Esquema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT UNIQUE NOT NULL,
    name           TEXT NOT NULL,
    brand          TEXT,
    category       TEXT,
    description    TEXT,
    features       TEXT,               -- JSON: ["...", "..."]
    specs          TEXT,               -- JSON: [{"param":"","value":"","description":""}]
    price_regular  REAL DEFAULT 0,
    price_discount REAL DEFAULT 0,
    image          TEXT,
    stock          INTEGER DEFAULT 0,
    on_discount    INTEGER DEFAULT 1,  -- 1 = se muestra en el catálogo de ofertas
    active         INTEGER DEFAULT 1,  -- 0 = oculto / borrado lógico
    valid_until    TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  -- Registro de visitas (analítica propia)
  CREATE TABLE IF NOT EXISTS visits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id  TEXT,                 -- id anónimo guardado en el navegador
    path        TEXT,
    product_id  INTEGER,
    ip          TEXT,
    country     TEXT,                 -- código ISO (PE, US, ...)
    city        TEXT,
    device      TEXT,                 -- mobile | tablet | desktop
    browser     TEXT,
    os          TEXT,
    referrer    TEXT,
    user_agent  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);
  CREATE INDEX IF NOT EXISTS idx_visits_product ON visits(product_id);
  CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);

  -- Solicitudes de cotización (leads de clientes interesados)
  CREATE TABLE IF NOT EXISTS quotes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id   INTEGER,
    product_code TEXT,
    product_name TEXT,
    name         TEXT NOT NULL,
    company      TEXT,
    phone        TEXT,
    email        TEXT,
    message      TEXT,
    status       TEXT NOT NULL DEFAULT 'nuevo',   -- nuevo | contactado | cerrado
    ip           TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at);

  -- Solicitudes de "hablar con un asesor" desde el chatbot
  CREATE TABLE IF NOT EXISTS advisor_requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    advisor_name  TEXT,
    advisor_phone TEXT,
    visitor_id    TEXT,
    ip            TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_advisor_created ON advisor_requests(created_at);

  -- Suscriptores para novedades / campañas de descuento
  CREATE TABLE IF NOT EXISTS subscribers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT UNIQUE NOT NULL,
    phone      TEXT,
    active     INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_subscribers_created ON subscribers(created_at);

  -- Packs: agrupan 2 o más productos para venderse en paquete con descuento
  CREATE TABLE IF NOT EXISTS packs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    description  TEXT,
    product_ids  TEXT,               -- JSON: [1, 4, 7]
    price_pack   REAL DEFAULT 0,     -- precio del paquete (con descuento)
    image        TEXT,               -- opcional; si falta, se arma un collage con las fotos
    active       INTEGER DEFAULT 1,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Migraciones para columnas nuevas en tablas existentes ---
function addColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

addColumn('products', 'images', 'TEXT');        // galería de fotos
addColumn('subscribers', 'company', 'TEXT');    // empresa del suscriptor
addColumn('subscribers', 'position', 'TEXT');   // cargo del suscriptor
addColumn('quotes', 'lost_reason', 'TEXT');     // razón si la venta se perdió

// Crea el usuario admin por defecto si no existe ninguno.
function ensureAdminUser() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count === 0) {
    const hash = bcrypt.hashSync(config.ADMIN_PASSWORD, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(config.ADMIN_USER, hash);
    console.log(`[db] Usuario admin creado -> usuario: "${config.ADMIN_USER}"`);
  }
}
ensureAdminUser();

module.exports = db;
