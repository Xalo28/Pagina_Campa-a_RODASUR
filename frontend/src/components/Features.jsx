// Sección de propuesta de valor ("por qué elegirnos"), típica en distribuidores industriales.
const items = [
  {
    title: 'Productos originales',
    text: 'Repuestos y herramientas 100% genuinos de marcas líderes mundiales.',
    icon: (<><path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>),
  },
  {
    title: 'Garantía de calidad',
    text: 'Respaldo técnico y garantía en cada equipo que entregamos.',
    icon: (<><circle cx="12" cy="8" r="6" /><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" /></>),
  },
  {
    title: 'Envíos a todo el Perú',
    text: 'Despachamos a Lima y provincias de forma rápida y segura.',
    icon: (<><path d="M1 3h13v13H1zM14 8h5l3 3v5h-8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>),
  },
  {
    title: 'Capacitación incluida',
    text: 'Te enseñamos a usar tu equipo con una capacitación virtual gratuita.',
    icon: (<><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" /></>),
  },
];

export default function Features() {
  return (
    <section className="max-w-[1220px] mx-auto px-5 py-14">
      <div className="text-center mb-10">
        <span className="text-brandred font-bold text-sm uppercase tracking-[2px]">Tu aliado industrial</span>
        <h2 className="text-2xl md:text-[30px] font-black text-navy mt-1">¿Por qué elegir RODASUR?</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((it) => (
          <div key={it.title} className="bg-white rounded-2xl shadow-card border border-line p-6 text-center hover:-translate-y-1 hover:shadow-cardlg transition">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brandblue to-navy grid place-items-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{it.icon}</svg>
            </div>
            <h3 className="text-navy font-bold text-[17px] mb-1.5">{it.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
