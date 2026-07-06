import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function SubscribersPanel({ notify }) {
  const [subs, setSubs] = useState(null);
  const [mailEnabled, setMailEnabled] = useState(false);
  const [campaign, setCampaign] = useState(null); // null | { subject, message }
  const [sending, setSending] = useState(false);

  function load() {
    api('/api/subscribers').then(setSubs).catch((e) => notify?.(e.message, 'err'));
  }
  useEffect(load, []);
  useEffect(() => { api('/api/subscribers/mail-status').then((r) => setMailEnabled(r.enabled)).catch(() => {}); }, []);

  async function sendCampaign(e) {
    e.preventDefault();
    setSending(true);
    try {
      const r = await api('/api/subscribers/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      notify?.(`Campaña enviada: ${r.sent} de ${r.total} correos.`);
      setCampaign(null);
    } catch (err) {
      notify?.(err.message, 'err');
    } finally {
      setSending(false);
    }
  }

  async function remove(s) {
    if (!confirm(`¿Eliminar al suscriptor ${s.email}?`)) return;
    try {
      await api('/api/subscribers/' + s.id, { method: 'DELETE' });
      notify?.('Suscriptor eliminado.');
      load();
    } catch (e) { notify?.(e.message, 'err'); }
  }

  function exportCSV() {
    if (!subs?.length) return;
    const headers = ['Fecha', 'Nombre', 'Empresa', 'Cargo', 'Correo', 'Teléfono'];
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = subs.map((s) => [new Date(s.created_at + 'Z').toLocaleString('es-PE'), s.name, s.company, s.position, s.email, s.phone].map(esc).join(';'));
    const csv = '﻿' + [headers.map(esc).join(';'), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suscriptores-rodasur-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const th = 'py-3 px-3.5 text-[12.5px] uppercase tracking-wide font-semibold';
  const td = 'py-2.5 px-3.5 border-b border-line align-middle';

  if (!subs) return <div className="bg-white rounded-2xl shadow-card p-6 text-muted">Cargando suscriptores…</div>;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-sm text-muted">{subs.length} suscriptor{subs.length !== 1 ? 'es' : ''} para novedades y campañas</p>
        <div className="flex gap-2.5 flex-wrap">
          <button onClick={() => setCampaign({ subject: '', message: '' })} disabled={!subs.length} className="inline-flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition disabled:opacity-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
            Enviar campaña
          </button>
          <button onClick={exportCSV} disabled={!subs.length} className="inline-flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-lg bg-okgreen text-white hover:brightness-95 transition disabled:opacity-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      {campaign && (
        <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setCampaign(null)}>
          <form onSubmit={sendCampaign} className="bg-white rounded-2xl w-full max-w-[560px] shadow-cardlg animate-pop my-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h3 className="text-navy text-lg font-bold">Enviar campaña por correo</h3>
              <button type="button" onClick={() => setCampaign(null)} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              {!mailEnabled && (
                <div className="px-3.5 py-2.5 rounded-lg text-[13px] bg-[#fff4e5] text-[#8a5300] border border-[#ffd699]">
                  ⚠ El envío de correos no está configurado. Define <code>SMTP_*</code> en el archivo <code>.env</code> para activarlo. Mientras tanto, puedes exportar la lista (CSV) y enviar desde tu correo.
                </div>
              )}
              <p className="text-[13px] text-muted">Se enviará a los <strong className="text-navy">{subs.length}</strong> suscriptores (en copia oculta).</p>
              <div><label className="block text-[13px] font-bold text-navy mb-1.5">Asunto *</label><input value={campaign.subject} onChange={(e) => setCampaign((c) => ({ ...c, subject: e.target.value }))} required className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue" placeholder="Nueva campaña de descuentos 🎉" /></div>
              <div><label className="block text-[13px] font-bold text-navy mb-1.5">Mensaje *</label><textarea value={campaign.message} onChange={(e) => setCampaign((c) => ({ ...c, message: e.target.value }))} required className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm min-h-[130px] resize-y focus:outline-none focus:border-brandblue" placeholder="Escribe aquí el contenido del correo…" /></div>
            </div>
            <div className="px-6 py-4 border-t border-line flex justify-end gap-2.5">
              <button type="button" onClick={() => setCampaign(null)} className="font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue transition">Cancelar</button>
              <button type="submit" disabled={sending || !mailEnabled} className="font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition disabled:opacity-50">{sending ? 'Enviando…' : 'Enviar a todos'}</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-navy text-white text-left">
              <th className={th}>Fecha</th>
              <th className={th}>Nombre</th>
              <th className={th + ' hidden md:table-cell'}>Empresa</th>
              <th className={th + ' hidden lg:table-cell'}>Cargo</th>
              <th className={th}>Correo</th>
              <th className={th + ' hidden md:table-cell'}>Teléfono</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted">Aún no hay suscriptores.</td></tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className={td + ' text-muted whitespace-nowrap'}>{new Date(s.created_at + 'Z').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className={td + ' font-semibold text-navy'}>{s.name || '—'}</td>
                  <td className={td + ' hidden md:table-cell'}>{s.company || '—'}</td>
                  <td className={td + ' hidden lg:table-cell'}>{s.position || '—'}</td>
                  <td className={td}><a href={`mailto:${s.email}`} className="text-brandblue hover:underline">{s.email}</a></td>
                  <td className={td + ' hidden md:table-cell'}>{s.phone || '—'}</td>
                  <td className={td}>
                    <button onClick={() => remove(s)} title="Eliminar" className="w-[34px] h-[34px] rounded-lg grid place-items-center bg-page text-navy hover:bg-brandred hover:text-white transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
