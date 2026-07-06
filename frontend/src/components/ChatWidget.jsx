import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ASESORES, FAQS, EMPRESA, prettyPhone, whatsappTo } from '../lib/asesores.js';
import { trackAdvisorRequest } from '../lib/track.js';

const WA_MSG = 'Hola 👋, vengo de la página web de RODASUR y quisiera más información.';

const MENU = [
  { label: '🧑‍💼 Hablar con un asesor', action: 'asesores' },
  { label: '❓ Preguntas frecuentes', action: 'faq' },
  { label: '🏷️ Ver ofertas', action: 'ofertas' },
  { label: '📍 Ubicación y horario', action: 'ubicacion' },
];

function BotAvatar() {
  return (
    <span className="w-8 h-8 rounded-full bg-white grid place-items-center shrink-0 shadow ring-1 ring-black/5">
      <img src="/logo.png" alt="RODASUR" className="w-6 h-6 object-contain" />
    </span>
  );
}

export default function ChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);
  const timer = useRef(null);

  // Abrir desde botones externos ("Contactar ventas" / "Contáctanos")
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('rodasur:open-chat', openHandler);
    return () => window.removeEventListener('rodasur:open-chat', openHandler);
  }, []);

  // Saludo inicial al abrir por primera vez
  useEffect(() => {
    if (open && !started) {
      setStarted(true);
      botSay(
        [{ text: '¡Hola! 👋 Bienvenido a RODASUR, tu Aliado Industrial.' },
         { text: 'Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?' }],
        MENU
      );
    }
  }, [open, started]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, options]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function botSay(msgs, opts = []) {
    setTyping(true);
    setOptions([]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, ...msgs.map((x) => ({ from: 'bot', ...x }))]);
      setOptions(opts);
    }, 550);
  }

  function userSay(text) {
    setMessages((m) => [...m, { from: 'user', text }]);
  }

  function handle(action, payload, label) {
    if (label) userSay(label);

    switch (action) {
      case 'menu':
        botSay([{ text: '¿Sobre qué más te gustaría saber? 😊' }], MENU);
        break;

      case 'asesores':
        botSay(
          [{ text: 'Con gusto 🙌 Elige el asesor con quien deseas comunicarte y te abrimos el chat de WhatsApp:' }],
          [...ASESORES.map((a, i) => ({ label: a.name, action: 'asesor', payload: i })), { label: '← Volver al menú', action: 'menu' }]
        );
        break;

      case 'asesor': {
        const a = ASESORES[payload];
        trackAdvisorRequest(a.name, a.phone); // registra la solicitud para estadísticas
        botSay(
          [{ text: `Te comunico con *${a.name}* 👇`, asesor: a }],
          [{ label: '👥 Ver otros asesores', action: 'asesores' }, { label: '← Volver al menú', action: 'menu' }]
        );
        break;
      }

      case 'faq':
        botSay(
          [{ text: 'Estas son las preguntas más frecuentes. Toca una para ver la respuesta:' }],
          [...FAQS.map((f, i) => ({ label: f.q, action: 'faqAnswer', payload: i })), { label: '← Volver al menú', action: 'menu' }]
        );
        break;

      case 'faqAnswer':
        botSay(
          [{ text: FAQS[payload].a }],
          [{ label: '❓ Otra pregunta', action: 'faq' }, { label: '🧑‍💼 Hablar con un asesor', action: 'asesores' }, { label: '← Menú', action: 'menu' }]
        );
        break;

      case 'ubicacion':
        botSay(
          [{ text: `📍 *Estamos en:*\n${EMPRESA.direccion}` },
           { text: `🕒 *Horario de atención:*\n${EMPRESA.horario}`, link: { href: EMPRESA.maps, text: '📌 Ver en Google Maps' } }],
          [{ label: '🧑‍💼 Hablar con un asesor', action: 'asesores' }, { label: '← Volver al menú', action: 'menu' }]
        );
        break;

      case 'ofertas':
        botSay([{ text: '¡Genial! Te llevo a nuestras ofertas destacadas 🏷️' }], []);
        setTimeout(() => { navigate('/'); setOpen(false); window.scrollTo({ top: 0 }); }, 700);
        break;

      default:
        break;
    }
  }

  function submitInput(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    userSay(text);
    setInput('');
    botSay(
      [{ text: 'Para atenderte mejor 🤝, elige una opción o habla directo con un asesor:' }],
      MENU
    );
  }

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className="fixed bottom-5 right-5 z-[120] flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-gradient-to-br from-brandblue to-navy text-white shadow-cardlg hover:scale-105 active:scale-95 transition"
        >
          <span className="relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 ring-2 ring-white animate-pulse" />
          </span>
          <span className="font-bold text-sm hidden sm:block">¿Te ayudamos?</span>
        </button>
      )}

      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[120] w-full sm:w-[380px] h-[100dvh] sm:h-[560px] sm:max-h-[calc(100dvh-40px)] bg-white sm:rounded-2xl shadow-cardlg flex flex-col overflow-hidden animate-pop border border-line">
          {/* Encabezado */}
          <div className="bg-gradient-to-br from-navy to-navy-700 text-white px-4 py-3 flex items-center gap-3">
            <BotAvatar />
            <div className="flex-1 leading-tight">
              <div className="font-bold text-[15px]">Asistente RODASUR</div>
              <div className="text-[12px] text-[#a9b6d0] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" /> En línea · responde al instante
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          </div>

          {/* Mensajes */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-page">
            {messages.map((m, i) =>
              m.from === 'bot' ? (
                <div key={i} className="flex items-end gap-2">
                  <BotAvatar />
                  <div className="max-w-[80%]">
                    <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[14px] text-ink shadow-sm whitespace-pre-line">
                      {formatText(m.text)}
                    </div>
                    {m.asesor && <AsesorCard a={m.asesor} />}
                    {m.link && (
                      <a href={m.link.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5 text-brandblue text-[13px] font-bold hover:underline">
                        {m.link.text}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-brandblue text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[14px] shadow-sm">{m.text}</div>
                </div>
              )
            )}

            {typing && (
              <div className="flex items-end gap-2">
                <BotAvatar />
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Opciones rápidas */}
            {!typing && options.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 pl-10">
                {options.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => handle(o.action, o.payload, o.label)}
                    className="text-[13px] font-semibold px-3 py-1.5 rounded-full border border-brandblue/40 text-brandblue bg-white hover:bg-brandblue hover:text-white transition"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entrada de texto */}
          <form onSubmit={submitInput} className="border-t border-line p-2.5 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="flex-1 px-3.5 py-2.5 rounded-full bg-page text-sm focus:outline-none focus:ring-2 focus:ring-brandblue/30"
            />
            <button type="submit" aria-label="Enviar" className="w-10 h-10 shrink-0 rounded-full bg-brandred text-white grid place-items-center hover:bg-brandred-dark transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function AsesorCard({ a }) {
  return (
    <div className="mt-2 bg-white border border-line rounded-xl p-3 shadow-sm">
      <div className="font-bold text-navy text-[14px]">{a.name}</div>
      <div className="text-[12.5px] text-muted mb-2.5">Ejecutivo de ventas · RODASUR</div>
      <div className="flex flex-col gap-2">
        <a href={whatsappTo(a.phone, WA_MSG)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 font-bold text-[13px] px-3 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Escribir por WhatsApp
        </a>
        <a href={`mailto:${a.email}`} className="inline-flex items-center justify-center gap-2 font-bold text-[13px] px-3 py-2 rounded-lg bg-page text-navy hover:bg-line transition">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7L22 6" /></svg>
          {a.email}
        </a>
        <div className="text-[12px] text-muted text-center">{prettyPhone(a.phone)}</div>
      </div>
    </div>
  );
}

// Convierte *texto* en negrita dentro de los mensajes del bot.
function formatText(text) {
  const parts = String(text).split(/(\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith('*') && p.endsWith('*') ? <strong key={i} className="text-navy">{p.slice(1, -1)}</strong> : p
  );
}
