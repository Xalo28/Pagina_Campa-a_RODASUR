import { useState } from 'react';

export default function Subscribe() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', position: '', website: '' });
  const [state, setState] = useState({ loading: false, msg: '', ok: null });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, msg: '', ok: null });
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo completar la suscripción.');
      setState({ loading: false, msg: data.message || '¡Suscripción exitosa!', ok: true });
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      setState({ loading: false, msg: err.message, ok: false });
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy to-navy-700 text-white">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(43,122,228,.4),transparent_70%)]" />
      <div className="relative max-w-[1000px] mx-auto px-5 py-14 text-center">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brandred mb-4 mx-auto">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M22 6 12 13 2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
        </div>
        <h2 className="text-2xl md:text-[30px] font-black">Recibe nuestras ofertas antes que nadie</h2>
        <p className="text-[#cdd7ea] mt-2 max-w-[560px] mx-auto">
          Suscríbete y te avisaremos de nuevas campañas, descuentos y lanzamientos de RODASUR.
        </p>

        {state.ok ? (
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-[15px] font-semibold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            {state.msg}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 max-w-[720px] mx-auto">
            {/* honeypot anti-bots (oculto para personas) */}
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.name} onChange={set('name')} placeholder="Tu nombre" className="px-4 py-3 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brandblue" />
              <input value={form.email} onChange={set('email')} type="email" required placeholder="Tu correo *" className="px-4 py-3 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brandblue" />
              <input value={form.company} onChange={set('company')} placeholder="Empresa" className="px-4 py-3 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brandblue" />
              <input value={form.position} onChange={set('position')} placeholder="Cargo" className="px-4 py-3 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brandblue" />
              <input value={form.phone} onChange={set('phone')} placeholder="Tu teléfono (opcional)" className="px-4 py-3 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brandblue sm:col-span-2" />
            </div>
            {state.msg && state.ok === false && <p className="text-[#ff9aa5] text-sm mt-3">{state.msg}</p>}
            <button type="submit" disabled={state.loading} className="mt-4 inline-flex items-center gap-2 font-bold px-7 py-3 rounded-lg bg-brandred hover:bg-brandred-dark transition disabled:opacity-60">
              {state.loading ? 'Enviando…' : 'Suscribirme'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <p className="text-[#8ea3c7] text-xs mt-3">No compartimos tus datos. Puedes darte de baja cuando quieras.</p>
          </form>
        )}
      </div>
    </section>
  );
}
