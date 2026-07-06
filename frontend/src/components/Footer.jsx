export default function Footer({ compact = false }) {
  return (
    <footer className="bg-navy text-[#c6d0e4] mt-10 py-9 border-t-4 border-brandred">
      <div className="max-w-[1220px] mx-auto px-5 flex flex-wrap gap-8 justify-between">
        <div className="max-w-md">
          <div className="inline-block bg-white rounded-xl px-3 py-2">
            <img src="/logo.png" alt="RODASUR" className="h-12 w-auto" />
          </div>
          <p className="mt-3 text-sm text-[#a9b6d0]">
            Su Aliado Industrial. Soluciones para el mantenimiento y montaje de rodamientos.
          </p>
          {!compact && (
            <div className="flex gap-4 flex-wrap mt-3 text-[12.5px]">
              <span>✔ Productos Originales</span>
              <span>✔ Garantía de Calidad</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-2">Contacto</h4>
          <p className="text-[13.5px] text-[#a9b6d0]">Av. Guillermo Dansey Nro. 1912</p>
          <p className="text-[13.5px] text-[#a9b6d0]">Cercado de Lima, Perú</p>
          <p className="text-[13.5px]">
            <a href="https://www.rodasur.com" target="_blank" rel="noopener noreferrer" className="text-brandblue-light hover:underline">
              www.rodasur.com
            </a>
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-2">Marcas oficiales</h4>
          <p className="text-[13.5px] text-[#a9b6d0]">Schaeffler · LUK · INA · FAG · BETEX</p>
          <h4 className="text-white text-sm font-semibold mb-2 mt-3">Cotiza ahora</h4>
          <p className="text-[13.5px] text-[#a9b6d0]">Con tu ejecutivo de ventas · Capacitación incluida</p>
        </div>
      </div>
    </footer>
  );
}
