import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const SEEN_KEY = 'rodasur_notif_seen';
const toMs = (s) => Date.parse(String(s).replace(' ', 'T') + 'Z') || 0;

function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

const META = {
  quote: { color: 'bg-brandred', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6" /> },
  advisor: { color: 'bg-brandblue', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  subscriber: { color: 'bg-okgreen', icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></> },
};

export default function NotificationsBell({ onOpenTab }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY) || 0));
  const ref = useRef(null);

  async function load() {
    try {
      const data = await api('/api/analytics/notifications');
      setItems(data.items || []);
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // sondea cada 30 s
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const unread = items.filter((i) => toMs(i.created_at) > seen).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items.length) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setSeen(now);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notificaciones" className="relative w-10 h-10 rounded-lg grid place-items-center bg-white/10 hover:bg-white/20 text-white transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brandred text-white text-[11px] font-bold grid place-items-center ring-2 ring-navy">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[330px] max-w-[92vw] bg-white rounded-xl shadow-cardlg border border-line overflow-hidden z-[130]">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-bold text-navy text-sm">Notificaciones</span>
            <span className="text-xs text-muted">{items.length} recientes</span>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">Sin actividad todavía.</p>
            ) : (
              items.map((it) => {
                const m = META[it.type] || META.quote;
                const isNew = toMs(it.created_at) > seen;
                const tab = it.type === 'quote' ? 'cotizaciones' : it.type === 'subscriber' ? 'suscriptores' : 'estadisticas';
                return (
                  <button
                    key={it.id}
                    onClick={() => { setOpen(false); onOpenTab?.(tab); }}
                    className={`w-full flex gap-3 items-start text-left px-4 py-3 border-b border-line hover:bg-slate-50 transition ${isNew ? 'bg-brandblue/5' : ''}`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-full ${m.color} grid place-items-center mt-0.5`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">{m.icon}</svg>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-navy text-[13.5px]">{it.title}</span>
                        {isNew && <span className="w-2 h-2 rounded-full bg-brandred" />}
                      </span>
                      <span className="block text-[13px] text-ink truncate">{it.detail}</span>
                      <span className="block text-[11.5px] text-muted">{timeAgo(toMs(it.created_at))}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
