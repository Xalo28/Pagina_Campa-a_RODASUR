// Banda de llamado a la acción (cotiza ahora).
export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-brandred-dark to-brandred text-white">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative max-w-[1220px] mx-auto px-5 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <h2 className="text-2xl md:text-[28px] font-black leading-tight">¿Necesitas asesoría o una cotización?</h2>
          <p className="text-white/85 mt-1.5 max-w-xl">Cotiza ahora con tu ejecutivo de ventas. Envíos a todo el Perú y capacitación incluida en cada compra.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <a href="https://www.rodasur.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg bg-white text-brandred hover:bg-white/90 transition">
            Visitar rodasur.com
          </a>
        </div>
      </div>
    </section>
  );
}
