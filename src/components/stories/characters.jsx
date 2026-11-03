// Personajes originales de Mi Bebe dibujados en SVG (origen en el centro de los pies, ~100 de alto).
// Ninguno copia un personaje existente. Las animaciones viven en storyArt.css (clases ss-*).

function Eyes({ sleeping, y = -16, dx = 9, r = 3.4 }) {
  if (sleeping) {
    return (
      <g stroke="#3b2a33" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d={`M${-dx - 4} ${y}q4 4 8 0`} />
        <path d={`M${dx - 4} ${y}q4 4 8 0`} />
      </g>
    );
  }
  return (
    <g className="ss-eyes" fill="#3b2a33">
      <circle cx={-dx} cy={y} r={r} />
      <circle cx={dx} cy={y} r={r} />
      <circle cx={-dx + 1} cy={y - 1.2} r={r * 0.32} fill="#fff" />
      <circle cx={dx + 1} cy={y - 1.2} r={r * 0.32} fill="#fff" />
    </g>
  );
}

function Zzz() {
  return (
    <g fill="#ffffff" fontFamily="Georgia, serif" fontWeight="700" opacity="0.95">
      <text x="26" y="-52" fontSize="15" className="ss-zzz">z</text>
      <text x="36" y="-66" fontSize="12" className="ss-zzz" style={{ animationDelay: '1s' }}>z</text>
    </g>
  );
}

function Shadow({ rx = 24 }) {
  return <ellipse cx="0" cy="27" rx={rx} ry="6" fill="#000" opacity="0.13" />;
}

function Blush({ x = 16, y = -6, r = 4, c = '#ffc4d6' }) {
  return (
    <>
      <circle cx={-x} cy={y} r={r} fill={c} opacity="0.7" />
      <circle cx={x} cy={y} r={r} fill={c} opacity="0.7" />
    </>
  );
}

export function Bunny({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={20} />
      <ellipse cx="-14" cy="24" rx="10" ry="5" fill="#f7f1f4" />
      <ellipse cx="14" cy="24" rx="10" ry="5" fill="#f7f1f4" />
      <circle cx="-22" cy="6" r="9" fill="#ffffff" />
      <ellipse cx="0" cy="6" rx="24" ry="22" fill="#ffffff" />
      <ellipse cx="0" cy="12" rx="13" ry="12" fill="#fde7ef" />
      <g className="ss-ear"><ellipse cx="-12" cy="-46" rx="7.5" ry="22" fill="#ffffff" /><ellipse cx="-12" cy="-44" rx="3.6" ry="15" fill="#f9b8cf" /></g>
      <g className="ss-ear" style={{ animationDelay: '0.4s' }}>
        <ellipse cx="12" cy="-46" rx="7.5" ry="22" fill="#ffffff" transform={sleeping ? 'rotate(18 12 -30)' : ''} />
        <ellipse cx="12" cy="-44" rx="3.6" ry="15" fill="#f9b8cf" transform={sleeping ? 'rotate(18 12 -30)' : ''} />
      </g>
      <circle cx="0" cy="-14" r="22" fill="#ffffff" />
      <Eyes sleeping={sleeping} y={-16} dx={9} />
      <ellipse cx="0" cy="-8" rx="3.2" ry="2.4" fill="#f48fb1" />
      <path d="M0-6v3M-4 -2q4 3 8 0" stroke="#c2527c" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Blush />
      <g className={action === 'wave' ? 'ss-arm-wave' : ''}><ellipse cx="22" cy="6" rx="6" ry="11" fill="#ffffff" transform="rotate(-18 22 6)" /></g>
      {sleeping && <Zzz />}
    </g>
  );
}

export function Bear({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={26} />
      <ellipse cx="-15" cy="26" rx="11" ry="6" fill="#8a5a3c" />
      <ellipse cx="15" cy="26" rx="11" ry="6" fill="#8a5a3c" />
      <ellipse cx="0" cy="8" rx="28" ry="24" fill="#a8704b" />
      <ellipse cx="0" cy="14" rx="16" ry="14" fill="#e6c3a0" />
      <g className={action === 'wave' ? 'ss-arm-wave' : ''}><ellipse cx="26" cy="6" rx="7" ry="13" fill="#a8704b" transform="rotate(-20 26 6)" /></g>
      <circle cx="-20" cy="-34" r="9" fill="#a8704b" /><circle cx="-20" cy="-34" r="4.5" fill="#e6c3a0" />
      <circle cx="20" cy="-34" r="9" fill="#a8704b" /><circle cx="20" cy="-34" r="4.5" fill="#e6c3a0" />
      <circle cx="0" cy="-16" r="25" fill="#a8704b" />
      <ellipse cx="0" cy="-8" rx="12" ry="9" fill="#e6c3a0" />
      <Eyes sleeping={sleeping} y={-20} dx={10} />
      <ellipse cx="0" cy="-12" rx="4.4" ry="3" fill="#4a2f22" />
      <path d="M0-9v4M-5 -4q5 4 10 0" stroke="#4a2f22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Blush x={17} y={-8} c="#e79a8a" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Turtle({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={34} />
      <ellipse cx="-22" cy="20" rx="9" ry="7" fill="#9bcf7a" />
      <ellipse cx="14" cy="20" rx="9" ry="7" fill="#9bcf7a" />
      <path d="M-40 14 -46 18 -38 20Z" fill="#9bcf7a" />
      <g className={action === 'swim' ? 'ss-flipper' : ''}><ellipse cx="6" cy="8" rx="12" ry="5" fill="#9bcf7a" transform="rotate(25 6 8)" /></g>
      <path d="M-38 16A38 34 0 0 1 38 16Z" fill="#4f9d5e" />
      <path d="M-38 16A38 34 0 0 1 38 16" fill="none" stroke="#3b7d49" strokeWidth="3" />
      <g fill="#6cbc78" stroke="#3b7d49" strokeWidth="1.6">
        <path d="M-10-6 0-12 10-6 10 4-0 10-10 4Z" />
        <path d="M-30 6-22 -2-10-6-10 4-18 12Z" />
        <path d="M30 6 22 -2 10-6 10 4 18 12Z" />
      </g>
      <circle cx="40" cy="4" r="14" fill="#9bcf7a" />
      <g transform="translate(44 2)">
        {sleeping ? (
          <path d="M-4 -2q4 4 8 0" stroke="#3b2a33" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <g className="ss-eyes"><circle cx="0" cy="-1" r="3" fill="#3b2a33" /><circle cx="1" cy="-2" r="1" fill="#fff" /></g>
        )}
        <path d="M4 7q4 3 8 0" stroke="#3b7d49" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="-3" cy="6" r="3" fill="#ffb4a2" opacity="0.7" />
      </g>
      {sleeping && <Zzz />}
    </g>
  );
}

export function StarKid({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <circle cx="0" cy="0" r="46" fill="#fff3a8" opacity="0.4" className="ss-halo" />
      <path d="M0-34 9-12 33-10 15 6 21 30 0 18-21 30-15 6-33-10-9-12Z" fill="#ffd54f" stroke="#ffc107" strokeWidth="3" strokeLinejoin="round" />
      <Eyes sleeping={sleeping} y={-2} dx={8} />
      <path d="M-5 8q5 5 10 0" stroke="#c2527c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Blush x={14} y={6} r={3.6} c="#ff9ec7" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Fox({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={26} />
      <g className="ss-wag" style={{ transformOrigin: '10% 80%' }}>
        <path d="M16 18C50 20 64 -2 52 -26C46 -8 34 0 14 2Z" fill="#ec8b3f" />
        <path d="M52 -26C60 -14 58 -2 49 6C44 -2 47 -16 52 -26Z" fill="#fff6ec" />
      </g>
      <ellipse cx="-12" cy="25" rx="9" ry="5" fill="#5a3a2a" />
      <ellipse cx="12" cy="25" rx="9" ry="5" fill="#5a3a2a" />
      <ellipse cx="0" cy="8" rx="22" ry="22" fill="#ec8b3f" />
      <ellipse cx="0" cy="14" rx="12" ry="14" fill="#fff3e6" />
      <path d="M-26 -26 -19 -56 -4 -34Z" fill="#ec8b3f" /><path d="M-22 -32 -19 -48 -12 -35Z" fill="#5a3a2a" />
      <g className="ss-ear"><path d="M26 -26 19 -56 4 -34Z" fill="#ec8b3f" /><path d="M22 -32 19 -48 12 -35Z" fill="#5a3a2a" /></g>
      <ellipse cx="0" cy="-16" rx="26" ry="21" fill="#ec8b3f" />
      <path d="M-26 -12Q-12 -4 0 -6Q12 -4 26 -12Q20 8 0 8Q-20 8 -26 -12Z" fill="#fff3e6" />
      <Eyes sleeping={sleeping} y={-19} dx={10} />
      <ellipse cx="0" cy="-8" rx="3.4" ry="2.6" fill="#3b2a33" />
      <path d="M0-5.5v3M-4 -1q4 3 8 0" stroke="#3b2a33" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Blush x={19} y={-8} r={3.4} c="#ffb4a2" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Owl({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={22} />
      <g stroke="#f0a040" strokeWidth="3" strokeLinecap="round"><path d="M-8 22v5M-4 22v5M8 22v5M4 22v5" /></g>
      <ellipse cx="0" cy="6" rx="26" ry="28" fill="#9a7552" />
      <ellipse cx="0" cy="12" rx="16" ry="20" fill="#ecd9bd" />
      <g stroke="#c9ad88" strokeWidth="2" fill="none" strokeLinecap="round"><path d="M-8 4q4 4 8 0t8 0M-9 14q4 4 9 0t9 0M-7 24q3 3 7 0t7 0" /></g>
      <g className="ss-wing-l"><path d="M-24 -6Q-42 10 -30 32Q-22 22 -22 6Z" fill="#7f5d3e" /></g>
      <g className={action === 'wave' ? 'ss-arm-wave' : 'ss-wing-r'}><path d="M24 -6Q42 10 30 32Q22 22 22 6Z" fill="#7f5d3e" /></g>
      <path d="M-24 -26 -26 -48 -10 -34Z" fill="#9a7552" /><path d="M24 -26 26 -48 10 -34Z" fill="#9a7552" />
      <ellipse cx="0" cy="-16" rx="26" ry="22" fill="#9a7552" />
      <circle cx="-11" cy="-18" r="11" fill="#fff7e8" /><circle cx="11" cy="-18" r="11" fill="#fff7e8" />
      {sleeping ? (
        <g stroke="#3b2a33" strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="M-16 -17q5 5 10 0M6 -17q5 5 10 0" /></g>
      ) : (
        <g className="ss-eyes"><circle cx="-11" cy="-18" r="6" fill="#3b2a33" /><circle cx="11" cy="-18" r="6" fill="#3b2a33" /><circle cx="-9" cy="-20" r="2" fill="#fff" /><circle cx="13" cy="-20" r="2" fill="#fff" /></g>
      )}
      <path d="M-4 -10 0 -3 4 -10Z" fill="#f0a040" />
      <Blush x={20} y={-6} r={3.4} c="#e79a8a" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Whale({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <g className="ss-spout" opacity="0.9">
        <path d="M18 -34q-4-14-14-18M18 -34q4-14 14-18M18 -34v-20" stroke="#dff3ff" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <circle cx="4" cy="-54" r="2.6" fill="#dff3ff" /><circle cx="32" cy="-54" r="2.6" fill="#dff3ff" /><circle cx="18" cy="-60" r="2.6" fill="#dff3ff" />
      </g>
      <g className="ss-tail"><path d="M-62 4Q-84 -6 -92 -30Q-76 -26 -66 -14Q-76 -2 -92 2Q-80 12 -62 12Z" fill="#4f86c6" /></g>
      <path d="M-66 8Q-60 -34 -8 -38Q48 -42 66 -6Q70 26 28 32Q-30 40 -66 8Z" fill="#5b95d6" />
      <path d="M-40 22Q0 40 56 20Q60 30 30 33Q-26 40 -40 22Z" fill="#cfe6fa" />
      <g className="ss-flipper"><path d="M-6 14Q-14 34 6 38Q8 26 8 14Z" fill="#4f86c6" /></g>
      {sleeping ? (
        <path d="M36 -8q5 5 10 0" stroke="#1d2b4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ) : (
        <g className="ss-eyes"><circle cx="41" cy="-8" r="4" fill="#1d2b4a" /><circle cx="42.4" cy="-9.4" r="1.4" fill="#fff" /></g>
      )}
      <path d="M44 10q10 6 20 -4" stroke="#1d2b4a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="4" r="5" fill="#ffb4c8" opacity="0.6" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Cat({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={24} />
      <g className="ss-wag" style={{ transformOrigin: '10% 90%' }}>
        <path d="M18 22C52 26 56 -6 44 -22C42 -8 34 6 16 10Z" fill="#f0b46a" />
        <path d="M46 -16 41 -4M42 -2 36 8" stroke="#c9883c" strokeWidth="3" strokeLinecap="round" />
      </g>
      <ellipse cx="-11" cy="25" rx="9" ry="5" fill="#fff3e2" />
      <ellipse cx="11" cy="25" rx="9" ry="5" fill="#fff3e2" />
      <ellipse cx="0" cy="8" rx="22" ry="22" fill="#f0b46a" />
      <ellipse cx="0" cy="14" rx="12" ry="13" fill="#fff3e2" />
      <path d="M-22 -22-24 -50-5 -34Z" fill="#f0b46a" /><path d="M-20 -30-21 -43-12 -34Z" fill="#f7b8c4" />
      <g className="ss-ear"><path d="M22 -22 24 -50 5 -34Z" fill="#f0b46a" /><path d="M20 -30 21 -43 12 -34Z" fill="#f7b8c4" /></g>
      <ellipse cx="0" cy="-14" rx="25" ry="20" fill="#f0b46a" />
      <path d="M-5 -32v8M0 -33v9M5 -32v8" stroke="#c9883c" strokeWidth="2.4" strokeLinecap="round" />
      <Eyes sleeping={sleeping} y={-16} dx={10} />
      <path d="M-2.4 -8h4.8l-2.4 3.4Z" fill="#e58aa0" />
      <path d="M0-4.6q-3 4-6 1.6M0-4.6q3 4 6 1.6" stroke="#8a5a3c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M-28 -10l-14-3M-28 -6l-14 2M28 -10l14-3M28 -6l14 2" stroke="#8a5a3c" strokeWidth="1.2" strokeLinecap="round" />
      <Blush x={17} y={-6} r={3.4} c="#ffb4a2" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Penguin({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={22} />
      <ellipse cx="-10" cy="26" rx="9" ry="4.4" fill="#f4a340" />
      <ellipse cx="10" cy="26" rx="9" ry="4.4" fill="#f4a340" />
      <ellipse cx="0" cy="4" rx="26" ry="30" fill="#2f3b5c" />
      <ellipse cx="0" cy="10" rx="17" ry="22" fill="#f6f8ff" />
      <g className={action === 'wave' ? 'ss-arm-wave' : 'ss-wing-l'}><path d="M-24 -6Q-40 12 -28 30Q-20 20 -22 4Z" fill="#26304c" /></g>
      <g className="ss-wing-r"><path d="M24 -6Q40 12 28 30Q20 20 22 4Z" fill="#26304c" /></g>
      <circle cx="0" cy="-22" r="21" fill="#2f3b5c" />
      <path d="M-14 -22Q0 -10 14 -22Q16 -8 0 -4Q-16 -8 -14 -22Z" fill="#f6f8ff" />
      <Eyes sleeping={sleeping} y={-24} dx={8} r={3} />
      <path d="M-5 -15h10l-5 7Z" fill="#f4a340" />
      <Blush x={15} y={-12} r={3.2} c="#ffb4c8" />
      <path d="M-18 -4Q0 6 18 -4L16 4Q0 12 -16 4Z" fill="#b79be8" />
      <path d="M12 2l4 14-8-2Z" fill="#a285dc" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Dragon({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={28} />
      <g className="ss-wag" style={{ transformOrigin: '10% 80%' }}>
        <path d="M18 20C54 24 60 -6 48 -20C44 -6 34 6 16 8Z" fill="#5fb59a" />
        <path d="M48 -20 56 -28 54 -14Z" fill="#f4a340" />
      </g>
      <ellipse cx="-12" cy="25" rx="9" ry="5" fill="#4a9a82" />
      <ellipse cx="12" cy="25" rx="9" ry="5" fill="#4a9a82" />
      <g className="ss-wing-l"><path d="M-14 -4Q-48 -22 -42 8Q-30 2 -22 8Z" fill="#9bdcc6" /></g>
      <g className="ss-wing-r"><path d="M14 -4Q48 -22 42 8Q30 2 22 8Z" fill="#9bdcc6" /></g>
      <ellipse cx="0" cy="8" rx="23" ry="22" fill="#5fb59a" />
      <ellipse cx="0" cy="14" rx="13" ry="14" fill="#f6ecc4" />
      <g fill="#f4a340"><path d="M-6 -36 0 -48 6 -36Z" /><path d="M-18 -30-14 -42-8 -32Z" /><path d="M18 -30 14 -42 8 -32Z" /></g>
      <path d="M-18 -30-24 -48-8 -36Z" fill="#f6ecc4" /><path d="M18 -30 24 -48 8 -36Z" fill="#f6ecc4" />
      <ellipse cx="0" cy="-14" rx="25" ry="21" fill="#5fb59a" />
      <ellipse cx="0" cy="-6" rx="13" ry="9" fill="#8ad0b8" />
      <circle cx="-4" cy="-7" r="1.4" fill="#3b6b5a" /><circle cx="4" cy="-7" r="1.4" fill="#3b6b5a" />
      <Eyes sleeping={sleeping} y={-20} dx={10} />
      <path d="M-5 -1q5 4 10 0" stroke="#3b6b5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <Blush x={19} y={-8} r={3.4} c="#ffb4a2" />
      {!sleeping && (
        <g className="ss-ember"><path d="M0-40q-5-8 0-14q5 6 0 14Z" fill="#ffb74d" opacity="0.95" /><path d="M0-42q-2-4 0-7q2 3 0 7Z" fill="#fff3c4" /></g>
      )}
      {sleeping && <Zzz />}
    </g>
  );
}

export function Elephant({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={32} />
      <path d="M-30 20q-10 2-10 10l8-2Z" fill="#8fa2c4" />
      <rect x="-24" y="14" width="16" height="14" rx="6" fill="#8fa2c4" />
      <rect x="8" y="14" width="16" height="14" rx="6" fill="#8fa2c4" />
      <ellipse cx="0" cy="6" rx="31" ry="26" fill="#a9bbd9" />
      <g className="ss-ear-big" style={{ transformOrigin: '90% 30%' }}><ellipse cx="-34" cy="-14" rx="16" ry="21" fill="#94a8cc" /><ellipse cx="-33" cy="-13" rx="9" ry="14" fill="#f2c5d0" opacity="0.7" /></g>
      <g className="ss-ear-big" style={{ transformOrigin: '10% 30%', animationDelay: '0.5s' }}><ellipse cx="34" cy="-14" rx="16" ry="21" fill="#94a8cc" /><ellipse cx="33" cy="-13" rx="9" ry="14" fill="#f2c5d0" opacity="0.7" /></g>
      <ellipse cx="0" cy="-16" rx="26" ry="23" fill="#a9bbd9" />
      <g className="ss-trunk" style={{ transformOrigin: '50% 0%' }}><path d="M-7 -8Q-8 18 0 26Q8 32 14 22Q6 22 5 14Q6 0 7 -8Z" fill="#a9bbd9" /></g>
      <path d="M-14 -4q-6 8-2 14M14 -4q6 8 2 14" stroke="#fffdf4" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Eyes sleeping={sleeping} y={-20} dx={11} r={3} />
      <Blush x={19} y={-9} r={3.6} c="#f2a4b4" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Sheep({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={26} />
      <rect x="-14" y="14" width="6" height="14" rx="3" fill="#5a4a52" />
      <rect x="8" y="14" width="6" height="14" rx="3" fill="#5a4a52" />
      <g fill="#fffdfb">
        <circle cx="-16" cy="4" r="14" /><circle cx="16" cy="4" r="14" /><circle cx="0" cy="-2" r="16" />
        <circle cx="-22" cy="-8" r="11" /><circle cx="22" cy="-8" r="11" /><circle cx="0" cy="16" r="13" /><circle cx="-10" cy="-18" r="12" /><circle cx="10" cy="-18" r="12" />
      </g>
      <g stroke="#e6dde4" strokeWidth="1.4" fill="none"><path d="M-22 6q4 4 8 0M12 8q4 4 8 0M-4 -4q4 4 8 0" /></g>
      <ellipse cx="-19" cy="-12" rx="7" ry="4" fill="#5a4a52" transform="rotate(-24 -19 -12)" />
      <ellipse cx="19" cy="-12" rx="7" ry="4" fill="#5a4a52" transform="rotate(24 19 -12)" />
      <ellipse cx="0" cy="-12" rx="14" ry="15" fill="#6a5a62" />
      <Eyes sleeping={sleeping} y={-14} dx={6.5} r={3} />
      <ellipse cx="0" cy="-5" rx="3" ry="2" fill="#e79aa8" />
      <path d="M-4 0q4 3 8 0" stroke="#e79aa8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Blush x={10} y={-6} r={2.8} c="#ffb4c8" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Duck({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <Shadow rx={24} />
      <path d="M-4 24 -10 30 2 28ZM10 24 4 30 16 28Z" fill="#f59a3c" />
      <path d="M-26 6Q-34 -4-40 2Q-34 14-24 20Z" fill="#ffd45a" />
      <ellipse cx="0" cy="8" rx="26" ry="22" fill="#ffe27a" />
      <g className="ss-wing-r"><path d="M8 -2Q28 4 22 22Q8 22 4 8Z" fill="#ffd04a" /></g>
      <path d="M-4 -34Q2 -44 8 -34" stroke="#ffd04a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="0" cy="-16" r="21" fill="#ffe27a" />
      <ellipse cx="0" cy="-8" rx="11" ry="6.4" fill="#f59a3c" />
      <path d="M-9 -8q9 5 18 0" stroke="#d97a1a" strokeWidth="1.4" fill="none" />
      <Eyes sleeping={sleeping} y={-20} dx={9} r={3} />
      <Blush x={16} y={-10} r={3.4} c="#ffb4a2" />
      {sleeping && <Zzz />}
    </g>
  );
}

export function Butterfly({ action }) {
  const sleeping = action === 'sleep';
  return (
    <g>
      <g className="ss-flap" style={{ transformOrigin: '50% 50%' }}>
        <path d="M-2 -6Q-40 -44 -46 -10Q-44 8 -2 4Z" fill="#c8a6f0" /><path d="M2 -6Q40 -44 46 -10Q44 8 2 4Z" fill="#c8a6f0" />
        <path d="M-2 4Q-34 8 -36 28Q-30 40 -2 12Z" fill="#f6b4d0" /><path d="M2 4Q34 8 36 28Q30 40 2 12Z" fill="#f6b4d0" />
        <circle cx="-26" cy="-14" r="6" fill="#fff6d6" opacity="0.9" /><circle cx="26" cy="-14" r="6" fill="#fff6d6" opacity="0.9" />
        <circle cx="-24" cy="20" r="3.6" fill="#fff6d6" opacity="0.9" /><circle cx="24" cy="20" r="3.6" fill="#fff6d6" opacity="0.9" />
      </g>
      <ellipse cx="0" cy="2" rx="4.4" ry="17" fill="#6a5290" />
      <circle cx="0" cy="-18" r="7.4" fill="#6a5290" />
      {sleeping ? (
        <path d="M-4 -19q2 2 4 0M0 -19q2 2 4 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      ) : (
        <g className="ss-eyes"><circle cx="-2.8" cy="-19" r="1.7" fill="#fff" /><circle cx="2.8" cy="-19" r="1.7" fill="#fff" /></g>
      )}
      <path d="M-2 -24Q-8 -36-14 -34M2 -24Q8 -36 14 -34" stroke="#6a5290" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="-14" cy="-34" r="2" fill="#6a5290" /><circle cx="14" cy="-34" r="2" fill="#6a5290" />
    </g>
  );
}

export function Firefly() {
  return (
    <g>
      <circle cx="0" cy="6" r="22" fill="#fff59d" opacity="0.28" className="ss-halo" />
      <g className="ss-flap" style={{ transformOrigin: '50% 50%' }}>
        <ellipse cx="-9" cy="-6" rx="9" ry="5" fill="#e6f6ff" opacity="0.75" transform="rotate(-24 -9 -6)" />
        <ellipse cx="9" cy="-6" rx="9" ry="5" fill="#e6f6ff" opacity="0.75" transform="rotate(24 9 -6)" />
      </g>
      <ellipse cx="0" cy="8" rx="6" ry="9" fill="#fff59d" className="ss-blink" />
      <ellipse cx="0" cy="-4" rx="5" ry="6" fill="#5a4a52" />
      <circle cx="0" cy="-10" r="5" fill="#5a4a52" />
      <g className="ss-eyes" fill="#fff"><circle cx="-2" cy="-10" r="1.2" /><circle cx="2" cy="-10" r="1.2" /></g>
      <path d="M-2 -14Q-6 -20-9 -19M2 -14Q6 -20 9 -19" stroke="#5a4a52" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

export const CHARACTERS = {
  bunny: Bunny, bear: Bear, turtle: Turtle, star: StarKid, fox: Fox, owl: Owl, whale: Whale, cat: Cat,
  penguin: Penguin, dragon: Dragon, elephant: Elephant, sheep: Sheep, duck: Duck, butterfly: Butterfly, firefly: Firefly,
};

// Escala base por personaje en la escena
export const CHARACTER_SCALE = { star: 1.05, whale: 0.95, elephant: 1.2, butterfly: 1.1, firefly: 1.1, dragon: 1.15 };
