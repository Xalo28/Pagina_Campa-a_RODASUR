import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import BrandsStrip from '../components/BrandsStrip.jsx';
import PacksSection from '../components/PacksSection.jsx';
import Features from '../components/Features.jsx';
import Subscribe from '../components/Subscribe.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { api, money } from '../lib/api.js';

/* Iconos de categoría (elegidos por palabra clave) */
const ICONS = {
  heater: <><path d="M8 2v6M12 2v6M16 2v6" /><rect x="4" y="8" width="16" height="13" rx="2" /><path d="M8 13h8" /></>,
  extractor: <><path d="M12 2v6M9 8h6l-1 6H10L9 8ZM10 14l-2 8M14 14l2 8" /></>,
  gauge: <><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M12 12 8 8" /><path d="M20.5 15a9 9 0 1 0-17 0" /></>,
  tool: <><path d="M14.7 6.3a4 4 0 0 0 5 5l-8.4 8.4a2.1 2.1 0 0 1-3-3l8.4-8.4a4 4 0 0 0-2-2Z" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
};
function catIcon(name = '') {
  const n = name.toLowerCase();
  if (/calent|inducc|heater/.test(n)) return ICONS.heater;
  if (/extractor/.test(n)) return ICONS.extractor;
  if (/medic|aline|láser|laser|trumm/.test(n)) return ICONS.gauge;
  if (/montaje|herramient|mate/.test(n)) return ICONS.tool;
  return ICONS.gear;
}

function ProductCard({ p }) {
  return (
    <Link
      to={`/product/${p.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-card border border-line flex flex-col transition duration-200 hover:-translate-y-1.5 hover:shadow-cardlg hover:border-brandblue/40"
    >
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {p.image ? (
          <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-300">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
          </div>
        )}
        {p.discount_pct > 0 && (
          <span className="absolute top-3 left-3 bg-brandred text-white font-black text-[13px] px-2.5 py-1.5 rounded-lg shadow-[0_3px_10px_rgba(226,0,26,.4)]">-{p.discount_pct}%</span>
        )}
        {p.brand && (
          <span className="absolute top-3 right-3 bg-navy/90 backdrop-blur text-white font-bold text-[11px] px-2.5 py-1 rounded-md tracking-wide">{p.brand}</span>
        )}
        {p.stock === 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-navy/85 text-white text-center text-[11px] font-bold py-1 tracking-wide">Agotado</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] text-brandblue font-bold uppercase tracking-wide">{p.category}</span>
        <h3 className="text-[15.5px] font-bold text-navy mt-1 mb-0.5 leading-tight line-clamp-2 group-hover:text-brandblue transition">{p.name}</h3>
        <div className="text-xs text-muted mb-3">Cód. {p.code}</div>
        <div className="mt-auto">
          {p.price_regular > p.price_discount && <div className="text-muted line-through text-[13.5px]">{money(p.price_regular)}</div>}
          <div className="text-brandred text-[22px] font-black">{money(p.price_discount || p.price_regular)} <span className="text-xs text-muted font-semibold">+ IGV</span></div>
        </div>
        <div className="mt-3 flex items-center justify-between text-brandred font-bold text-[13px]">
          <span className="group-hover:underline">Ver detalle</span>
          <svg className="group-hover:translate-x-1 transition" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>
      </div>
    </Link>
  );
}

export default function Catalog() {
  const [meta, setMeta] = useState({ brands: [], categories: [], total: 0 });
  const [products, setProducts] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('relevancia');
  const [visible, setVisible] = useState(12);
  const debounce = useRef();
  const catalogRef = useRef(null);

  const PAGE = 12;
  const sorted = useMemo(() => {
    const list = [...(products || [])];
    const price = (p) => p.price_discount || p.price_regular;
    if (sort === 'precio-asc') list.sort((a, b) => price(a) - price(b));
    else if (sort === 'precio-desc') list.sort((a, b) => price(b) - price(a));
    else if (sort === 'descuento') list.sort((a, b) => (b.discount_pct || 0) - (a.discount_pct || 0));
    else if (sort === 'nombre') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort]);
  const shown = sorted.slice(0, visible);

  useEffect(() => { setVisible(PAGE); }, [search, category, brand, sort]);

  useEffect(() => { api('/api/products/meta').then(setMeta).catch(() => {}); }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const params = new URLSearchParams({ discount: '1' });
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
      setProducts(null);
      api('/api/products?' + params.toString()).then(setProducts).catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [search, category, brand]);

  function pickCategory(c) {
    setCategory(c);
    setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  return (
    <>
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden text-white bg-gradient-to-br from-navy via-navy to-navy-700">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(226,0,26,.28),transparent_70%)]" />
        <div className="relative z-10 max-w-[1220px] mx-auto px-5 py-14 md:py-20 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-brandred px-3.5 py-1.5 rounded-full text-[12.5px] font-extrabold tracking-wide mb-5">
              🇵🇪 CAMPAÑA POR EL MES PATRIO · HASTA EL 30 DE JULIO
            </span>
            <h1 className="text-[24px] md:text-[36px] font-black leading-[1.12] uppercase">
              Campaña de ventas de herramientas y <span className="text-[#ff5a6e]">productos especiales</span>
            </h1>
            <p className="mt-4 text-[14.5px] md:text-[15.5px] text-[#cdd7ea] max-w-[600px] leading-relaxed">
              Somos una empresa peruana con más de <strong className="text-white">30 años de experiencia</strong> en el mercado. Distribuidores Autorizados en Perú de Rodamientos <strong className="text-white">SKF, KOYO, INA, FAG, NTN, NSK y RKB</strong>, líderes mundiales en la fabricación de rodamientos de la más alta calidad, precisión y confiabilidad.
            </p>
            <div className="flex gap-3 mt-7 flex-wrap">
              <button onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg bg-brandred hover:bg-brandred-dark transition">
                Ver ofertas
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('rodasur:open-chat'))} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Contactar ventas
              </button>
            </div>
            <div className="flex gap-8 mt-9 flex-wrap">
              <div><div className="text-3xl font-black">{meta.total || '—'}</div><div className="text-[12px] text-[#a9b6d0] uppercase tracking-wider">Productos en oferta</div></div>
              <div><div className="text-3xl font-black">16</div><div className="text-[12px] text-[#a9b6d0] uppercase tracking-wider">Marcas aliadas</div></div>
              <div><div className="text-3xl font-black">100%</div><div className="text-[12px] text-[#a9b6d0] uppercase tracking-wider">Originales</div></div>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative animate-floaty">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-3xl" />
              <img src="/Rodamiento.png" alt="Rodamientos RODASUR" className="relative w-full max-w-[520px] h-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      <BrandsStrip />

      {/* ===== CATEGORÍAS ===== */}
      {meta.categories.length > 0 && (
        <section className="max-w-[1220px] mx-auto px-5 pt-14 pb-2">
          <div className="text-center mb-8">
            <span className="text-brandred font-bold text-sm uppercase tracking-[2px]">Explora</span>
            <h2 className="text-2xl md:text-[30px] font-black text-navy mt-1">Nuestras categorías</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {meta.categories.map((c) => (
              <button
                key={c}
                onClick={() => pickCategory(c)}
                className={`group bg-white rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:shadow-cardlg ${category === c ? 'border-brandblue shadow-card ring-2 ring-brandblue/20' : 'border-line shadow-card'}`}
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-page grid place-items-center mb-3 group-hover:bg-navy transition">
                  <svg className="text-navy group-hover:text-white transition" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{catIcon(c)}</svg>
                </div>
                <div className="text-[13.5px] font-bold text-navy leading-tight">{c}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <PacksSection />

      {/* ===== CATÁLOGO ===== */}
      <main ref={catalogRef} className="max-w-[1220px] mx-auto px-5 pt-10 scroll-mt-24">
        <div className="bg-white rounded-2xl shadow-card p-4 flex gap-3 flex-wrap items-center mb-8 border border-line">
          <div className="relative flex-1 min-w-[240px]">
            <svg className="absolute left-3.5 top-3 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, código o marca..." className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="py-2.5 px-3.5 border-[1.5px] border-line rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-brandblue">
            <option value="">Todas las categorías</option>
            {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="py-2.5 px-3.5 border-[1.5px] border-line rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-brandblue">
            <option value="">Todas las marcas</option>
            {meta.brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="py-2.5 px-3.5 border-[1.5px] border-line rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-brandblue">
            <option value="relevancia">Ordenar por…</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="descuento">Mayor descuento</option>
            <option value="nombre">Nombre (A-Z)</option>
          </select>
          {(category || brand || search) && (
            <button onClick={() => { setCategory(''); setBrand(''); setSearch(''); }} className="text-sm font-bold text-muted hover:text-brandred px-3 py-2.5">Limpiar ✕</button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-7 bg-brandred rounded-full" />
          <h2 className="text-[22px] font-black text-navy">{category || 'Ofertas destacadas'}</h2>
          {products && <span className="text-muted text-sm">· {products.length} producto{products.length !== 1 ? 's' : ''}</span>}
        </div>

        <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
          {products === null ? (
            <div className="col-span-full text-center py-16 text-muted">Cargando productos…</div>
          ) : sorted.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted">
              <svg className="mx-auto mb-3.5 text-slate-300" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>
              <p>No se encontraron productos con esos filtros.</p>
            </div>
          ) : (
            shown.map((p) => <ProductCard key={p.id} p={p} />)
          )}
        </div>

        {shown.length < sorted.length && (
          <div className="text-center mb-12">
            <button onClick={() => setVisible((v) => v + PAGE)} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition">
              Ver más productos ({sorted.length - shown.length})
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            </button>
          </div>
        )}
      </main>

      <Features />
      <Subscribe />
      <CtaBand />
      <Footer />
    </>
  );
}
