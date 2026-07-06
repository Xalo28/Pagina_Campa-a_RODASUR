// Respaldo de la base de datos MySQL (genera un archivo .sql con esquema + datos).
//   node scripts/backup.js      -> crea un respaldo ahora
//   se llama solo al arrancar el servidor (1 vez al día)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const db = require('../db/database');
const config = require('../config');

const BACKUP_DIR = config.BACKUP_DIR;
const KEEP = 14; // conserva los últimos 14 respaldos

function prune() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .reverse();
  files.slice(KEEP).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

// Genera un dump en texto plano (CREATE TABLE + INSERT) de toda la base de datos.
async function dumpDatabase() {
  const { pool } = db;
  const [tables] = await pool.query('SHOW TABLES');
  const tableNames = tables.map((row) => Object.values(row)[0]);

  let sql = `-- Respaldo de RODASUR (${config.DB.name}) - ${new Date().toISOString()}\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const table of tableNames) {
    const [[createRow]] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n${createRow['Create Table']};\n\n`;

    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (rows.length) {
      const columns = Object.keys(rows[0]);
      const columnList = columns.map((c) => `\`${c}\``).join(', ');
      const values = rows
        .map((row) => '(' + columns.map((c) => mysql.escape(row[c])).join(', ') + ')')
        .join(',\n');
      sql += `INSERT INTO \`${table}\` (${columnList}) VALUES\n${values};\n\n`;
    }
  }

  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  return sql;
}

async function runBackup() {
  await db.init();
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace('T', '_').replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `rodasur-${stamp}.sql`);
  const sql = await dumpDatabase();
  fs.writeFileSync(dest, sql, 'utf8');
  prune();
  return dest;
}

// Respaldo automático: 1 vez al día como máximo.
async function autoBackup() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const already = fs.readdirSync(BACKUP_DIR).some((f) => f.includes(today));
    if (!already) {
      const dest = await runBackup();
      console.log('  Respaldo de BD creado:', path.basename(dest));
    }
  } catch (err) {
    console.error('[backup] error:', err.message);
  }
}

module.exports = { runBackup, autoBackup };

// Ejecutado directamente desde la terminal
if (require.main === module) {
  runBackup()
    .then((dest) => { console.log('Respaldo creado en', dest); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}
