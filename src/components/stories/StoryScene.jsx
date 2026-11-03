import './storyArt.css';
import { CHARACTERS, CHARACTER_SCALE } from './characters';

// Ilustraciones originales de Mi Bebe dibujadas en SVG y animadas con CSS.
// scene.sky: dawn | day | dusk | night | aurora | storm | deep
// scene.ground: meadow | forest | sea | hills | garden | snow | pond | underwater | clouds
// scene.extras: stars moon sun clouds birds trees flowers fireflies bubbles rain snow aurora rainbow
//               shooting lanterns balloon butterflies leaves campfire fish mountains sparkles rays fog boat
// scene.cam: in | out | left | right (movimiento lento de camara)

const SKIES = {
  dawn: ['#ffd9c4', '#f6c3dd'],
  day: ['#bfe3ff', '#eaf6ff'],
  dusk: ['#f7b7a3', '#b9a3e6'],
  night: ['#18204f', '#4a3f8f'],
  aurora: ['#0e1a3d', '#27456f'],
  storm: ['#8e9db8', '#c4cfe0'],
  deep: ['#2a78b8', '#12406e'],
};

const STAR_POINTS = [
  [40, 30, 3], [95, 60, 2], [150, 25, 3.5], [210, 55, 2.5], [265, 28, 3], [320, 62, 2],
  [365, 30, 3.5], [70, 100, 2], [180, 95, 2.5], [300, 105, 2], [120, 15, 2], [240, 12, 2.5],
];

function Sky({ sky, id }) {
  const [a, b] = SKIES[sky] || SKIES.day;
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x="-40" y="-30" width="480" height="360" fill={`url(#sky-${id})`} />
    </>
  );
}

function Stars() {
  return (
    <g>
      {STAR_POINTS.map(([x, y, r], i) => (
        <g key={i} className="ss-twinkle" style={{ animationDelay: `${(i % 5) * 0.5}s` }}>
          <circle cx={x} cy={y} r={r} fill="#fff7d6" />
          <path d={`M${x} ${y - r * 2.4}V${y + r * 2.4}M${x - r * 2.4} ${y}H${x + r * 2.4}`} stroke="#fff7d6" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Moon() {
  return (
    <g>
      <circle cx="296" cy="62" r="46" fill="#fff4c9" opacity="0.18" className="ss-halo" />
      <circle cx="296" cy="62" r="28" fill="#fff4c9" />
      <circle cx="286" cy="54" r="5" fill="#f1e2a8" />
      <circle cx="306" cy="72" r="4" fill="#f1e2a8" />
      <circle cx="308" cy="50" r="2.5" fill="#f1e2a8" />
    </g>
  );
}

function Sun({ low }) {
  const y = low ? 120 : 62;
  return (
    <g>
      <g className="ss-spin" style={{ transformOrigin: '298px ' + y + 'px', transformBox: 'view-box' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d={`M298 ${y - 46}l5 -14l5 14Z`} fill="#ffe39a" opacity="0.55" transform={`rotate(${a} 298 ${y})`} />
        ))}
      </g>
      <circle cx="298" cy={y} r="48" fill="#ffe39a" opacity="0.3" className="ss-halo" />
      <circle cx="298" cy={y} r="28" fill="#ffd36b" />
    </g>
  );
}

function Cloud({ x, y, s = 1, d = 0, tone = '#ffffff' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="ss-drift" style={{ animationDelay: `${d}s` }}>
        <ellipse cx="0" cy="0" rx="32" ry="12" fill={tone} opacity="0.95" />
        <circle cx="-12" cy="-8" r="14" fill={tone} opacity="0.95" />
        <circle cx="10" cy="-12" r="17" fill={tone} opacity="0.95" />
      </g>
    </g>
  );
}

function Fireflies() {
  const pts = [[90, 190], [150, 170], [230, 200], [300, 175], [60, 225], [350, 215]];
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i} className="ss-float" style={{ animationDelay: `${i * 0.7}s` }}>
          <circle cx={x} cy={y} r="9" fill="#fff59d" opacity="0.25" className="ss-blink" style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx={x} cy={y} r="2.6" fill="#fff9c4" className="ss-blink" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}
    </g>
  );
}

function Bubbles() {
  const pts = [[70, 270, 5], [140, 280, 3.5], [250, 275, 6], [330, 285, 4], [200, 290, 3], [30, 285, 4]];
  return (
    <g>
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeWidth="1.6" opacity="0.85" className="ss-rise" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
    </g>
  );
}

function Birds() {
  return (
    <g className="ss-fly" stroke="#4b5563" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M120 70q8-9 16 0q8-9 16 0" />
      <path d="M170 92q6-7 12 0q6-7 12 0" />
    </g>
  );
}

function Flowers() {
  const pts = [[40, 262, '#ff9ec7'], [110, 272, '#ffd36b'], [290, 268, '#ffffff'], [350, 258, '#ff9ec7']];
  return (
    <g>
      {pts.map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`} className="ss-sway" style={{ animationDelay: `${i * 0.4}s` }}>
          <path d="M0 0V18" stroke="#4e9a5a" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-6" rx="3.4" ry="5.5" fill={c} transform={`rotate(${a})`} />
          ))}
          <circle r="2.8" fill="#f59e0b" />
        </g>
      ))}
    </g>
  );
}

function Tree({ x, y, s = 1, snow = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-6" width="10" height="26" rx="3" fill="#6b4a2f" />
      <g className="ss-sway" style={{ transformOrigin: '50% 100%' }}>
        <path d="M0-80 30-30H14L38 0H-38L-14-30H-30Z" fill="#2f6b4a" />
        <path d="M0-80 18-44H-18Z" fill={snow ? '#f2f7ff' : '#3a7f59'} />
        {snow && <path d="M-30 -30h60l-10 -4h-40Z M-38 0h76l-12 -6h-52Z" fill="#f2f7ff" opacity="0.9" />}
      </g>
    </g>
  );
}

function Rain() {
  const drops = Array.from({ length: 22 }, (_, i) => [(i * 37) % 420 - 10, (i * 53) % 180, (i % 7) * 0.22]);
  return (
    <g stroke="#e6f1ff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
      {drops.map(([x, y, d], i) => (
        <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 14} className="ss-rain" style={{ animationDelay: `${d}s`, animationDuration: `${0.9 + (i % 4) * 0.12}s` }} />
      ))}
    </g>
  );
}

function Snow() {
  const flakes = Array.from({ length: 26 }, (_, i) => [(i * 41) % 400, (i * 29) % 200, 1.6 + (i % 4) * 0.7, (i % 9) * 0.6]);
  return (
    <g fill="#ffffff" opacity="0.95">
      {flakes.map(([x, y, r, d], i) => (
        <circle key={i} cx={x} cy={y} r={r} className="ss-snow" style={{ animationDelay: `${d}s`, animationDuration: `${6 + (i % 5)}s` }} />
      ))}
    </g>
  );
}

function AuroraRibbons() {
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      <path d="M-20 90C60 20 140 110 220 50S360 20 430 70V120C350 70 280 130 210 90S60 150 -20 120Z" fill="#5be6b4" opacity="0.45" className="ss-aurora" />
      <path d="M-20 120C70 60 150 140 230 82S360 70 430 110V150C350 110 280 160 210 128S70 180 -20 150Z" fill="#7aa8ff" opacity="0.38" className="ss-aurora" style={{ animationDelay: '2s' }} />
      <path d="M-20 60C70 10 150 70 240 26S370 8 430 40V74C360 40 290 90 220 62S70 100 -20 84Z" fill="#c59bff" opacity="0.32" className="ss-aurora" style={{ animationDelay: '4s' }} />
    </g>
  );
}

function Rainbow() {
  const cols = ['#ff8a9c', '#ffb36b', '#ffe27a', '#8fd69a', '#7fc4f2', '#b79be8'];
  return (
    <g className="ss-shimmer" fill="none" strokeLinecap="round">
      {cols.map((c, i) => (
        <path key={c} d={`M${20 + i * 7} 245A${180 - i * 7} ${150 - i * 6} 0 0 1 ${380 - i * 7} 245`} stroke={c} strokeWidth="7" opacity="0.8" />
      ))}
    </g>
  );
}

function Shooting() {
  return (
    <g className="ss-shoot">
      <path d="M0 0L-46 -18" stroke="#fff7d6" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <circle r="3.4" fill="#fffbe6" />
    </g>
  );
}

function Lanterns() {
  const pts = [[70, 250, 1], [160, 262, 0.8], [250, 270, 1.1], [330, 256, 0.9]];
  return (
    <g>
      {pts.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <g className="ss-lantern" style={{ animationDelay: `${i * 2.2}s` }}>
            <ellipse cx="0" cy="0" rx="10" ry="13" fill="#ffd27a" />
            <ellipse cx="0" cy="0" rx="14" ry="17" fill="#ffd27a" opacity="0.25" />
            <rect x="-5" y="11" width="10" height="4" rx="1.5" fill="#d98a3a" />
            <circle cx="0" cy="1" r="4" fill="#fff4c4" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Balloon() {
  return (
    <g className="ss-balloon" transform="translate(300 100)">
      <path d="M0 40Q-6 70 6 92" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.8" />
      <ellipse cx="0" cy="0" rx="30" ry="36" fill="#fff0b3" />
      <ellipse cx="0" cy="0" rx="40" ry="46" fill="#fff0b3" opacity="0.22" className="ss-halo" />
      <ellipse cx="-10" cy="-12" rx="8" ry="12" fill="#ffffff" opacity="0.55" />
      <path d="M-6 36h12l-3 8h-6Z" fill="#d9a65a" />
    </g>
  );
}

function Butterflies() {
  const pts = [[90, 150, '#c8a6f0'], [240, 130, '#f6b4d0'], [330, 170, '#ffd27a']];
  return (
    <g>
      {pts.map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g className="ss-flutter" style={{ animationDelay: `${i * 1.3}s` }}>
            <g className="ss-flap-fast" style={{ transformOrigin: '50% 50%' }}>
              <ellipse cx="-6" cy="-3" rx="7" ry="5" fill={c} /><ellipse cx="6" cy="-3" rx="7" ry="5" fill={c} />
              <ellipse cx="-5" cy="4" rx="5" ry="4" fill={c} opacity="0.8" /><ellipse cx="5" cy="4" rx="5" ry="4" fill={c} opacity="0.8" />
            </g>
            <rect x="-1" y="-6" width="2" height="12" rx="1" fill="#5a4a52" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Leaves() {
  const L = Array.from({ length: 9 }, (_, i) => [(i * 47) % 400, (i * 31) % 120, ['#f4a340', '#e8743c', '#d4a43c'][i % 3], (i % 5) * 0.9]);
  return (
    <g>
      {L.map(([x, y, c, d], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 0q8-4 10 6q-8 6-10-6Z" fill={c} className="ss-leaf" style={{ animationDelay: `${d}s`, animationDuration: `${7 + (i % 3)}s` }} />
        </g>
      ))}
    </g>
  );
}

function Campfire() {
  return (
    <g transform="translate(300 248)">
      <ellipse cx="0" cy="8" rx="34" ry="8" fill="#ffb74d" opacity="0.25" className="ss-halo" />
      <path d="M-18 6 18 -2M-18 -2 18 6" stroke="#6b4a2f" strokeWidth="6" strokeLinecap="round" />
      <g className="ss-flame" style={{ transformOrigin: '50% 100%' }}>
        <path d="M0 -4C-14 -6-12 -26 0 -40C12 -26 14 -6 0 -4Z" fill="#ff9a3c" />
        <path d="M0 -4C-7 -6-6 -18 0 -26C6 -18 7 -6 0 -4Z" fill="#ffe27a" />
      </g>
      {[[-8, -40], [10, -46], [2, -56]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="#ffd27a" className="ss-spark" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
    </g>
  );
}

function Fish() {
  const F = [[60, 130, '#ffb36b', 1], [250, 180, '#ff8a9c', -1], [150, 220, '#ffe27a', 1]];
  return (
    <g>
      {F.map(([x, y, c, dir], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${dir} 1)`}>
          <g className="ss-fish" style={{ animationDelay: `${i * 1.7}s`, animationDuration: `${9 + i * 2}s` }}>
            <ellipse cx="0" cy="0" rx="11" ry="6.4" fill={c} />
            <path d="M-9 0-17 -6V6Z" fill={c} />
            <circle cx="5" cy="-1.4" r="1.4" fill="#2a2a3a" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Mountains({ snowy }) {
  return (
    <g className="ss-parallax">
      <path d="M-40 190 40 100 100 160 170 80 250 170 310 110 440 200V240H-40Z" fill={snowy ? '#9bb4d8' : '#8f87c4'} opacity="0.7" />
      <path d="M-40 215 60 140 130 190 210 130 300 200 380 150 440 215V250H-40Z" fill={snowy ? '#b9cdea' : '#7a72b4'} opacity="0.85" />
      {snowy && <path d="M170 80 156 100 170 96 184 102ZM40 100 28 116 40 112 52 118Z" fill="#fff" />}
    </g>
  );
}

function Sparkles() {
  const S = [[60, 90], [140, 130], [220, 80], [300, 140], [360, 90], [100, 200], [280, 210]];
  return (
    <g>
      {S.map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6}L${x + 1.6} ${y - 1.6}L${x + 6} ${y}L${x + 1.6} ${y + 1.6}L${x} ${y + 6}L${x - 1.6} ${y + 1.6}L${x - 6} ${y}L${x - 1.6} ${y - 1.6}Z`} fill="#fff7d6" className="ss-twinkle" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
    </g>
  );
}

function Rays() {
  return (
    <g style={{ mixBlendMode: 'screen' }}>
      {[70, 150, 230, 310].map((x, i) => (
        <path key={x} d={`M${x} -10L${x + 30} -10L${x + 80} 300L${x - 10} 300Z`} fill="#bfe8ff" opacity="0.16" className="ss-shimmer" style={{ animationDelay: `${i * 1.1}s` }} />
      ))}
    </g>
  );
}

function Fog() {
  return (
    <g opacity="0.55">
      <ellipse cx="90" cy="236" rx="120" ry="14" fill="#ffffff" className="ss-drift" />
      <ellipse cx="300" cy="252" rx="140" ry="12" fill="#ffffff" className="ss-drift" style={{ animationDelay: '4s' }} />
    </g>
  );
}

function Boat({ x = 140, y = 244 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ss-rock">
        <path d="M-34 0Q0 22 34 0Q18 -8 0 -6Q-18 -8 -34 0Z" fill="#7cc486" />
        <path d="M-34 0Q0 22 34 0" fill="none" stroke="#4e9a5a" strokeWidth="2.4" />
        <path d="M0 -6V-44L22 -14Z" fill="#ffe3ec" />
        <path d="M0 -6V-44" stroke="#8a5a3c" strokeWidth="2" />
      </g>
    </g>
  );
}

function Ground({ type }) {
  if (type === 'sea') {
    return (
      <g>
        <rect y="150" width="400" height="150" fill="#5db7e8" />
        <path className="ss-wave-x" d="M-40 175q50-16 100 0t100 0t100 0t100 0t100 0V300H-40Z" fill="#46a4de" />
        <path className="ss-wave-x" style={{ animationDelay: '-3s', animationDirection: 'alternate-reverse' }} d="M-40 215q50-16 100 0t100 0t100 0t100 0t100 0V300H-40Z" fill="#3a92d0" />
        <path d="M0 262q60-14 120 0t120 0t120 0V300H0Z" fill="#e8d6a6" />
        <g className="ss-drift" opacity="0.7">
          <path d="M20 190q18-8 36 0M250 205q18-8 36 0" stroke="#e6f6ff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      </g>
    );
  }
  if (type === 'underwater') {
    return (
      <g>
        <path d="M-40 262q100-30 220-6t260-14V320H-40Z" fill="#e8d6a6" />
        <path d="M-40 282q120-20 240-2t240-8V320H-40Z" fill="#d9c28a" />
        {[[30, 262, 1], [88, 270, 0.8], [330, 258, 1.1], [372, 266, 0.9]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g className="ss-sway" style={{ animationDelay: `${i * 0.5}s` }}>
              <path d="M0 0C-10 -16 10 -30 0 -46C-8 -60 6 -70 0 -80" stroke="#3fae7a" strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>
          </g>
        ))}
        <g transform="translate(250 270)"><path d="M-14 0q4-24 14-24t14 24Z" fill="#ff9ab0" /><path d="M-6 -2q2-14 6-14t6 14Z" fill="#ffc4d0" /></g>
        <ellipse cx="60" cy="284" rx="14" ry="7" fill="#b7a07a" />
      </g>
    );
  }
  if (type === 'forest') {
    return (
      <g>
        <Tree x={40} y={238} s={1.1} />
        <Tree x={360} y={236} s={1.2} />
        <Tree x={105} y={240} s={0.8} />
        <Tree x={300} y={238} s={0.8} />
        <path d="M0 240q100-34 200-6t200-8V300H0Z" fill="#2e5c46" />
        <path d="M0 268q120-24 220-4t180-6V300H0Z" fill="#3d7357" />
      </g>
    );
  }
  if (type === 'hills') {
    return (
      <g>
        <path d="M0 215q90-60 180-14t220-32V300H0Z" fill="#7c6bb5" />
        <path d="M0 250q110-40 210-6t190-14V300H0Z" fill="#5c4f98" />
      </g>
    );
  }
  if (type === 'snow') {
    return (
      <g>
        <path d="M-40 218q100-50 200-10t280-20V320H-40Z" fill="#e9f1fc" />
        <path d="M-40 256q130-34 240-4t240-10V320H-40Z" fill="#f8fbff" />
        <g fill="#cfdcf0" opacity="0.8"><ellipse cx="90" cy="276" rx="26" ry="3.4" /><ellipse cx="300" cy="284" rx="30" ry="3.4" /></g>
      </g>
    );
  }
  if (type === 'garden') {
    return (
      <g>
        <path d="M0 232q100-30 200-8t200-14V300H0Z" fill="#8fd09a" />
        <g stroke="#f4e6d2" strokeWidth="4" strokeLinecap="round">
          {[20, 52, 84, 116, 148].map((x) => <path key={x} d={`M${x} 232v-24`} />)}
          <path d="M8 218H160" />
        </g>
        <path d="M0 268q120-26 230-4t170-6V300H0Z" fill="#6fbd7e" />
      </g>
    );
  }
  if (type === 'pond') {
    return (
      <g>
        <path d="M-40 222q100-30 200-6t280-10V320H-40Z" fill="#7cc486" />
        <path className="ss-wave-x" d="M-40 238q60-10 100 0t100 0t100 0t100 0t100 0V320H-40Z" fill="#6ec0e0" />
        <ellipse cx="300" cy="270" rx="26" ry="7" fill="#5fae6c" /><ellipse cx="60" cy="282" rx="22" ry="6" fill="#5fae6c" />
        <circle cx="300" cy="266" r="4" fill="#ffb4cc" />
        <g stroke="#4e9a5a" strokeWidth="3" strokeLinecap="round"><path d="M372 238v-34M382 240v-26M362 240v-22" /></g>
        <g fill="#8a5a3c"><ellipse cx="372" cy="200" rx="4" ry="9" /><ellipse cx="382" cy="212" rx="4" ry="9" /></g>
      </g>
    );
  }
  if (type === 'clouds') {
    return (
      <g>
        <ellipse cx="60" cy="280" rx="110" ry="46" fill="#ffffff" opacity="0.95" />
        <ellipse cx="200" cy="292" rx="130" ry="44" fill="#f4f0ff" />
        <ellipse cx="340" cy="278" rx="110" ry="46" fill="#ffffff" opacity="0.95" />
      </g>
    );
  }
  return (
    <g>
      <path d="M0 225q100-46 200-10t200-20V300H0Z" fill="#7cc486" />
      <path d="M0 262q120-34 230-6t170-8V300H0Z" fill="#5eb06f" />
    </g>
  );
}

function Character({ spec }) {
  if (!spec) return null;
  const Comp = CHARACTERS[spec.type];
  if (!Comp) return null;
  const x = (spec.x ?? 50) * 4;
  const y = (spec.y ?? 70) * 3;
  const scale = (CHARACTER_SCALE[spec.type] || 1.15) * (spec.s || 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${spec.flip ? -scale : scale} ${scale})`}>
      <g className={`ss-act-${spec.action || 'bob'}`}>
        <g className="ss-breathe">
          <Comp action={spec.action} />
        </g>
      </g>
    </g>
  );
}

/** Dibuja una escena completa a partir de su descripcion (ver data/storyCatalog.js). */
export default function StoryScene({ scene, label, uid = 'a', still = false }) {
  const s = scene || {};
  const extras = new Set(s.extras || []);
  const night = s.sky === 'night' || s.sky === 'aurora';
  return (
    <svg className={`ss-svg${still ? ' ss-still' : ''}`} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || 'Ilustración del cuento'}>
      <g className={`ss-cam ss-cam-${s.cam || 'in'}`}>
        <Sky sky={s.sky} id={uid} />
        {(extras.has('stars') || s.sky === 'aurora') && <Stars />}
        {(extras.has('aurora') || s.sky === 'aurora') && <AuroraRibbons />}
        {extras.has('moon') && <Moon />}
        {extras.has('sun') && <Sun low={s.sky === 'dusk' || s.sky === 'dawn'} />}
        {extras.has('shooting') && <Shooting />}
        {extras.has('mountains') && <Mountains snowy={s.ground === 'snow'} />}
        {extras.has('rainbow') && <Rainbow />}
        {extras.has('clouds') && (
          <g>
            <Cloud x={80} y={70} s={1} tone={s.sky === 'storm' ? '#9fa9bc' : '#ffffff'} />
            <Cloud x={230} y={110} s={0.8} d={3} tone={s.sky === 'storm' ? '#aeb8ca' : '#ffffff'} />
            {s.sky === 'storm' && <Cloud x={340} y={60} s={1.1} d={5} tone="#98a3b8" />}
          </g>
        )}
        {extras.has('birds') && <Birds />}
        {extras.has('balloon') && <Balloon />}
        {extras.has('lanterns') && <Lanterns />}
        {extras.has('rays') && <Rays />}
        <Ground type={s.ground} />
        {extras.has('trees') && s.ground !== 'forest' && (
          <g>
            <Tree x={46} y={236} s={0.8} snow={s.ground === 'snow'} />
            <Tree x={350} y={240} s={0.9} snow={s.ground === 'snow'} />
          </g>
        )}
        {extras.has('flowers') && <Flowers />}
        {extras.has('boat') && <Boat />}
        {extras.has('campfire') && <Campfire />}
        <Character spec={s.friend} />
        <Character spec={s.hero} />
        {extras.has('fish') && <Fish />}
        {extras.has('bubbles') && <Bubbles />}
        {extras.has('fireflies') && <Fireflies />}
        {extras.has('butterflies') && <Butterflies />}
        {extras.has('leaves') && <Leaves />}
        {extras.has('sparkles') && <Sparkles />}
        {extras.has('fog') && <Fog />}
        {extras.has('snow') && <Snow />}
        {extras.has('rain') && <Rain />}
        {night && <rect x="-40" y="-30" width="480" height="360" fill="#0a1030" opacity="0.08" />}
      </g>
    </svg>
  );
}
