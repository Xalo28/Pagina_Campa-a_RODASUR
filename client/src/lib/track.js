// Registro de visitas del lado del cliente.
// Genera un id anónimo persistente por navegador (no identifica a la persona).
const VISITOR_KEY = 'rodasur_visitor';

function visitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function beacon(url, payload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    /* la analítica nunca debe romper la app */
  }
}

export function trackPageView(path, productId = null) {
  beacon('/api/analytics/track', {
    visitor_id: visitorId(),
    path,
    product_id: productId,
    referrer: document.referrer || '',
  });
}

// Registra que un visitante pidió hablar con un asesor (desde el chatbot).
export function trackAdvisorRequest(name, phone) {
  beacon('/api/analytics/advisor', {
    visitor_id: visitorId(),
    advisor_name: name,
    advisor_phone: phone,
  });
}
