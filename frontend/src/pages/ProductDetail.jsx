import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import QuoteModal from '../components/QuoteModal.jsx';
import Gallery from '../components/Gallery.jsx';
import { api, money } from '../lib/api.js';
import { whatsappLink } from '../lib/config.js';

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    setP(null);
    setError(false);
    api('/api/products/' + id).then(setP).catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    if (p) document.title = `RODASUR · ${p.name}`;
  }, [p]);

  const back = (
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition">
      ← Volver al catálogo
    </Link>
  );

  const hasDisc = p && p.price_regular > p.price_discount;
  const saving = hasDisc ? p.price_regular - p.price_discount : 0;

  return (
    <>
      <Header right={back} />
      <main className="max-w-[1220px] mx-auto px-5 min-h-[50vh]">
        {error ? (
          <div className="text-center py-16 text-muted">
            <p>Producto no encontrado.</p>
            <Link to="/" className="inline-flex mt-3.5 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark">
              Volver al catálogo
            </Link>
          </div>
        ) : !p ? (
          <div className="text-center py-16 text-muted">Cargando producto…</div>
        ) : (
          <>
            <div className="py-4 text-[13.5px] text-muted">
              <Link to="/" className="hover:text-brandblue">Inicio</Link> ›{' '}
              <Link to={`/?category=${encodeURIComponent(p.category || '')}`} className="hover:text-brandblue">{p.category || 'Productos'}</Link> ›{' '}
              <span className="text-ink">{p.name}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-card p-6 mb-7">
              <Gallery images={p.images && p.images.length ? p.images : (p.image ? [p.image] : [])} name={p.name} />
              <div>
                <h1 className="text-[26px] text-navy font-black leading-tight">{p.name}</h1>
                <div className="flex gap-2 my-3 flex-wrap">
                  {p.brand && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#eaf1ff] text-brandblue">{p.brand}</span>}
                  {p.category && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#fdeaec] text-brandred">{p.category}</span>}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-page text-muted">Cód. {p.code}</span>
                </div>
                <p className="text-slate-700 my-3.5 text-[15px]">{p.description}</p>
                <div className="mb-2">
                  {p.stock === 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brandred"><span className="w-2 h-2 rounded-full bg-brandred" /> Agotado · consulta disponibilidad</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-okgreen"><span className="w-2 h-2 rounded-full bg-okgreen" /> Disponible{p.stock > 0 && p.stock <= 5 ? ` · últimas ${p.stock} unidades` : ''}</span>
                  )}
                </div>
                {p.valid_until && (
                  <div className="flex items-center gap-1.5 text-[13px] text-muted mb-1.5">
                    ⏱ Precio de campaña válido hasta el{' '}
                    {new Date(p.valid_until + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })} o hasta agotar stock.
                  </div>
                )}
                <div className="bg-gradient-to-br from-navy to-navy-700 text-white rounded-xl px-5 py-4 my-4 flex items-center gap-5 flex-wrap">
                  <div>
                    {hasDisc && <div className="text-[#a9b6d0] line-through text-[15px]">Antes {money(p.price_regular)}</div>}
                    <div className="text-[34px] font-black leading-none">
                      {money(p.price_discount || p.price_regular)} <span className="text-sm font-semibold text-[#cdd7ea]">+ IGV</span>
                    </div>
                  </div>
                  {hasDisc && (
                    <div className="bg-brandred px-3.5 py-2 rounded-lg font-extrabold ml-auto">
                      Ahorras {money(saving)} (-{p.discount_pct}%)
                    </div>
                  )}
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <button onClick={() => setShowQuote(true)} className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Cotizar ahora
                  </button>
                  <a href={whatsappLink(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <Link className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition" to="/">
                    Seguir viendo ofertas
                  </Link>
                </div>
                <p className="text-xs text-muted mt-3">✔ Entrega inmediata &nbsp; ✔ Capacitación incluida &nbsp; ✔ Equipo 100% confiable</p>
              </div>
            </div>

            {p.features?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
                <h3 className="text-navy text-lg font-bold mb-3.5 flex items-center gap-2.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f9d55" strokeWidth="2.2"><path d="M20 6 9 17l-5-5" /></svg> Características
                </h3>
                <ul className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2.5 items-start text-[14.5px] text-slate-700">
                      <svg className="text-okgreen shrink-0 mt-0.5" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {p.specs?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
                <h3 className="text-navy text-lg font-bold mb-3.5 flex items-center gap-2.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a5bd3" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg> Especificaciones técnicas
                </h3>
                <table className="w-full border-collapse">
                  <tbody>
                    {p.specs.map((s, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="py-2.5 px-2 text-sm align-top font-bold text-navy w-[34%]">{s.param}</td>
                        <td className="py-2.5 px-2 text-sm align-top font-semibold text-ink w-[26%]">{s.value}</td>
                        <td className="py-2.5 px-2 text-sm align-top text-muted">{s.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      {showQuote && p && <QuoteModal product={p} onClose={() => setShowQuote(false)} />}
      <Footer compact />
    </>
  );
}
