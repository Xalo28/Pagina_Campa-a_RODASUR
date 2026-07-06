import { useEffect, useState } from 'react';

function NoImg() {
  return (
    <div className="aspect-square w-full grid place-items-center text-slate-300 bg-slate-100 rounded-xl border border-line">
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
    </div>
  );
}

export default function Gallery({ images = [], name = '' }) {
  const pics = (images || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => { if (idx >= pics.length) setIdx(0); }, [pics.length, idx]);

  if (!pics.length) return <NoImg />;

  const go = (d) => { setIdx((i) => (i + d + pics.length) % pics.length); };

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {/* Miniaturas */}
      {pics.length > 1 && (
        <div className="flex sm:flex-col gap-2 sm:w-[76px] overflow-x-auto sm:overflow-y-auto sm:max-h-[440px] pb-1 sm:pb-0">
          {pics.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 bg-white transition ${i === idx ? 'border-brandblue' : 'border-line hover:border-brandblue/50'}`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Imagen principal con zoom al pasar el cursor */}
      <div className="flex-1">
        <div
          className="relative aspect-square bg-white rounded-xl border border-line overflow-hidden cursor-zoom-in group select-none"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onMouseMove={onMove}
          onClick={() => setLightbox(true)}
        >
          <img
            src={pics[idx]}
            alt={name}
            draggable={false}
            className="w-full h-full object-contain transition-transform duration-150 ease-out"
            style={{ transform: hover ? 'scale(2.1)' : 'scale(1)', transformOrigin: origin }}
          />
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4M11 8v6M8 11h6" /></svg>
            Ampliar
          </span>
          {pics.length > 1 && (
            <>
              <Arrow dir="left" onClick={(e) => { e.stopPropagation(); go(-1); }} />
              <Arrow dir="right" onClick={(e) => { e.stopPropagation(); go(1); }} />
              <span className="absolute top-2.5 left-2.5 bg-navy/80 text-white text-[11px] font-bold px-2 py-0.5 rounded">{idx + 1}/{pics.length}</span>
            </>
          )}
        </div>
      </div>

      {lightbox && <Lightbox pics={pics} idx={idx} setIdx={setIdx} name={name} onClose={() => setLightbox(false)} />}
    </div>
  );
}

function Arrow({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Anterior' : 'Siguiente'}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === 'left' ? 'left-2' : 'right-2'} w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center text-navy z-10`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        {dir === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  );
}

function Lightbox({ pics, idx, setIdx, name, onClose }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') { setZoom(false); setIdx((i) => (i - 1 + pics.length) % pics.length); }
      if (e.key === 'ArrowRight') { setZoom(false); setIdx((i) => (i + 1) % pics.length); }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [pics.length, onClose, setIdx]);

  function onMove(e) {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex justify-between items-center p-4 text-white/90">
        <span className="text-sm font-semibold truncate pr-4">{name} · {idx + 1}/{pics.length}</span>
        <button aria-label="Cerrar" className="text-3xl leading-none hover:text-white" onClick={onClose}>×</button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden px-4" onClick={(e) => e.stopPropagation()}>
        {pics.length > 1 && <Arrow dir="left" onClick={() => { setZoom(false); setIdx((i) => (i - 1 + pics.length) % pics.length); }} />}
        <img
          src={pics[idx]}
          alt={name}
          draggable={false}
          onClick={() => setZoom((z) => !z)}
          onMouseMove={onMove}
          className="max-h-[78vh] max-w-[92vw] object-contain transition-transform duration-150"
          style={{ transform: zoom ? 'scale(2.4)' : 'scale(1)', transformOrigin: origin, cursor: zoom ? 'zoom-out' : 'zoom-in' }}
        />
        {pics.length > 1 && <Arrow dir="right" onClick={() => { setZoom(false); setIdx((i) => (i + 1) % pics.length); }} />}
      </div>

      {pics.length > 1 && (
        <div className="flex gap-2 justify-center p-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {pics.map((src, i) => (
            <button key={i} onClick={() => { setZoom(false); setIdx(i); }} className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 ${i === idx ? 'border-white' : 'border-white/30'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-white/50 text-xs pb-3">Clic en la imagen para acercar/alejar · ← → para navegar · Esc para cerrar</p>
    </div>
  );
}
