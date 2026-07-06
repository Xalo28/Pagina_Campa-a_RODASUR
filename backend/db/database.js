// Conexión a MySQL y definición del esquema.
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config');

const pool = mysql.createPool({
  host: config.DB.host,
  port: config.DB.port,
  user: config.DB.user,
  password: config.DB.password,
  database: config.DB.name,
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

// --- Esquema ---
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS products (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    code           VARCHAR(191) UNIQUE NOT NULL,
    name           VARCHAR(255) NOT NULL,
    brand          VARCHAR(191),
    category       VARCHAR(191),
    description    TEXT,
    features       TEXT,               -- JSON: ["...", "..."]
    specs          TEXT,               -- JSON: [{"param":"","value":"","description":""}]
    price_regular  DOUBLE DEFAULT 0,
    price_discount DOUBLE DEFAULT 0,
    image          TEXT,
    stock          INT DEFAULT 0,
    on_discount    TINYINT DEFAULT 1,  -- 1 = se muestra en el catálogo de ofertas
    active         TINYINT DEFAULT 1,  -- 0 = oculto / borrado lógico
    valid_until    VARCHAR(40),
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_brand (brand),
    INDEX idx_products_category (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Registro de visitas (analítica propia)
  `CREATE TABLE IF NOT EXISTS visits (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id  VARCHAR(60),          -- id anónimo guardado en el navegador
    path        VARCHAR(300),
    product_id  INT,
    ip          VARCHAR(64),
    country     VARCHAR(10),          -- código ISO (PE, US, ...)
    city        VARCHAR(100),
    device      VARCHAR(20),          -- mobile | tablet | desktop
    browser     VARCHAR(40),
    os          VARCHAR(40),
    referrer    VARCHAR(300),
    user_agent  VARCHAR(400),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visits_created (created_at),
    INDEX idx_visits_product (product_id),
    INDEX idx_visits_visitor (visitor_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Solicitudes de cotización (leads de clientes interesados)
  `CREATE TABLE IF NOT EXISTS quotes (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    product_id   INT,
    product_code VARCHAR(80),
    product_name VARCHAR(200),
    name         VARCHAR(120) NOT NULL,
    company      VARCHAR(120),
    phone        VARCHAR(40),
    email        VARCHAR(120),
    message      TEXT,
    status       VARCHAR(30) NOT NULL DEFAULT 'nuevo',   -- nuevo | contactado | venta_concretada | venta_perdida
    ip           VARCHAR(64),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quotes_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Solicitudes de "hablar con un asesor" desde el chatbot
  `CREATE TABLE IF NOT EXISTS advisor_requests (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    advisor_name  VARCHAR(120),
    advisor_phone VARCHAR(30),
    visitor_id    VARCHAR(60),
    ip            VARCHAR(64),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_advisor_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Suscriptores para novedades / campañas de descuento
  `CREATE TABLE IF NOT EXISTS subscribers (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(120),
    email      VARCHAR(191) UNIQUE NOT NULL,
    phone      VARCHAR(40),
    active     TINYINT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subscribers_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Packs: agrupan 2 o más productos para venderse en paquete con descuento
  `CREATE TABLE IF NOT EXISTS packs (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    product_ids  TEXT,               -- JSON: [1, 4, 7]
    price_pack   DOUBLE DEFAULT 0,   -- precio del paquete (con descuento)
    image        TEXT,               -- opcional; si falta, se arma un collage con las fotos
    active       TINYINT DEFAULT 1,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

// --- Envoltorio que imita la API síncrona de better-sqlite3 (get/all/run) sobre mysql2 (async) ---
function resolveParams(args, hasNamed) {
  if (args.length === 0) return undefined;
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') {
    return hasNamed ? args[0] : undefined;
  }
  return args; // parámetros posicionales sueltos: run(a, b, c)
}

function prepare(sql) {
  const hasNamed = /:[a-zA-Z_]\w*/.test(sql);
  return {
    async get(...args) {
      const [rows] = await pool.execute(sql, resolveParams(args, hasNamed));
      return rows[0];
    },
    async all(...args) {
      const [rows] = await pool.execute(sql, resolveParams(args, hasNamed));
      return rows;
    },
    async run(...args) {
      const [result] = await pool.execute(sql, resolveParams(args, hasNamed));
      return { lastInsertRowid: result.insertId, changes: result.affectedRows };
    },
  };
}

// --- Migraciones para columnas nuevas en tablas existentes ---
async function addColumn(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Crea el usuario admin por defecto si no existe ninguno.
async function ensureAdminUser() {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
  if (rows[0].n === 0) {
    const hash = bcrypt.hashSync(config.ADMIN_PASSWORD, 10);
    await pool.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [config.ADMIN_USER, hash]);
    console.log(`[db] Usuario admin creado -> usuario: "${config.ADMIN_USER}"`);
  }
}

let ready = null;
// Crea las tablas (si faltan) y el usuario admin. Debe llamarse (y esperarse) antes de usar la BD.
function init() {
  if (!ready) {
    ready = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await pool.query(stmt);
      }
      await addColumn('products', 'images', 'TEXT');           // galería de fotos
      await addColumn('subscribers', 'company', 'VARCHAR(140)'); // empresa del suscriptor
      await addColumn('subscribers', 'position', 'VARCHAR(100)'); // cargo del suscriptor
      await addColumn('quotes', 'lost_reason', 'VARCHAR(500)');  // razón si la venta se perdió
      await ensureAdminUser();
    })();
  }
  return ready;
}

module.exports = { pool, prepare, init };
