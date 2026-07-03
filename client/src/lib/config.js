// ⚙️ Configuración editable del frontend.

// Número de WhatsApp de RODASUR (formato internacional, solo dígitos, con código de país).
// 👉 REEMPLAZA este número por el real de tu ejecutivo de ventas.
// Perú = 51. Ejemplo: '51987654321'
export const WHATSAPP_NUMBER = '+51998055045';

// wa.me requiere solo dígitos (sin +, espacios ni guiones).
const WA_DIGITS = String(WHATSAPP_NUMBER).replace(/\D/g, '');

// Construye el enlace de WhatsApp con un mensaje pre-armado sobre el producto.
export function whatsappLink(product) {
  const msg = `Hola RODASUR 👋, estoy interesado en el producto *${product.name}* (Cód. ${product.code}). ¿Me pueden enviar más información y disponibilidad?`;
  return `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(msg)}`;
}
