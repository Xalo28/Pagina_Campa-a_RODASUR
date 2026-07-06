// Límites de tasa para frenar fuerza bruta y spam en endpoints públicos.
const rateLimit = require('express-rate-limit');

const common = { standardHeaders: true, legacyHeaders: false };

// Login: pocos intentos por minuto e IP.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  ...common,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera un minuto e inténtalo de nuevo.' },
});

// Formularios públicos (cotizaciones, suscripción): evita floods.
const publicWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  ...common,
  message: { error: 'Demasiadas solicitudes seguidas. Intenta de nuevo en un momento.' },
});

// Analítica (visitas / clic en asesor): más permisivo.
const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 150, ...common });

module.exports = { loginLimiter, publicWriteLimiter, trackLimiter };
