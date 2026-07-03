import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Catalog from './pages/Catalog.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PackDetail from './pages/PackDetail.jsx';
import Admin from './pages/Admin.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import { trackPageView } from './lib/track.js';

// Registra una visita en cada cambio de ruta (excepto el panel admin).
function usePageTracking() {
  const location = useLocation();
  const last = useRef(null);
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return;      // no contamos visitas del propio admin
    if (last.current === path) return;           // evita duplicados (StrictMode / navegación repetida)
    last.current = path;
    const m = path.match(/^\/product\/(\d+)/);
    trackPageView(path, m ? Number(m[1]) : null);
  }, [location.pathname]);
}

export default function App() {
  usePageTracking();
  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/pack/:id" element={<PackDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Catalog />} />
      </Routes>
      <ChatWidget />
    </>
  );
}
