import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const STATUS = {
  nuevo: { label: 'Nuevo', cls: 'bg-[#fff4e5] text-[#8a5300]' },
  contactado: { label: 'Contactado', cls: 'bg-[#eaf1ff] text-brandblue' },
  venta_concretada: { label: 'Venta concretada', cls: 'bg-[#e7f6ee] text-[#1b7a43]' },
  venta_perdida: { label: 'Venta perdida', cls: 'bg-[#fdeaec] text-brandred-dark' },
};

export default function QuotesPanel({ notify }) {
  const [quotes, setQuotes] = useState(null);
  const [lostModal, setLostModal] = useState(null); // { id, reason }

  function load() {
    api('/api/quotes').then(setQuotes).catch((e) => notify(e.message, 'err'));
  }
  useEffect(load, []);

  async function applyStatus(id, status, lost_reason = null) {
    try {
      await api('/api/quotes/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lost_reason }),
      });
      setQuotes((qs) => qs.map((q) => (q.id === id ? { ...q, status, lost_reason: status === 'venta_perdida' ? lost_reason : null } : q)));
    } catch (e) { notify(e.message, 'err'); }
  }

  function onStatusChange(q, status) {
    if (status === 'venta_perdida') setLostModal({ id: q.id, reason: q.lost_reason || '' });
    else applyStatus(q.id, status, null);
  }

  function saveLostReason(e) {
    e.preventDefault();
    applyStatus(lostModal.id, 'venta_perdida', lostModal.reason.trim());
    setLostModal(null);
  }

  async function remove(q) {
    if (!confirm(`¿Eliminar la solicitud de "${q.name}"?`)) return;
    try {
      await api('/api/quotes/' + q.id, { method: 'DELETE' });
      notify('Solicitud eliminada.');
      load();
    } catch (e) { notify(e.message, 'err'); }
  }

  function exportCSV() {
    if (!quotes?.length) return;
    const headers = ['Fecha', 'Nombre', 'Empresa', 'Teléfono', 'Correo', 'Producto', 'Código', 'Mensaje', 'Estado', 'Razón (venta perdida)'];
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = quotes.map((q) => [
      new Date(q.created_at + 'Z').toLocaleString('es-PE'),
      q.name, q.company, q.phone, q.email, q.product_name, q.product_code, q.message,
      STATUS[q.status]?.label || q.status, q.lost_reason,
    ].map(esc).join(';'));
    const csv = '﻿' + [headers.map(esc).join(';'), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizaciones-rodasur-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const th = 'py-3 px-3.5 text-[12.5px] uppercase tracking-wide font-semibold';
  const td = 'py-2.5 px-3.5 border-b border-line align-top';

  if (!quotes) return <div className="bg-white rounded-2xl shadow-card p-6 text-muted">Cargando cotizaciones…</div>;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-sm text-muted">{quotes.length} solicitud{quotes.length !== 1 ? 'es' : ''} de cotización</p>
        <button onClick={exportCSV} disabled={!quotes.length} className="inline-flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-lg bg-okgreen text-white hover:brightness-95 transition disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Exportar a Excel (CSV)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-navy text-white text-left">
              <th className={th}>Fecha</th>
              <th className={th}>Contacto</th>
              <th className={th + ' hidden md:table-cell'}>Producto</th>
              <th className={th + ' hidden lg:table-cell'}>Mensaje</th>
              <th className={th}>Estado</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted">Aún no hay solicitudes de cotización.</td></tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className={td + ' whitespace-nowrap text-muted text-xs'}>{new Date(q.created_at + 'Z').toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className={td}>
                    <div className="font-bold text-navy">{q.name}</div>
                    {q.company && <div className="text-xs text-muted">{q.company}</div>}
                    {q.phone && <div className="text-xs"><a href={`tel:${q.phone}`} className="text-brandblue hover:underline">{q.phone}</a></div>}
                    {q.email && <div className="text-xs"><a href={`mailto:${q.email}`} className="text-brandblue hover:underline">{q.email}</a></div>}
                  </td>
                  <td className={td + ' hidden md:table-cell'}>
                    <div className="text-navy">{q.product_name || '—'}</div>
                    {q.product_code && <div className="text-xs text-muted">{q.product_code}</div>}
                  </td>
                  <td className={td + ' hidden lg:table-cell max-w-[220px] text-muted text-[13px]'}>{q.message || '—'}</td>
                  <td className={td}>
                    <select
                      value={q.status}
                      onChange={(e) => onStatusChange(q, e.target.value)}
                      className={`text-[11.5px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS[q.status]?.cls || 'bg-page text-navy'}`}
                    >
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {q.status === 'venta_perdida' && (
                      <div className="mt-1.5 text-[11.5px] text-brandred-dark max-w-[190px]">
                        <span className="font-bold">Motivo:</span> {q.lost_reason || '—'}{' '}
                        <button onClick={() => setLostModal({ id: q.id, reason: q.lost_reason || '' })} className="text-brandblue hover:underline font-semibold">editar</button>
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    <button title="Eliminar" onClick={() => remove(q)} className="w-[34px] h-[34px] rounded-lg grid place-items-center bg-page text-navy hover:bg-brandred hover:text-white transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: razón de venta perdida */}
      {lostModal && (
        <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[110] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setLostModal(null)}>
          <form onSubmit={saveLostReason} className="bg-white rounded-2xl w-full max-w-[440px] shadow-cardlg animate-pop my-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h3 className="text-navy text-lg font-bold">¿Por qué se perdió la venta?</h3>
              <button type="button" onClick={() => setLostModal(null)} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-[13px] font-bold text-navy mb-1.5">Motivo</label>
              <textarea
                value={lostModal.reason}
                onChange={(e) => setLostModal((m) => ({ ...m, reason: e.target.value }))}
                autoFocus
                className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm min-h-[110px] resize-y focus:outline-none focus:border-brandblue"
                placeholder="Ej: precio, tiempo de entrega, eligió a la competencia, sin presupuesto…"
              />
            </div>
            <div className="px-6 py-4 border-t border-line flex justify-end gap-2.5">
              <button type="button" onClick={() => setLostModal(null)} className="font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue transition">Cancelar</button>
              <button type="submit" className="font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition">Guardar como venta perdida</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
