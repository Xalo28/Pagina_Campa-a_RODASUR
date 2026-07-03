import { useEffect, useMemo, useState } from 'react';
import { api, money } from '../lib/api.js';

const BTN_RED = 'inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition disabled:opacity-50';
const BTN_GHOST = 'font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition';

function PackModal({ editing, onClose, onSaved, notify }) {
  const [allProducts, setAllProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price_pack: 0, active: true });
  const [ids, setIds] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api('/api/products?all=1').then(setAllProducts).catch(() => {}); }, []);
  useEffect(() => {
    if (editing) {
      api('/api/packs/' + editing.id).then((p) => {
        setForm({ name: p.name || '', description: p.description || '', price_pack: p.price_pack || 0, active: !!p.active });
        setIds(p.product_ids || []);
      });
    }
  }, [editing]);

  const selected = allProducts.filter((p) => ids.includes(p.id));
  const sumIndividual = selected.reduce((s, p) => s + (p.price_discount || p.price_regular || 0), 0);
  const savings = Math.max(0, sumIndividual - (parseFloat(form.price_pack) || 0));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((p) => !q || `${p.name} ${p.code} ${p.brand}`.toLowerCase().includes(q));
  }, [allProducts, query]);

  function toggle(id) { setIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id])); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (ids.length < 2) return setError('Selecciona al menos 2 productos para el pack.');
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, active: form.active ? '1' : '0', product_ids: JSON.stringify(ids) });
      const opts = { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body };
      await api(editing ? '/api/packs/' + editing.id : '/api/packs', opts);
      notify(editing ? 'Pack actualizado.' : 'Pack creado.');
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  const INPUT = 'w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue';
  const LABEL = 'block text-[13px] font-bold text-navy mb-1.5';

  return (
    <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-[680px] shadow-cardlg animate-pop my-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-navy text-lg font-bold">{editing ? 'Editar pack' : 'Nuevo pack'}</h3>
          <button type="button" onClick={onClose} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
        </div>
        <div className="px-6 py-5">
          {error && <div className="px-3.5 py-2.5 rounded-lg text-[13.5px] mb-4 bg-[#fdeaec] text-brandred-dark border border-[#f5c2c8]">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-3.5 mb-4">
            <div className="sm:col-span-2"><label className={LABEL}>Nombre del pack *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={INPUT} placeholder="Ej: Pack Mantenimiento de Rodamientos" /></div>
            <div className="sm:col-span-2"><label className={LABEL}>Descripción</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={INPUT + ' min-h-[60px] resize-y'} /></div>
            <div><label className={LABEL}>Precio del pack (sin IGV) *</label><input type="number" step="0.01" min="0" value={form.price_pack} onChange={(e) => setForm((f) => ({ ...f, price_pack: e.target.value }))} required className={INPUT} /></div>
            <div className="flex items-end"><label className="flex gap-2 items-center text-[13.5px] font-semibold text-ink"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-auto" /> Pack activo (visible)</label></div>
          </div>

          <label className={LABEL}>Productos del pack ({ids.length} seleccionados) *</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto…" className={INPUT + ' mb-2'} />
          <div className="max-h-[220px] overflow-y-auto border border-line rounded-lg divide-y divide-line">
            {filtered.map((p) => (
              <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 ${ids.includes(p.id) ? 'bg-brandblue/5' : ''}`}>
                <input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} className="w-auto" />
                {p.image ? <img src={p.image} className="w-9 h-9 rounded object-cover bg-page" alt="" /> : <div className="w-9 h-9 rounded bg-page" />}
                <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-semibold text-navy truncate">{p.name}</span><span className="block text-[11.5px] text-muted">{p.code}</span></span>
                <span className="text-[13px] font-bold text-brandred whitespace-nowrap">{money(p.price_discount || p.price_regular)}</span>
              </label>
            ))}
            {filtered.length === 0 && <div className="px-3 py-4 text-center text-muted text-sm">Sin resultados.</div>}
          </div>

          <div className="mt-3 bg-page rounded-lg p-3 text-sm flex flex-wrap gap-x-6 gap-y-1 justify-between">
            <span className="text-muted">Suma por separado: <strong className="text-ink line-through">{money(sumIndividual)}</strong></span>
            <span className="text-muted">Precio pack: <strong className="text-brandred">{money(parseFloat(form.price_pack) || 0)}</strong></span>
            <span className="text-okgreen font-bold">Ahorro: {money(savings)}{sumIndividual > 0 ? ` (-${Math.round((savings / sumIndividual) * 100)}%)` : ''}</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancelar</button>
          <button type="submit" disabled={saving} className={BTN_RED}>{saving ? 'Guardando…' : 'Guardar pack'}</button>
        </div>
      </form>
    </div>
  );
}

export default function PacksPanel({ notify }) {
  const [packs, setPacks] = useState(null);
  const [modal, setModal] = useState(null); // null | {} | { id }

  function load() { api('/api/packs?all=1').then(setPacks).catch((e) => notify(e.message, 'err')); }
  useEffect(load, []);

  async function remove(p) {
    if (!confirm(`¿Eliminar el pack "${p.name}"?`)) return;
    try { await api('/api/packs/' + p.id, { method: 'DELETE' }); notify('Pack eliminado.'); load(); }
    catch (e) { notify(e.message, 'err'); }
  }

  const th = 'py-3 px-3.5 text-[12.5px] uppercase tracking-wide font-semibold';
  const td = 'py-2.5 px-3.5 border-b border-line align-middle';

  if (!packs) return <div className="bg-white rounded-2xl shadow-card p-6 text-muted">Cargando packs…</div>;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-sm text-muted">{packs.length} pack{packs.length !== 1 ? 's' : ''} en descuento</p>
        <button onClick={() => setModal({})} className={BTN_RED}>＋ Nuevo pack</button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-navy text-white text-left">
              <th className={th}>Fotos</th><th className={th}>Pack</th>
              <th className={th + ' hidden md:table-cell'}>Productos</th>
              <th className={th}>Precio</th>
              <th className={th + ' hidden md:table-cell'}>Estado</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {packs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted">Aún no hay packs. Crea el primero con “＋ Nuevo pack”.</td></tr>
            ) : (
              packs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={td}>
                    <div className="flex -space-x-3">
                      {p.products.slice(0, 3).map((pr, i) => (
                        pr.image
                          ? <img key={i} src={pr.image} className="w-9 h-9 rounded-full object-cover border-2 border-white bg-page" alt="" />
                          : <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-page" />
                      ))}
                    </div>
                  </td>
                  <td className={td}><div className="font-bold text-navy">{p.name}</div><div className="text-xs text-muted">{p.products.length} productos</div></td>
                  <td className={td + ' hidden md:table-cell text-[13px] text-muted max-w-[240px]'}>{p.products.map((x) => x.name).join(', ')}</td>
                  <td className={td}><strong className="text-brandred">{money(p.price_pack)}</strong>{p.discount_pct > 0 && <div className="text-xs text-okgreen font-bold">-{p.discount_pct}%</div>}</td>
                  <td className={td + ' hidden md:table-cell'}><span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-[#e7f6ee] text-[#1b7a43]' : 'bg-[#fdeaec] text-brandred-dark'}`}>{p.active ? 'Activo' : 'Oculto'}</span></td>
                  <td className={td}>
                    <div className="flex gap-1.5">
                      <button title="Editar" onClick={() => setModal({ id: p.id })} className="w-[34px] h-[34px] rounded-lg grid place-items-center bg-page text-navy hover:bg-navy hover:text-white transition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      <button title="Eliminar" onClick={() => remove(p)} className="w-[34px] h-[34px] rounded-lg grid place-items-center bg-page text-navy hover:bg-brandred hover:text-white transition">
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

      {modal && <PackModal editing={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} notify={notify} />}
    </>
  );
}
