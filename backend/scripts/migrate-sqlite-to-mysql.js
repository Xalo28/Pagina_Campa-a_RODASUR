// Migra los datos existentes de backend/data/rodasur.db (SQLite) hacia MySQL.
// Uso (una sola vez, con el servidor detenido):
//   npm run migrate-sqlite
//
// Requiere que la base de datos MySQL de destino (ver .env: DB_HOST/DB_NAME/...)
// ya exista, aunque esté vacía. El script crea las tablas si faltan.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = require('../db/database');

const SQLITE_PATH = path.join(__dirname, '..', 'data', 'rodasur.db');

// Tablas a copiar, en el orden en que se insertan (no hay FKs reales, así que el orden no es crítico).
const TABLES = ['users', 'products', 'visits', 'quotes', 'advisor_requests', 'subscribers', 'packs'];

async function migrateTable(sqliteDb, table) {
  const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
  if (!rows.length) {
    console.log(`  [${table}] sin filas, se omite.`);
    return 0;
  }

  // Borra lo que haya en MySQL (p.ej. el admin creado automáticamente) para evitar choques de ids/únicos.
  await db.pool.query(`DELETE FROM ${table}`);

  const columns = Object.keys(rows[0]);
  const columnList = columns.map((c) => `\`${c}\``).join(', ');
  const placeholders = '(' + columns.map(() => '?').join(', ') + ')';
  const insert = db.prepare(`INSERT INTO ${table} (${columnList}) VALUES ${placeholders}`);

  for (const row of rows) {
    const values = columns.map((c) => (row[c] === undefined ? null : row[c]));
    await insert.run(values);
  }

  // Reajusta el contador AUTO_INCREMENT ya que insertamos ids explícitos.
  const maxId = Math.max(...rows.map((r) => Number(r.id) || 0));
  await db.pool.query(`ALTER TABLE ${table} AUTO_INCREMENT = ${maxId + 1}`);

  console.log(`  [${table}] ${rows.length} filas migradas.`);
  return rows.length;
}

async function main() {
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`No se encontró la base SQLite en ${SQLITE_PATH}`);
    process.exit(1);
  }

  console.log('Creando/verificando el esquema en MySQL...');
  await db.init();

  console.log('Abriendo base SQLite de origen:', SQLITE_PATH);
  const sqliteDb = new Database(SQLITE_PATH, { readonly: true });

  await db.pool.query('SET FOREIGN_KEY_CHECKS=0');
  try {
    let total = 0;
    for (const table of TABLES) {
      total += await migrateTable(sqliteDb, table);
    }
    console.log(`\nListo. ${total} filas migradas en total.`);
  } finally {
    await db.pool.query('SET FOREIGN_KEY_CHECKS=1');
    sqliteDb.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] error:', err);
    process.exit(1);
  });
