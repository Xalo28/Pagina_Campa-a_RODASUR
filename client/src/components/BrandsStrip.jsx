// Tira unificada de marcas aliadas: marcas con estilo de texto + logos (imágenes).
const textBrands = [
  { name: 'SCHAEFFLER', className: 'text-[#00893d]' },
  { name: 'FAG', className: 'text-[#e2001a]' },
  { name: 'INA', className: 'text-[#00893d]' },
  { name: 'LUK', className: 'bg-[#ffd200] text-black px-2 rounded' },
  { name: 'BETEX', className: 'bg-[#e2001a] text-white px-2 rounded' },
];

// Logos en client/public/marcas/
const logos = [
  'SKF.jpg', 'NSK.jpg', 'NTN.jpg', 'jTEKT.jpg', 'RKB.jpg', 'Fersa_Group.jpg',
  'GATES.jpg', 'optibelt.jpg', 'INAFG.jpg', 'JML.jpg', 'nak.jpg',
];

export default function BrandsStrip({ variant = 'light' }) {
  const dark = variant === 'dark';
  return (
    <div className={dark ? 'bg-navy-900' : 'bg-white border-y border-line'}>
      <div className="max-w-[1220px] mx-auto px-5 py-7">
        <p className={`text-center text-[11px] font-bold uppercase tracking-[2px] mb-5 ${dark ? 'text-[#a9b6d0]' : 'text-muted'}`}>
          Marcas aliadas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {textBrands.map((b) => (
            <span key={b.name} className={`text-xl md:text-2xl font-black tracking-tight leading-none ${b.className}`}>
              {b.name}
            </span>
          ))}
          {logos.map((file) => (
            <img
              key={file}
              src={`/marcas/${file}`}
              alt={file.replace(/\.jpg$/i, '').replace(/_/g, ' ')}
              loading="lazy"
              className="max-h-8 md:max-h-10 max-w-[100px] md:max-w-[120px] w-auto object-contain hover:scale-110 transition"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
