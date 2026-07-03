import { Link } from 'react-router-dom';
import { auth } from '../lib/api.js';

export default function Header({ right }) {
  return (
    <div className="sticky top-0 z-50">
      {/* Barra superior de contacto */}
      <div className="bg-navy-900 text-[#c6d0e4] text-[12.5px]">
        <div className="max-w-[1220px] mx-auto px-5 h-9 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="hidden sm:flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              Av. Guillermo Dansey 1912, Lima
            </span>
            <a href="https://www.rodasur.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" /></svg>
              www.rodasur.com
            </a>
          </div>
          <span className="flex items-center gap-1.5 text-[#8ea3c7]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14M5 8a2 2 0 0 1-2-2c0-1 1-3 4-3s4 4 5 4 2-4 5-4 4 2 4 3a2 2 0 0 1-2 2M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /></svg>
            <span className="hidden sm:inline">Campaña por el mes patrio · hasta el 30 de julio</span>
            <span className="sm:hidden">Ofertas de julio</span>
          </span>
        </div>
      </div>

      {/* Cabecera principal */}
      <header className="bg-white border-b-[3px] border-navy shadow-sm">
        <div className="max-w-[1220px] mx-auto px-5 h-[76px] flex items-center justify-between gap-5">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="RODASUR - Su Aliado Industrial" className="h-[52px] w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {right || (
              <>
                <button onClick={() => window.dispatchEvent(new CustomEvent('rodasur:open-chat'))} className="hidden md:inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Contáctanos
                </button>
                {auth.isLogged() && (
                  <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition">
                    Panel Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
