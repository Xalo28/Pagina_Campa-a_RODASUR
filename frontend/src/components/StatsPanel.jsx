import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
];
const RANGE_TEXT = { today: 'hoy', '7d': 'últimos 7 días', '30d': 'últimos 30 días' };

function Bars({ data, labelKey = 'label', valueKey = 'n', color = 'bg-brandblue' }) {
  if (!data.length) return <p className="text-muted text-sm py-2">Sin datos en este periodo.</p>;
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-36 shrink-0 truncate text-ink" title={d[labelKey]}>{d[labelKey]}</span>
          <div className="flex-1 bg-page rounded-full h-4 overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${(d[valueKey] / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-bold text-navy">{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [range, setRange] = useState('7d');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setError('');
    api('/api/analytics/stats?range=' + range)
      .then((d) => alive && setStats(d))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [range]);

  const card = 'bg-white rounded-2xl shadow-card p-5';

  const selector = (
    <div className="inline-flex bg-white rounded-xl shadow-card p-1 border border-line">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => setRange(r.key)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${range === r.key ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (error) return <div className="space-y-4"><div className="flex justify-end">{selector}</div><div className="bg-white rounded-2xl shadow-card p-6 text-brandred-dark">{error}</div></div>;
  if (!stats) return <div className="space-y-4"><div className="flex justify-end">{selector}</div><div className="bg-white rounded-2xl shadow-card p-6 text-muted">Cargando estadísticas…</div></div>;

  const maxBar = Math.max(1, ...stats.series.map((s) => s.visits));
  const labelEvery = Math.max(1, Math.ceil(stats.series.length / 12));

  const cards = [
    { n: stats.total, l: 'Visitas', c: 'border-brandblue' },
    { n: stats.uniques, l: 'Visitantes únicos', c: 'border-navy' },
    { n: `${stats.quotesNew}/${stats.quotesTotal}`, l: 'Cotizaciones (nuevas/total)', c: 'border-brandred' },
    { n: stats.advisorTotal ?? 0, l: 'Solicitudes de asesor', c: 'border-okgreen' },
  ];

  return (
    <div className="space-y-5">
      {/* Encabezado + selector de periodo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-black text-navy">Resumen · {RANGE_TEXT[range]}</h2>
        {selector}
      </div>

      {/* Tarjetas */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        {cards.map((s, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-card p-4 border-l-4 ${s.c}`}>
            <div className="text-2xl font-black text-navy">{s.n}</div>
            <div className="text-[12.5px] text-muted uppercase tracking-wide">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de visitas (por hora si es hoy, por día si no) */}
      <div className={card}>
        <h3 className="text-navy font-bold mb-4">{range === 'today' ? 'Visitas por hora (hoy)' : `Visitas · ${RANGE_TEXT[range]}`}</h3>
        <div className="flex items-end gap-1 h-44">
          {stats.series.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="text-[10px] text-muted mb-1 opacity-0 group-hover:opacity-100 transition">{s.visits}</div>
              <div
                className="w-full bg-brandblue hover:bg-brandblue-light rounded-t transition-all"
                style={{ height: `${(s.visits / maxBar) * 100}%`, minHeight: s.visits ? '4px' : '0' }}
                title={`${s.label}: ${s.visits} visitas · ${s.uniques} únicos`}
              />
              <div className="text-[9px] text-muted mt-1 whitespace-nowrap h-3">{i % labelEvery === 0 ? s.label : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Productos más vistos */}
      <div className={card}>
        <h3 className="text-navy font-bold mb-4">Productos más vistos · {RANGE_TEXT[range]}</h3>
        <Bars data={stats.topProducts} labelKey="name" valueKey="views" color="bg-brandred" />
      </div>

      {/* Asesores más solicitados (desde el chatbot) */}
      <div className={card}>
        <h3 className="text-navy font-bold mb-1">Asesores más solicitados · {RANGE_TEXT[range]}</h3>
        <p className="text-muted text-[13px] mb-4">Veces que se pidió hablar con cada asesor desde el chat · {stats.advisorTotal ?? 0} en total</p>
        <Bars data={stats.topAdvisors || []} color="bg-brandblue-light" />
      </div>
    </div>
  );
}
