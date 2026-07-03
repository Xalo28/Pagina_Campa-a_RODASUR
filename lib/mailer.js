// Envío de correos a suscriptores (opcional, vía SMTP configurado en .env).
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
function getTransporter() {
  if (!config.MAIL_ENABLED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP.host,
      port: config.SMTP.port,
      secure: config.SMTP.secure,
      auth: { user: config.SMTP.user, pass: config.SMTP.pass },
    });
  }
  return transporter;
}

// Envía la campaña por lotes en BCC (para no exponer los correos entre suscriptores).
async function sendCampaign(subject, html, recipients) {
  const t = getTransporter();
  if (!t) throw new Error('El correo no está configurado. Define SMTP_* en el archivo .env.');

  const result = { sent: 0, failed: 0 };
  const batchSize = 40;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    try {
      await t.sendMail({ from: config.SMTP.from, to: config.SMTP.from, bcc: batch, subject, html });
      result.sent += batch.length;
    } catch (err) {
      console.error('[mailer] lote falló:', err.message);
      result.failed += batch.length;
    }
  }
  return result;
}

module.exports = { sendCampaign, mailEnabled: () => config.MAIL_ENABLED };
