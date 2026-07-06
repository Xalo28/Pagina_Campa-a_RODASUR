// Respaldo de la base de datos SQLite.
//   node scripts/backup.js      -> crea un respaldo ahora
//   se llama solo al arrancar el servidor (1 vez al día)
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const config = require('../config');

const BACKUP_DIR = path.join(path.dirname(config.DB_PATH), 'backups');
const KEEP = 14; // conserva los últimos 14 respaldos

function prune() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .sort()
    .reverse();
  files.slice(KEEP).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

async function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace('T', '_').replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `rodasur-${stamp}.db`);
  await db.backup(dest); // respaldo seguro (better-sqlite3)
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
