import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, auth, money } from '../lib/api.js';
import StatsPanel from '../components/StatsPanel.jsx';
import QuotesPanel from '../components/QuotesPanel.jsx';
import SubscribersPanel from '../components/SubscribersPanel.jsx';
import PacksPanel from '../components/PacksPanel.jsx';
import NotificationsBell from '../components/NotificationsBell.jsx';

const INPUT = 'w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue';
const LABEL = 'block text-[13px] font-bold text-navy mb-1.5';
const BTN_RED = 'inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition disabled:opacity-50';
const BTN_GHOST = 'inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition';

/* ============ Login ============ */
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      auth.save(data.token, data.username);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-5 bg-gradient-to-br from-navy to-navy-900">
      <form onSubmit={submit} className="bg-white rounded-[18px] shadow-cardlg w-full max-w-[400px] p-8 text-center">
        <img src="/logo.png" alt="RODASUR - Su Aliado Industrial" className="h-[76px] w-auto mx-auto" />
        <h2 className="text-navy text-xl font-bold mt-3.5 mb-1">Panel de Administración</h2>
        <p className="text-muted text-[13.5px] mb-5">Ingresa para gestionar los productos en descuento</p>
        {error && <div className="px-3.5 py-2.5 rounded-lg text-[13.5px] mb-4 text-left bg-[#fdeaec] text-brandred-dark border border-[#f5c2c8]">{error}</div>}
        <div className="text-left mb-4">
          <label className={LABEL}>Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className={INPUT} />
        </div>
        <div className="text-left mb-4">
          <label className={LABEL}>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={INPUT} />
        </div>
        <button type="submit" className={BTN_RED + ' w-full'}>Ingresar</button>
        <p className="text-xs mt-4"><Link to="/" className="text-brandblue hover:underline">← Volver a la tienda</Link></p>
      </form>
    </div>
  );
}

/* ============ Modal de producto ============ */
const EMPTY = {
  code: '', name: '', brand: '', category: '', description: '',
  price_regular: 0, price_discount: 0, stock: 0, valid_until: '',
  on_discount: true, active: true,
};

function ProductModal({ editing, onClose, onSaved, notify }) {
  const [form, setForm] = useState(EMPTY);
  const [features, setFeatures] = useState(['']);
  const [specs, setSpecs] = useState([{ param: '', value: '', description: '' }]);
  const [gallery, setGallery] = useState([]); // [{ url?, file?, preview }]
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      api('/api/products/' + editing.id).then((p) => {
        setForm({
          code: p.code || '', name: p.name || '', brand: p.brand || '', category: p.category || '',
          description: p.description || '', price_regular: p.price_regular || 0, price_discount: p.price_discount || 0,
          stock: p.stock || 0, valid_until: p.valid_until || '', on_discount: !!p.on_discount, active: !!p.active,
        });
        setFeatures(p.features?.length ? p.features : ['']);
        setSpecs(p.specs?.length ? p.specs : [{ param: '', value: '', description: '' }]);
        const imgs = p.images?.length ? p.images : (p.image ? [p.image] : []);
        setGallery(imgs.map((url) => ({ url, preview: url })));
      });
    }
  }, [editing]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  function addFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) setGallery((g) => [...g, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }
  function removeImage(i) { setGallery((g) => g.filter((_, j) => j !== i)); }
  function makeCover(i) { setGallery((g) => (i === 0 ? g : [g[i], ...g.filter((_, j) => j !== i)])); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const cleanFeatures = features.map((s) => s.trim()).filter(Boolean);
    const cleanSpecs = specs
      .map((s) => ({ param: s.param.trim(), value: s.value.trim(), description: (s.description || '').trim() }))
      .filter((s) => s.param || s.value);

    const fd = new FormData();
    fd.append('code', form.code.trim());
    fd.append('name', form.name.trim());
    fd.append('brand', form.brand.trim());
    fd.append('category', form.category.trim());
    fd.append('description', form.description.trim());
    fd.append('price_regular', form.price_regular || 0);
    fd.append('price_discount', form.price_discount || 0);
    fd.append('stock', form.stock || 0);
    fd.append('valid_until', form.valid_until || '');
    fd.append('features', JSON.stringify(cleanFeatures));
    fd.append('specs', JSON.stringify(cleanSpecs));
    fd.append('on_discount', form.on_discount ? '1' : '0');
    fd.append('active', form.active ? '1' : '0');
    // Galería en orden: URLs existentes tal cual, archivos nuevos como tokens "new:N".
    let n = 0;
    const tokens = gallery.map((g) => {
      if (g.file) { fd.append('newImages', g.file); return 'new:' + (n++); }
      return g.url;
    }).filter(Boolean);
    fd.append('gallery', JSON.stringify(tokens));

    setSaving(true);
    try {
      if (editing) {
        await api('/api/products/' + editing.id, { method: 'PUT', body: fd });
        notify('Producto actualizado correctamente.');
      } else {
        await api('/api/products', { method: 'POST', body: fd });
        notify('Producto creado correctamente.');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-[760px] shadow-cardlg animate-pop my-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-navy text-lg font-bold">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button type="button" onClick={onClose} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
        </div>
        <div className="px-6 py-5">
          {error && <div className="px-3.5 py-2.5 rounded-lg text-[13.5px] mb-4 bg-[#fdeaec] text-brandred-dark border border-[#f5c2c8]">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div><label className={LABEL}>Código *</label><input value={form.code} onChange={set('code')} required className={INPUT} /></div>
            <div><label className={LABEL}>Nombre *</label><input value={form.name} onChange={set('name')} required className={INPUT} /></div>
            <div>
              <label className={LABEL}>Marca</label>
              <input value={form.brand} onChange={set('brand')} list="brandList" placeholder="Schaeffler, BETEX…" className={INPUT} />
              <datalist id="brandList"><option>SCHAEFFLER</option><option>BETEX</option><option>LUK</option><option>INA</option><option>FAG</option></datalist>
            </div>
            <div>
              <label className={LABEL}>Categoría</label>
              <input value={form.category} onChange={set('category')} list="catList" placeholder="Extractores, Calentadores…" className={INPUT} />
              <datalist id="catList"><option>Extractores</option><option>Herramientas de Montaje</option><option>Calentadores por Inducción</option><option>Accesorios de Inducción</option><option>Instrumentos de Medición</option></datalist>
            </div>
            <div><label className={LABEL}>Precio regular (sin IGV)</label><input type="number" step="0.01" min="0" value={form.price_regular} onChange={set('price_regular')} className={INPUT} /></div>
            <div><label className={LABEL}>Precio con descuento (sin IGV)</label><input type="number" step="0.01" min="0" value={form.price_discount} onChange={set('price_discount')} className={INPUT} /></div>
            <div><label className={LABEL}>Stock</label><input type="number" min="0" value={form.stock} onChange={set('stock')} className={INPUT} /></div>
            <div><label className={LABEL}>Válido hasta</label><input type="date" value={form.valid_until} onChange={set('valid_until')} className={INPUT} /></div>
            <div className="sm:col-span-2"><label className={LABEL}>Descripción</label><textarea value={form.description} onChange={set('description')} className={INPUT + ' min-h-[78px] resize-y'} /></div>

            {/* Características */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Características</label>
              {features.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={f} onChange={(e) => setFeatures((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Ej: Diseño robusto de alta calidad" className={INPUT} />
                  <button type="button" onClick={() => setFeatures((arr) => arr.filter((_, j) => j !== i))} className="shrink-0 bg-[#fdeaec] text-brandred w-9 h-10 rounded-lg text-lg">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setFeatures((arr) => [...arr, ''])} className="bg-transparent border border-dashed border-brandblue text-brandblue rounded-lg px-3 py-2 font-bold text-[13px]">＋ Agregar característica</button>
            </div>

            {/* Especificaciones */}
            <div className="sm:col-span-2">
              <label className={LABEL}>Especificaciones técnicas</label>
              {specs.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={s.param} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, param: e.target.value } : x)))} placeholder="Parámetro" className={INPUT} />
                  <input value={s.value} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Valor" className={INPUT} />
                  <input value={s.description} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} placeholder="Descripción" className={INPUT} />
                  <button type="button" onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))} className="shrink-0 bg-[#fdeaec] text-brandred w-9 h-10 rounded-lg text-lg">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setSpecs((arr) => [...arr, { param: '', value: '', description: '' }])} className="bg-transparent border border-dashed border-brandblue text-brandblue rounded-lg px-3 py-2 font-bold text-[13px]">＋ Agregar especificación</button>
              <p className="text-xs text-muted mt-1">Parámetro · Valor · Descripción (ej: "Peso" · "10 kg" · "Peso aproximado")</p>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL}>Imágenes del producto</label>
              <div className="flex flex-wrap gap-2.5 mb-2">
                {gallery.map((g, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-line group bg-white">
                    <img src={g.preview} className="w-full h-full object-cover" alt="" />
                    {i === 0 && <span className="absolute top-1 left-1 bg-brandblue text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Portada</span>}
                    <button type="button" onClick={() => removeImage(i)} title="Quitar" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm grid place-items-center opacity-0 group-hover:opacity-100 transition">×</button>
                    {i !== 0 && <button type="button" onClick={() => makeCover(i)} title="Usar como portada" className="absolute bottom-1 inset-x-1 bg-white/90 text-navy text-[10px] font-bold rounded py-0.5 opacity-0 group-hover:opacity-100 transition">Hacer portada</button>}
                  </div>
                ))}
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-brandblue/50 text-brandblue grid place-items-center cursor-pointer hover:bg-brandblue/5 transition text-center text-[11px] font-bold leading-tight">
                  ＋<br />Agregar
                  <input type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-muted">Sube varias fotos. La primera es la portada (usa "Hacer portada" para cambiarla). Máx. 8 MB c/u.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Opciones</label>
              <label className="flex gap-2 items-center text-[13.5px] font-semibold text-ink mt-1.5"><input type="checkbox" checked={form.on_discount} onChange={set('on_discount')} className="w-auto" /> Mostrar en el catálogo de ofertas</label>
              <label className="flex gap-2 items-center text-[13.5px] font-semibold text-ink mt-1.5"><input type="checkbox" checked={form.active} onChange={set('active')} className="w-auto" /> Producto activo (visible)</label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
          <button type="submit" disabled={saving} className={BTN_RED}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
        </div>
      </form>
    </div>
  );
}

/* ============ Cambiar contraseña ============ */
function ChangePasswordModal({ onClose, notify }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('La confirmación no coincide.');
    setSaving(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next }),
      });
      notify('Contraseña actualizada correctamente.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[110] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-[420px] shadow-cardlg animate-pop my-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-navy text-lg font-bold">Cambiar contraseña</h3>
          <button type="button" onClick={onClose} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
        </div>
        <div className="px-6 py-5 space-y-3.5">
          {error && <div className="px-3.5 py-2.5 rounded-lg text-[13.5px] bg-[#fdeaec] text-brandred-dark border border-[#f5c2c8]">{error}</div>}
          <div><label className={LABEL}>Contraseña actual</label><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={INPUT} /></div>
          <div><label className={LABEL}>Nueva contraseña</label><input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} className={INPUT} /></div>
          <div><label className={LABEL}>Repite la nueva contraseña</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={INPUT} /></div>
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
          <button type="submit" disabled={saving} className={BTN_RED}>{saving ? 'Guardando…' : 'Actualizar'}</button>
        </div>
      </form>
    </div>
  );
}

/* ============ Panel ============ */
function Panel({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // null | {} (nuevo) | {id} (editar)
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('productos'); // productos | estadisticas | cotizaciones | suscriptores
  const [pwdOpen, setPwdOpen] = useState(false);

  function notify(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }

  function load() {
    api('/api/products?all=1').then(setProducts).catch((e) => notify(e.message, 'err'));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.code} ${p.brand} ${p.category}`.toLowerCase().includes(q));
  }, [products, query]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.active).length,
    disc: products.filter((p) => p.on_discount).length,
    brands: new Set(products.map((p) => p.brand).filter(Boolean)).size,
  }), [products]);

  async function remove(p) {
    if (!confirm(`¿Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api('/api/products/' + p.id, { method: 'DELETE' });
      notify('Producto eliminado.');
      load();
    } catch (e) { notify(e.message, 'err'); }
  }

  const iconBtn = 'w-[34px] h-[34px] rounded-lg grid place-items-center bg-page text-navy transition';
  const th = 'py-3 px-3.5 text-[12.5px] uppercase tracking-wide font-semibold';
  const td = 'py-2.5 px-3.5 border-b border-line align-middle';

  return (
    <div>
      <header className="bg-navy text-white shadow-sm">
        <div className="max-w-[1220px] mx-auto px-5 h-[66px] flex items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RODASUR" className="h-[42px] w-auto bg-white rounded-lg px-2 py-1" />
            <span className="text-[#a9b6d0] text-[9.5px] font-bold uppercase tracking-[3px] hidden sm:block">Panel Admin</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-[13.5px] text-[#c6d0e4] hidden md:inline">👤 {auth.user()}</span>
            <NotificationsBell onOpenTab={setTab} />
            <button onClick={() => setPwdOpen(true)} title="Cambiar contraseña" aria-label="Cambiar contraseña" className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 hover:bg-white/20 text-white transition">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </button>
            <a href="/" target="_blank" rel="noreferrer" className="text-sm font-bold px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition hidden sm:inline-block">Ver tienda ↗</a>
            <button onClick={onLogout} className="text-sm font-bold px-3 py-2 rounded-lg bg-brandred hover:bg-brandred-dark text-white transition">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1220px] mx-auto px-5 py-7 pb-16">
        {/* Pestañas */}
        <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
          {[
            ['productos', 'Productos'],
            ['packs', 'Packs'],
            ['estadisticas', 'Estadísticas'],
            ['cotizaciones', 'Cotizaciones'],
            ['suscriptores', 'Suscriptores'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition ${tab === key ? 'border-brandred text-brandred' : 'border-transparent text-muted hover:text-navy'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'productos' && (
          <>
        <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {[
            { n: stats.total, l: 'Productos totales', c: 'border-brandblue' },
            { n: stats.active, l: 'Activos / visibles', c: 'border-okgreen' },
            { n: stats.disc, l: 'En descuento', c: 'border-brandred' },
            { n: stats.brands, l: 'Marcas', c: 'border-brandblue' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-card p-4 border-l-4 ${s.c}`}>
              <div className="text-2xl font-black text-navy">{s.n}</div>
              <div className="text-[12.5px] text-muted uppercase tracking-wide">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3.5 mb-5 flex-wrap">
          <h1 className="text-[22px] font-extrabold text-navy">Gestión de productos</h1>
          <div className="flex gap-2.5 flex-wrap">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..." className="px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue" />
            <button onClick={() => setModal({})} className={BTN_RED}>＋ Nuevo producto</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-navy text-white text-left">
                <th className={th}>Imagen</th><th className={th}>Producto</th>
                <th className={th + ' hidden md:table-cell'}>Marca</th>
                <th className={th + ' hidden md:table-cell'}>Categoría</th>
                <th className={th}>Precio desc.</th>
                <th className={th + ' hidden md:table-cell'}>Estado</th>
                <th className={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted">Sin productos. Crea el primero con “＋ Nuevo producto”.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className={td}>{p.image ? <img className="w-[52px] h-[42px] rounded-md object-cover bg-page" src={p.image} alt="" /> : <div className="w-[52px] h-[42px] rounded-md bg-page" />}</td>
                    <td className={td}><div className="font-bold text-navy">{p.name}</div><div className="text-xs text-muted">{p.code}</div></td>
                    <td className={td + ' hidden md:table-cell'}>{p.brand || '—'}</td>
                    <td className={td + ' hidden md:table-cell'}>{p.category || '—'}</td>
                    <td className={td}><strong className="text-brandred">{money(p.price_discount || p.price_regular)}</strong>{p.discount_pct > 0 && <div className="text-xs text-muted">-{p.discount_pct}%</div>}</td>
                    <td className={td + ' hidden md:table-cell'}><span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-[#e7f6ee] text-[#1b7a43]' : 'bg-[#fdeaec] text-brandred-dark'}`}>{p.active ? 'Activo' : 'Oculto'}</span></td>
                    <td className={td}>
                      <div className="flex gap-1.5">
                        <button title="Editar" onClick={() => setModal({ id: p.id })} className={iconBtn + ' hover:bg-navy hover:text-white'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button title="Eliminar" onClick={() => remove(p)} className={iconBtn + ' hover:bg-brandred hover:text-white'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        )}

        {tab === 'packs' && <PacksPanel notify={notify} />}
        {tab === 'estadisticas' && <StatsPanel />}
        {tab === 'cotizaciones' && <QuotesPanel notify={notify} />}
        {tab === 'suscriptores' && <SubscribersPanel notify={notify} />}
      </main>

      {modal && (
        <ProductModal
          editing={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          notify={notify}
        />
      )}

      {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} notify={notify} />}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3.5 rounded-lg shadow-cardlg text-sm font-semibold text-white ${toast.type === 'err' ? 'bg-brandred-dark' : 'bg-okgreen'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ============ Root ============ */
export default function Admin() {
  const [logged, setLogged] = useState(auth.isLogged());
  useEffect(() => { document.title = 'RODASUR · Panel de Administración'; }, []);

  if (!logged) return <Login onLogin={() => setLogged(true)} />;
  return <Panel onLogout={() => { auth.clear(); setLogged(false); }} />;
}
