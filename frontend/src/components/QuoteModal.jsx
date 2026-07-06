import { useState } from 'react';

const INPUT = 'w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg text-sm focus:outline-none focus:border-brandblue';
const LABEL = 'block text-[13px] font-bold text-navy mb-1.5';

export default function QuoteModal({ product, onClose }) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', message: '', website: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Por favor ingresa tu nombre.');
    if (!form.phone.trim() && !form.email.trim()) return setError('Déjanos un teléfono o un correo para contactarte.');

    setSending(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_id: product.id,
          product_code: product.code,
          product_name: product.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(9,17,35,.6)] z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-cardlg animate-pop my-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-navy text-lg font-bold">Solicitar cotización</h3>
          <button type="button" onClick={onClose} className="text-muted text-2xl leading-none hover:text-brandred">×</button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#e7f6ee] grid place-items-center mb-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f9d55" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h4 className="text-navy text-lg font-bold">¡Solicitud enviada!</h4>
            <p className="text-muted text-sm mt-1">Un ejecutivo de RODASUR se pondrá en contacto contigo a la brevedad.</p>
            <button onClick={onClose} className="mt-5 inline-flex font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5">
            <p className="text-[13.5px] text-muted mb-4">
              Producto: <strong className="text-navy">{product.name}</strong> <span className="text-muted">({product.code})</span>
            </p>
            {error && <div className="px-3.5 py-2.5 rounded-lg text-[13.5px] mb-4 bg-[#fdeaec] text-brandred-dark border border-[#f5c2c8]">{error}</div>}
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
            <div className="grid gap-3.5">
              <div><label className={LABEL}>Nombre *</label><input value={form.name} onChange={set('name')} required className={INPUT} /></div>
              <div><label className={LABEL}>Empresa</label><input value={form.company} onChange={set('company')} className={INPUT} /></div>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div><label className={LABEL}>Teléfono / WhatsApp</label><input value={form.phone} onChange={set('phone')} className={INPUT} placeholder="+51 ..." /></div>
                <div><label className={LABEL}>Correo</label><input type="email" value={form.email} onChange={set('email')} className={INPUT} /></div>
              </div>
              <div><label className={LABEL}>Mensaje (opcional)</label><textarea value={form.message} onChange={set('message')} className={INPUT + ' min-h-[70px] resize-y'} placeholder="Cantidad, consultas, etc." /></div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button type="button" onClick={onClose} className="font-bold text-sm px-5 py-2.5 rounded-lg bg-white text-navy border-[1.5px] border-line hover:border-brandblue hover:text-brandblue transition">Cancelar</button>
              <button type="submit" disabled={sending} className="font-bold text-sm px-5 py-2.5 rounded-lg bg-brandred text-white hover:bg-brandred-dark transition disabled:opacity-50">{sending ? 'Enviando…' : 'Enviar solicitud'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
