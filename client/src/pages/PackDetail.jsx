import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import QuoteModal from '../components/QuoteModal.jsx';
import { api, money } from '../lib/api.js';
import { whatsappLink } from '../lib/config.js';

export default function PackDetail() {
  const { id } = useParams();
  const [pk, setPk] = useState(null);
  const [error, setError] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    setPk(null); setError(false);
    api('/api/packs/' + id).then(setPk).catch(() => setError(true));
  }, [id]);
  useEffect(() => { if (pk) document.title = `RODASUR · ${pk.name}`; }, [pk]);

  const back = (
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition">← Volver al catálogo</Link>
  );

  const packAsProduct = pk ? { id: null, code: `PACK-${pk.id}`, name: `Pack: ${pk.name}` } : null;

  return (
    <>
      <Header right={back} />
      <main className="max-w-[1220px] mx-auto px-5 min-h-[50vh]">
        {error ? (
          <div className="text-center py-16 text-muted"><p>Pack no encontrado.</p><Link to="/" className="inline-flex mt-3.5 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark">Volver</Link></div>
        ) : !pk ? (
          <div className="text-center py-16 text-muted">Cargando pack…</div>
        ) : (
          <>
            <div className="py-4 text-[13.5px] text-muted"><Link to="/" className="hover:text-brandblue">Inicio</Link> › <span className="text-ink">{pk.name}</span></div>

            <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-card p-6 mb-7">
              {/* Collage de productos */}
              <div className={`grid gap-1 rounded-xl overflow-hidden border border-line bg-slate-100 ${pk.products.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {pk.products.slice(0, 4).map((p, i) => (
                  <div key={i} className="aspect-square overflow-hidden bg-white">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-slate-100" />}
                  </div>
                ))}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#eaf1ff] text-brandblue">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 7 12 3 4 7v10l8 4 8-4Z" /></svg>
                  PACK · {pk.products.length} productos
                </span>
                <h1 className="text-[26px] text-navy font-black leading-tight mt-2">{pk.name}</h1>
                {pk.description && <p className="text-slate-700 my-3.5 text-[15px]">{pk.description}</p>}

                <div className="bg-gradient-to-br from-navy to-navy-700 text-white rounded-xl px-5 py-4 my-4 flex items-center gap-5 flex-wrap">
                  <div>
                    {pk.sum_individual > pk.price_pack && <div className="text-[#a9b6d0] line-through text-[15px]">Por separado {money(pk.sum_individual)}</div>}
                    <div className="text-[34px] font-black leading-none">{money(pk.price_pack)} <span className="text-sm font-semibold text-[#cdd7ea]">+ IGV</span></div>
                  </div>
                  {pk.savings > 0 && <div className="bg-brandred px-3.5 py-2 rounded-lg font-extrabold ml-auto">Ahorras {money(pk.savings)} (-{pk.discount_pct}%)</div>}
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  <button onClick={() => setShowQuote(true)} className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition">Cotizar este pack</button>
                  <a href={whatsappLink(packAsProduct)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Productos incluidos */}
            <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
              <h3 className="text-navy text-lg font-bold mb-4">Productos incluidos en el pack</h3>
              <div className="divide-y divide-line">
                {pk.products.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-4 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition">
                    {p.image ? <img src={p.image} className="w-14 h-14 rounded-lg object-cover bg-page" alt="" /> : <div className="w-14 h-14 rounded-lg bg-page" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy truncate">{p.name}</div>
                      <div className="text-xs text-muted">{p.brand ? p.brand + ' · ' : ''}Cód. {p.code}</div>
                    </div>
                    <div className="text-brandred font-bold whitespace-nowrap">{money(p.price_discount || p.price_regular)}</div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer compact />
      {showQuote && pk && <QuoteModal product={packAsProduct} onClose={() => setShowQuote(false)} />}
    </>
  );
}
