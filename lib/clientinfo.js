// Utilidades para extraer información del visitante desde la petición:
// IP real y dispositivo/navegador/SO (parseo simple del user-agent).

function getClientIp(req) {
  const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  let ip = xff || req.socket?.remoteAddress || req.ip || '';
  // Normaliza IPv6 mapeada a IPv4 (::ffff:1.2.3.4) y localhost
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

function geoFromIp() {
  // La geolocalización por IP se retiró (ya no se muestra en el dashboard).
  return { country: null, city: null };
}

function parseUserAgent(ua = '') {
  const s = ua.toLowerCase();

  let device = 'desktop';
  if (/tablet|ipad|playbook|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s))) device = 'tablet';
  else if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(s)) device = 'mobile';

  let browser = 'Otro';
  if (/edg\//.test(s)) browser = 'Edge';
  else if (/opr\/|opera/.test(s)) browser = 'Opera';
  else if (/chrome|crios/.test(s) && !/edg\//.test(s)) browser = 'Chrome';
  else if (/firefox|fxios/.test(s)) browser = 'Firefox';
  else if (/safari/.test(s) && !/chrome|crios/.test(s)) browser = 'Safari';
  else if (/msie|trident/.test(s)) browser = 'Internet Explorer';

  let os = 'Otro';
  if (/windows/.test(s)) os = 'Windows';
  else if (/android/.test(s)) os = 'Android';
  else if (/iphone|ipad|ipod/.test(s)) os = 'iOS';
  else if (/mac os x|macintosh/.test(s)) os = 'macOS';
  else if (/linux/.test(s)) os = 'Linux';

  return { device, browser, os };
}

module.exports = { getClientIp, geoFromIp, parseUserAgent };
