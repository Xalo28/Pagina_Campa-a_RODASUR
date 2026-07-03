// Asesores de ventas de RODASUR (desde "numeros a agregar al flyer.xlsx").
// phone = formato internacional para WhatsApp (Perú = 51 + 9 dígitos).
export const ASESORES = [
  { name: 'Kan Gen Chiong', phone: '51940425553', email: 'kchiong@rodasur.com' },
  { name: 'Manuel Bravo', phone: '51923503198', email: 'mbravo@rodasur.com' },
  { name: 'Oscar Leiva', phone: '51977161790', email: 'oscarleiva@rodasur.com' },
  { name: 'Víctor Campos Otaegui', phone: '51920772255', email: 'vcampos@rodasur.com' },
  { name: 'Liliana Lozano', phone: '51974975724', email: 'liliana@rodasur.com' },
  { name: 'Selma Inuma Romero', phone: '51942433093', email: 'sinuma@rodasur.com' },
  { name: 'Pedro Lozano Salazar', phone: '51920187716', email: 'slozano@rodasur.com' },
  { name: 'Kimoy Romero A.', phone: '51943893154', email: 'kimoy@rodasur.com' },
  { name: 'César Poma', phone: '51988003935', email: 'cpoma@rodasur.com' },
  { name: 'Enrique Arenas', phone: '51947214800', email: 'earenas@rodasur.com' },
  { name: 'Daniel Lozano Salazar', phone: '51951577175', email: 'daniel@rodasur.com' },
];

// Muestra el número en formato legible: +51 9XX XXX XXX
export function prettyPhone(p) {
  const d = p.replace(/\D/g, '');
  const nat = d.startsWith('51') ? d.slice(2) : d;
  return `+51 ${nat.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
}

export function whatsappTo(phone, msg) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export const FAQS = [
  {
    q: '¿Hacen envíos a todo el Perú?',
    a: 'Sí ✅ Despachamos a Lima y a todas las provincias del Perú de forma rápida y segura a través de agencias de transporte.',
  },
  {
    q: '¿Los productos son originales?',
    a: 'Totalmente. Somos distribuidor oficial de Schaeffler, LUK, INA, FAG y BETEX, así que todos nuestros productos son 100% originales y garantizados.',
  },
  {
    q: '¿Ofrecen garantía?',
    a: 'Sí. Todos nuestros equipos cuentan con garantía de fábrica y respaldo técnico especializado de RODASUR.',
  },
  {
    q: '¿Incluyen capacitación?',
    a: 'Con la compra de tu equipo te brindamos una capacitación virtual gratuita para que aprendas a usarlo correctamente. 🎓',
  },
  {
    q: '¿Cómo cotizo un producto?',
    a: 'Muy fácil: en la ficha de cada producto usa el botón "Cotizar ahora" o "WhatsApp", o elige un asesor aquí mismo y te atendemos al instante.',
  },
  {
    q: '¿Emiten factura y boleta?',
    a: 'Sí, emitimos comprobantes electrónicos (factura y boleta) para todas tus compras.',
  },
  {
    q: '¿Qué formas de pago aceptan?',
    a: 'Aceptamos transferencia bancaria, depósito y otros medios. Tu asesor te indicará las opciones disponibles al cotizar.',
  },
];

// Ubicación / horario (edítalo si cambia)
export const EMPRESA = {
  direccion: 'Av. Guillermo Dansey Nro. 1912, Cercado de Lima',
  horario: 'Lunes a viernes de 8:00 a.m. a 6:00 p.m. · Sábados de 9:00 a.m. a 1:00 p.m.',
  maps: 'https://maps.google.com/?q=Av.+Guillermo+Dansey+1912+Cercado+de+Lima',
  web: 'https://www.rodasur.com',
};
