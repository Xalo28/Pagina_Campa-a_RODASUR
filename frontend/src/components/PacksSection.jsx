import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../lib/api.js';

function Collage({ products }) {
  const imgs = products.slice(0, 4);
  return (
    <div className={`grid gap-0.5 bg-slate-100 aspect-[16/10] ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {imgs.map((p, i) => (
        <div key={i} className={`overflow-hidden ${imgs.length === 3 && i === 0 ? 'row-span-2' : ''}`}>
          {p.image
            ? <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            : <div className="w-full h-full bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function PackCard({ pk }) {
  return (
    <Link to={`/pack/${pk.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-card border border-line flex flex-col transition duration-200 hover:-translate-y-1.5 hover:shadow-cardlg hover:border-brandblue/40">
      <div className="relative">
        <Collage products={pk.products} />
        {pk.discount_pct > 0 && (
          <span className="absolute top-3 left-3 bg-brandred text-white font-black text-[13px] px-2.5 py-1.5 rounded-lg shadow-[0_3px_10px_rgba(226,0,26,.4)]">-{pk.discount_pct}%</span>
        )}
        <span className="absolute top-3 right-3 bg-navy/90 backdrop-blur text-white font-bold text-[11px] px-2.5 py-1 rounded-md tracking-wide flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 7 12 3 4 7v10l8 4 8-4Z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>
          PACK
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] text-brandblue font-bold uppercase tracking-wide">Incluye {pk.products.length} productos</span>
        <h3 className="text-[15.5px] font-bold text-navy mt-1 leading-tight line-clamp-2 group-hover:text-brandblue transition">{pk.name}</h3>
        <p className="text-xs text-muted mt-1 mb-3 line-clamp-2">{pk.products.map((p) => p.name).join(' + ')}</p>
        <div className="mt-auto">
          {pk.sum_individual > pk.price_pack && <div className="text-muted line-through text-[13.5px]">{money(pk.sum_individual)}</div>}
          <div className="text-brandred text-[22px] font-black">{money(pk.price_pack)} <span className="text-xs text-muted font-semibold">+ IGV</span></div>
          {pk.savings > 0 && <div className="text-okgreen text-[13px] font-bold">Ahorras {money(pk.savings)}</div>}
        </div>
        <div className="mt-3 flex items-center justify-between text-brandred font-bold text-[13px]">
          <span className="group-hover:underline">Ver pack</span>
          <svg className="group-hover:translate-x-1 transition" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>
      </div>
    </Link>
  );
}

export default function PacksSection() {
  const [packs, setPacks] = useState(null);
  useEffect(() => { api('/api/packs').then(setPacks).catch(() => setPacks([])); }, []);
  if (!packs || packs.length === 0) return null;

  return (
    <section id="packs" className="max-w-[1220px] mx-auto px-5 pt-14">
      <div className="text-center mb-8">
        <span className="text-brandred font-bold text-sm uppercase tracking-[2px]">Ahorra más</span>
        <h2 className="text-2xl md:text-[30px] font-black text-navy mt-1">Packs en descuento</h2>
        <p className="text-muted mt-1">Combos de 2 o más productos a precio especial.</p>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))' }}>
        {packs.map((pk) => <PackCard key={pk.id} pk={pk} />)}
      </div>
    </section>
  );
}
