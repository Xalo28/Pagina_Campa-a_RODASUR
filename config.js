// Configuración central. Las variables sensibles deben venir de un archivo .env
// (ver .env.example) o de variables de entorno del sistema.
require('dotenv').config();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'rodasur-secret-cambia-esto-en-produccion';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rodasur2026';

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD,

  DB_PATH: process.env.DB_PATH || path.join(__dirname, 'data', 'rodasur.db'),
  UPLOAD_DIR: path.join(__dirname, 'public', 'uploads'),

  // ¿Se están usando los valores por defecto? (para avisar al arrancar)
  USING_DEFAULT_SECRETS:
    JWT_SECRET === 'rodasur-secret-cambia-esto-en-produccion' || ADMIN_PASSWORD === 'rodasur2026',

  // Envío de correos a suscriptores (opcional). Configura SMTP_* en .env para activarlo.
  SMTP: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'RODASUR <no-reply@rodasur.com>',
  },
  get MAIL_ENABLED() {
    return !!(this.SMTP.host && this.SMTP.user && this.SMTP.pass);
  },
};
