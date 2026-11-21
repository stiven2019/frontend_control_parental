import { useEffect, useMemo, useRef, useState } from 'react';
import { referenceAt } from '../utils/fetalGrowth';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Etapas ilustradas (recortes de la lamina de desarrollo fetal): archivo, semana, titulo y descripcion.
const STAGES = [
  ['f01', 1, 'Fecundación', 'El óvulo y el espermatozoide se encuentran y se forma la primera célula.'],
  ['f02', 2, 'Mórula y blastocisto', 'La célula se divide una y otra vez hasta formar una pequeña esfera.'],
  ['f03', 3, 'Implantación', 'El embrión se acomoda en la pared del útero y empieza a nutrirse.'],
  ['f04', 4, 'Plan básico', 'Se define el eje del cuerpo y comienzan a organizarse las capas de tejidos.'],
  ['f05', 6, 'Tubo neural', 'Se forma el tubo neural, origen del cerebro y la médula espinal.'],
  ['f06', 8, 'Extremidades y corazón latiendo', 'Aparecen brazos y piernas y el corazón ya late con fuerza.'],
  ['f07', 9, 'Dedos', 'Las manos se separan y se dibujan los primeros deditos.'],
  ['f08', 10, 'Órganos formándose', 'Los órganos principales ya están en su lugar y siguen madurando.'],
  ['f09', 12, 'Dedos y uñas', 'Se definen los dedos de manos y pies y empiezan a crecer las uñas.'],
  ['f10', 14, 'Movimientos reflejos', 'Se mueve cada vez más, aunque todavía no se siente por fuera.'],
  ['f11', 16, 'Reflejo de succión', 'Practica la succión y los gestos de la cara.'],
  ['f12', 18, 'Primeros movimientos', 'Es común empezar a sentir las primeras pataditas.'],
  ['f13', 20, 'Desarrollo de la audición', 'El oído se desarrolla y reconoce los sonidos y tu voz.'],
  ['f14', 21, 'Rostro definiéndose', 'Los rasgos de la cara se vuelven más claros y expresivos.'],
  ['f15', 22, 'Crecimiento rápido', 'El oído externo ya está formado y el crecimiento se acelera.'],
  ['f16', 24, 'Pulmones madurando', 'Los pulmones desarrollan sus ramificaciones y se preparan para respirar.'],
  ['f17', 26, 'Reacción a la luz', 'Los párpados reaccionan a la luz que atraviesa tu abdomen.'],
  ['f18', 28, 'Ojos que se abren', 'Los ojos se abren y puede parpadear.'],
  ['f19', 30, 'Vello fino', 'Una capa de vello fino (lanugo) cubre la piel.'],
  ['f20', 32, 'Capa de grasa', 'Empieza a acumular grasa bajo la piel y se ve más redondito.'],
  ['f21', 33, 'Hipo', 'Puedes notar pequeños movimientos rítmicos: son sus hipos.'],
  ['f22', 34, 'Crecimiento acelerado', 'Gana peso rápidamente y los huesos se fortalecen.'],
  ['f23', 35, 'Desarrollo cerebral', 'El cerebro crece y forma muchas conexiones nuevas.'],
  ['f24', 36, 'Posición para el parto', 'Muchos bebés ya se colocan con la cabeza hacia abajo.'],
  ['f25', 37, 'Acomodarse', 'Se acomoda y tiene menos espacio para moverse.'],
  ['f26', 38, 'Descenso a la pelvis', 'La cabeza baja hacia la pelvis, lista para el nacimiento.'],
  ['f27', 39, 'Desarrollo final', 'Termina de madurar sus órganos y gana los últimos gramos.'],
  ['f28', 40, 'Listo para nacer', 'Tu bebé está completamente formado y listo para conocerte.'],
];

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const src = (i) => `${BASE}fetal/${STAGES[i][0]}.webp`;

function stageAt(w) {
  let i = 0;
  STAGES.forEach((st, k) => { if (w >= st[1]) i = k; });
  const next = STAGES[i + 1];
  const t = next ? clamp((w - STAGES[i][1]) / (next[1] - STAGES[i][1]), 0, 1) : 0;
  return { i, t };
}

// Partes del cuerpo que se pueden tocar: desde que semana se forman y que ocurre en cada etapa.
const PARTS = [
  {
    id: 'cerebro', label: 'Cerebro', from: 4,
    stages: [
      [4, 'Se forma el tubo neural, el origen del cerebro y de la médula espinal.'],
      [8, 'El cerebro crece muy rápido y comienza a coordinar los primeros movimientos.'],
      [16, 'Aparecen los surcos y las zonas que controlan los sentidos.'],
      [28, 'La actividad cerebral aumenta y se marcan ciclos de sueño y vigilia.'],
      [36, 'Sigue madurando; gran parte de su volumen se ganará después de nacer.'],
    ],
  },
  {
    id: 'corazon', label: 'Corazón', from: 6,
    stages: [
      [6, 'El corazón comienza a latir de forma regular.'],
      [10, 'Ya tiene sus cuatro cavidades y bombea sangre a todo el cuerpo.'],
      [20, 'Su latido ya puede escucharse con estetoscopio.'],
      [32, 'Late entre 120 y 160 veces por minuto, el doble que el tuyo.'],
    ],
  },
  {
    id: 'pulmones', label: 'Pulmones', from: 8,
    stages: [
      [8, 'Se forman los bronquios, las ramas por donde luego pasará el aire.'],
      [16, 'Practica movimientos de respiración con el líquido amniótico.'],
      [24, 'Se forman los alvéolos y empieza a producir surfactante.'],
      [36, 'Los pulmones están casi listos para respirar aire.'],
    ],
  },
  {
    id: 'ojos', label: 'Ojos', from: 6,
    stages: [
      [6, 'Se marcan las primeras estructuras del ojo a los lados de la cabeza.'],
      [10, 'Se forman los párpados, que permanecen cerrados un buen tiempo.'],
      [26, 'Puede abrir y cerrar los ojos.'],
      [32, 'Distingue la luz y la sombra a través de la pared de tu abdomen.'],
    ],
  },
  {
    id: 'manos', label: 'Manos y pies', from: 6,
    stages: [
      [6, 'Manos y pies aparecen como pequeños brotes.'],
      [8, 'Se separan los dedos de manos y pies.'],
      [12, 'Puede cerrar el puño y abrir la mano.'],
      [18, 'Las huellas dactilares ya están formadas.'],
      [30, 'Agarra con fuerza y juega con el cordón.'],
    ],
  },
  {
    id: 'huesos', label: 'Huesos', from: 8,
    stages: [
      [8, 'El cartílago empieza a convertirse en hueso.'],
      [16, 'El esqueleto se va endureciendo.'],
      [28, 'Los huesos se fortalecen y almacenan calcio.'],
      [38, 'Los huesos del cráneo permanecen flexibles para facilitar el parto.'],
    ],
  },
];

function stageText(part, week) {
  let text = null;
  part.stages.forEach(([from, t]) => {
    if (week >= from) text = t;
  });
  return text;
}

const DAYS_MIN = 7;
const DAYS_MAX = 287;

export default function FetusViewer({ week, onWeekChange, currentWeek, currentDays, sizeLabel }) {
  const [dayOff, setDayOff] = useState(() => (
    currentDays && currentWeek === week ? clamp(Math.round(currentDays) - week * 7, 0, 6) : 0
  ));
  const gDays = clamp(week * 7 + dayOff, DAYS_MIN, DAYS_MAX);
  const [shown, setShown] = useState(gDays / 7);
  const [part, setPart] = useState(null);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(null);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const strip = useRef(null);
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const anim = !reduceMotion;

  // Precarga todas las imagenes para que el cambio sea fluido
  useEffect(() => {
    STAGES.forEach((_, i) => { const im = new Image(); im.src = src(i); });
  }, []);

  const setDays = (g) => {
    const c = clamp(Math.round(g), DAYS_MIN, DAYS_MAX);
    setDayOff(c % 7);
    onWeekChange(Math.floor(c / 7));
  };

  // Transicion suave entre dias/semanas
  useEffect(() => {
    const to = gDays / 7;
    if (reduceMotion) { setShown(to); return undefined; }
    const from = shownRef.current;
    if (Math.abs(from - to) < 0.0005) return undefined;
    const start = performance.now();
    const dur = 600;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      setShown(from + (to - from) * (t * t * (3 - 2 * t)));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [gDays, reduceMotion]);

  // Reproduccion dia a dia hasta hoy
  const gRef = useRef(gDays);
  gRef.current = gDays;
  useEffect(() => {
    if (!playing) return undefined;
    const limit = currentDays ? Math.min(Math.round(currentDays), DAYS_MAX) : (currentWeek ? currentWeek * 7 : DAYS_MAX);
    const id = setInterval(() => {
      const next = gRef.current + 2;
      if (next >= limit) { setPlaying(false); setDays(limit); return; }
      setDays(next);
    }, 130);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, currentWeek, currentDays]);

  const { i: si, t } = stageAt(shown);
  const hasNext = si + 1 < STAGES.length;
  const mix = hasNext ? smooth(0.5, 1, t) : 0;
  const wk = Math.floor(shown);
  const stage = STAGES[si];
  const g = gDays;
  const rd = Math.round(g) % 7;
  const dayLabel = `Semana ${Math.floor(g / 7)}${rd ? ` + ${rd} día${rd === 1 ? '' : 's'}` : ''}`;
  const sceneRef = referenceAt(shown);
  const selected = PARTS.find((p) => p.id === part) || null;
  const formed = selected ? wk >= selected.from : false;
  const text = selected ? stageText(selected, wk) : null;
  const zoom = 1 + 0.07 * t;

  const bubbles = useMemo(() => Array.from({ length: 10 }, (_, k) => ({
    x: 6 + ((k * 37) % 88), r: 3 + (k % 4) * 2, d: 7 + (k % 5) * 1.6, delay: -k * 1.4,
  })), []);

  // Mantiene visible la miniatura activa dentro de la tira (sin mover la pagina)
  useEffect(() => {
    const el = strip.current && strip.current.children[si];
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2, behavior: anim ? 'smooth' : 'auto' });
  }, [si, anim]);

  return (
    <section className="card mb-6 overflow-hidden" aria-label="Desarrollo interactivo del bebé">
      <style>{`
        @keyframes fv-kb { 0% { transform: scale(1) translate(0,0); } 50% { transform: scale(1.06) translate(-1.2%,-1%); } 100% { transform: scale(1) translate(0,0); } }
        @keyframes fv-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes fv-sweep { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(260%) skewX(-18deg); } }
        @keyframes fv-rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .65; } 100% { transform: translateY(-340px); opacity: 0; } }
        @keyframes fv-beat { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.5); opacity: .35; } }
        @keyframes fv-in { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fv-glow { 0%,100% { opacity: .35; } 50% { opacity: .6; } }
        .fv-strip { scrollbar-width: none; }
        .fv-strip::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .fv-anim { animation: none !important; } }
      `}</style>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Así se forma tu bebé</p>
          <h2 className="font-display text-xl font-semibold">{dayLabel}</h2>
        </div>
        <button
          type="button"
          onClick={() => { if (!playing) setDays(DAYS_MIN); setPlaying((p) => !p); }}
          className="pill-chip bg-primary-container text-on-primary-container hover:opacity-80 shrink-0"
          aria-pressed={playing}
        >
          {playing ? 'Pausar' : 'Ver crecer'}
        </button>
      </div>

      <div className="relative rounded-[28px] overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 40%, #1d5b82 0%, #123a55 60%, #0c2a40 100%)' }}>
        <div className="relative w-full" style={{ aspectRatio: '516 / 500', maxHeight: 420 }}>
          {/* Imagen con movimiento suave: zoom lento + flotacion */}
          <div className="absolute inset-0 fv-anim" style={anim ? { animation: 'fv-float 6s ease-in-out infinite' } : undefined}>
            <div className="absolute inset-0 fv-anim" style={{ transform: `scale(${zoom})`, ...(anim ? {} : {}) }}>
              <div className="absolute inset-0 fv-anim" style={anim ? { animation: 'fv-kb 16s ease-in-out infinite' } : undefined}>
                <img src={src(si)} alt="" className="absolute inset-0 w-full h-full object-cover" draggable="false"
                  style={{ opacity: 1 - mix, filter: `saturate(${1 + 0.05 * Math.sin(shown)})` }} />
                {hasNext && (
                  <img src={src(si + 1)} alt="" className="absolute inset-0 w-full h-full object-cover" draggable="false" style={{ opacity: mix }} />
                )}
              </div>
            </div>
          </div>

          {/* Luz que recorre la imagen */}
          {anim && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 bottom-0 w-1/4 fv-anim" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)', animation: 'fv-sweep 7.5s ease-in-out infinite' }} />
            </div>
          )}

          {/* Burbujas del liquido amniotico */}
          {anim && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {bubbles.map((b, k) => (
                <span key={k} className="absolute fv-anim rounded-full" style={{
                  left: `${b.x}%`, bottom: -10, width: b.r * 2, height: b.r * 2,
                  background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.9), rgba(255,255,255,.15))',
                  border: '1px solid rgba(255,255,255,.4)', animation: `fv-rise ${b.d}s linear ${b.delay}s infinite`,
                }} />
              ))}
            </div>
          )}

          {/* Vineta suave */}
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 70px 18px rgba(8,28,45,.55)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,28,45,.7), transparent)' }} />

          {/* Titulo de la etapa */}
          <div key={si} className="absolute left-3 top-3 fv-anim" style={{ right: wk >= 6 ? 104 : 12, ...(anim ? { animation: 'fv-in .6s ease-out both' } : {}) }}>
            <span className="inline-block max-w-full truncate px-3 py-1.5 rounded-full text-[12px] font-body font-semibold text-white" style={{ background: 'rgba(8,28,45,.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.25)' }}>
              {stage[2]}
            </span>
          </div>

          {/* Latido */}
          {wk >= 6 && (
            <div className="absolute right-3 top-3 flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] font-body font-semibold text-white" style={{ background: 'rgba(8,28,45,.55)', border: '1px solid rgba(255,255,255,.25)' }}>
              <span className="relative inline-flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-rose-400 fv-anim" style={anim ? { animation: 'fv-beat 1s ease-in-out infinite' } : undefined} />
                <span className="relative w-2.5 h-2.5 rounded-full bg-rose-400" />
              </span>
              Latiendo
            </div>
          )}

          {/* Datos */}
          <div className="absolute left-3 bottom-3 right-3 flex flex-wrap items-center gap-2 text-[11px] font-body font-semibold">
            {sizeLabel && <span className="px-2.5 py-1 rounded-full bg-white/90 text-on-surface">Del tamaño de {sizeLabel}</span>}
            <span className="px-2.5 py-1 rounded-full bg-white/90 text-on-surface">{Math.round(sceneRef.lengthCm * 10) / 10} cm</span>
            <span className="px-2.5 py-1 rounded-full bg-white/90 text-on-surface">{Math.round(sceneRef.weightG)} g</span>
          </div>
        </div>
      </div>

      <p key={`t${si}`} className="font-body text-sm text-on-surface mt-3 fv-anim" style={anim ? { animation: 'fv-in .6s ease-out both' } : undefined} aria-live="polite">
        <span className="font-semibold">{stage[2]}.</span> {stage[3]}
      </p>

      {/* Control por semana y por dia */}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => { setPlaying(false); setDays(Math.max(DAYS_MIN, g - 7)); }} disabled={g <= DAYS_MIN}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg disabled:opacity-40" aria-label="Semana anterior">‹</button>
        <input
          type="range" min={DAYS_MIN} max={DAYS_MAX} step="1" value={g}
          onChange={(e) => { setPlaying(false); setDays(Number(e.target.value)); }}
          className="flex-1 accent-[var(--color-primary,#c0566b)]"
          aria-label="Día de gestación" aria-valuetext={dayLabel}
        />
        <button type="button" onClick={() => { setPlaying(false); setDays(Math.min(DAYS_MAX, g + 7)); }} disabled={g >= DAYS_MAX}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg disabled:opacity-40" aria-label="Semana siguiente">›</button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold">
        <button type="button" onClick={() => { setPlaying(false); setDays(g - 1); }} disabled={g <= DAYS_MIN} className="text-on-surface-variant hover:text-primary disabled:opacity-40">− 1 día</button>
        {(currentDays || currentWeek) ? (
          <button type="button" onClick={() => { setPlaying(false); setDays(currentDays ? Math.round(currentDays) : currentWeek * 7); }} className="text-primary underline-offset-2 hover:underline">
            Volver a hoy
          </button>
        ) : null}
        <button type="button" onClick={() => { setPlaying(false); setDays(g + 1); }} disabled={g >= DAYS_MAX} className="text-on-surface-variant hover:text-primary disabled:opacity-40">+ 1 día</button>
      </div>

      {/* Tira de etapas */}
      <div ref={strip} className="fv-strip mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Etapas del desarrollo">
        {STAGES.map((st, k) => (
          <button
            key={st[0]} type="button"
            onClick={() => { setPlaying(false); setDays(st[1] * 7); }}
            aria-label={`Semana ${st[1]}: ${st[2]}`} aria-pressed={k === si}
            className={`relative shrink-0 w-[64px] rounded-xl overflow-hidden transition-all ${k === si ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'}`}
          >
            <img src={src(k)} alt="" loading="lazy" className="w-full h-[62px] object-cover block" draggable="false" />
            <span className="absolute left-0 right-0 bottom-0 text-[10px] font-semibold text-white text-center py-0.5" style={{ background: 'rgba(8,28,45,.65)' }}>S{st[1]}</span>
          </button>
        ))}
      </div>

      {/* Partes */}
      <p className="font-body text-xs text-on-surface-variant mt-4 mb-2">Toca una parte para saber qué pasa en esta semana:</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Partes del cuerpo">
        {PARTS.map((p) => (
          <button
            key={p.id} type="button"
            onClick={() => setPart((cur) => (cur === p.id ? null : p.id))}
            aria-pressed={part === p.id}
            className={`pill-chip ${part === p.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'} ${wk < p.from ? 'opacity-50' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 rounded-2xl bg-surface-container p-3 font-body text-sm text-on-surface" aria-live="polite">
          <p className="font-semibold mb-0.5">{selected.label}</p>
          {formed ? text : `Aún no se forma en la semana ${wk}. Empieza alrededor de la semana ${selected.from}.`}
        </div>
      )}
    </section>
  );
}
