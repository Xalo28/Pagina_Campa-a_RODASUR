// Ilustración vectorial de un rodamiento de bolas — temática Fiestas Patrias (rojo y blanco).
export default function Bearing({ className = '' }) {
  const balls = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 100 + Math.cos(a) * 66, y: 100 + Math.sin(a) * 66, red: i % 2 === 0 };
  });
  const teeth = Array.from({ length: 24 }, (_, i) => (i / 24) * 360);

  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="brg-steel" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e6ebf3" />
          <stop offset="100%" stopColor="#aab7c9" />
        </radialGradient>
        <radialGradient id="brg-white" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#eef1f6" />
          <stop offset="100%" stopColor="#c3ccdb" />
        </radialGradient>
        <radialGradient id="brg-red" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff6072" />
          <stop offset="55%" stopColor="#e2001a" />
          <stop offset="100%" stopColor="#9c0012" />
        </radialGradient>
      </defs>

      {/* Corona dentada exterior (roja, gira lento) */}
      <g className="origin-center animate-spinslow" style={{ transformBox: 'fill-box' }}>
        {teeth.map((deg, i) => (
          <rect key={i} x="96.5" y="2" width="7" height="12" rx="1.5" fill="#D91023" transform={`rotate(${deg} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#D91023" strokeWidth="9" />
      </g>

      {/* Aro exterior metálico + banda roja */}
      <circle cx="100" cy="100" r="80" fill="url(#brg-steel)" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#c33" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="52" fill="#D91023" />
      <circle cx="100" cy="100" r="52" fill="none" stroke="#fff" strokeWidth="2" />

      {/* Bolas alternando blanco y rojo (bandera del Perú), giran en sentido inverso */}
      <g className="origin-center animate-spinslow" style={{ transformBox: 'fill-box', animationDirection: 'reverse' }}>
        {balls.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="10.5" fill={b.red ? 'url(#brg-red)' : 'url(#brg-white)'} stroke="#8a94a6" strokeWidth="0.5" />
        ))}
      </g>

      {/* Cubo central */}
      <circle cx="100" cy="100" r="30" fill="url(#brg-steel)" />
      <circle cx="100" cy="100" r="14" fill="url(#brg-red)" />
      <circle cx="100" cy="100" r="14" fill="none" stroke="#fff" strokeWidth="2" />
      {/* Estrella central (escudo patrio, guiño) */}
      <path d="M100 92 l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.8z" fill="#fff" />
    </svg>
  );
}
