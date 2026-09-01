// Motor de síntesis de audio para alarmas sonoras con Web Audio API
// No requiere archivos de audio externos y funciona de forma nativa en navegadores modernos.

let audioCtx = null;
let currentLoopTimer = null;
let isLooping = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

export const TONES = [
  {
    id: 'chime_suave',
    name: 'Campanilla Suave',
    description: 'Chime cristalino y relajante',
  },
  {
    id: 'melodia_bebe',
    name: 'Melodía de Cuna',
    description: 'Arpegio dulce y maternal',
  },
  {
    id: 'arpa_serena',
    name: 'Arpa Serena',
    description: 'Secuencia armónica delicada',
  },
  {
    id: 'alarma_amable',
    name: 'Alarma Amable',
    description: 'Doble tono suave y claro',
  },
];

// Generador de tono individual con ataque y decaimiento suave (envolvente ADSR)
function playTone({ freq, type = 'sine', duration = 0.5, delay = 0, volume = 0.5 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Envolvente de volumen suave para que no suene estridente
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// Reproduce la melodía seleccionada según el tono
export function playMelody(toneId = 'chime_suave', volume = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const vol = Math.max(0.05, Math.min(volume, 1.0));

  switch (toneId) {
    case 'melodia_bebe': {
      // Notas: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz), B5 (987Hz)
      const notes = [
        { freq: 659.25, delay: 0.0, dur: 0.55 },
        { freq: 830.61, delay: 0.22, dur: 0.55 },
        { freq: 987.77, delay: 0.44, dur: 0.65 },
        { freq: 1318.51, delay: 0.68, dur: 1.1 },
        { freq: 987.77, delay: 1.15, dur: 0.9 },
      ];
      notes.forEach((n) => {
        playTone({ freq: n.freq, type: 'triangle', duration: n.dur, delay: n.delay, volume: vol * 0.7 });
        // Armónico sutil
        playTone({ freq: n.freq * 2, type: 'sine', duration: n.dur * 0.7, delay: n.delay, volume: vol * 0.2 });
      });
      break;
    }

    case 'arpa_serena': {
      // Secuencia arpegiada: F5 (698Hz), A5 (880Hz), C6 (1046Hz), E6 (1318Hz)
      const notes = [
        { freq: 698.46, delay: 0.0, dur: 0.6 },
        { freq: 880.00, delay: 0.18, dur: 0.6 },
        { freq: 1046.50, delay: 0.36, dur: 0.7 },
        { freq: 1318.51, delay: 0.54, dur: 1.2 },
      ];
      notes.forEach((n) => {
        playTone({ freq: n.freq, type: 'sine', duration: n.dur, delay: n.delay, volume: vol * 0.6 });
        playTone({ freq: n.freq * 0.5, type: 'triangle', duration: n.dur, delay: n.delay, volume: vol * 0.25 });
      });
      break;
    }

    case 'alarma_amable': {
      // Pulso rítmico: C6 (1046Hz) - E6 (1318Hz) repitiendo
      const notes = [
        { freq: 1046.50, delay: 0.0, dur: 0.3 },
        { freq: 1318.51, delay: 0.2, dur: 0.4 },
        { freq: 1046.50, delay: 0.5, dur: 0.3 },
        { freq: 1318.51, delay: 0.7, dur: 0.6 },
      ];
      notes.forEach((n) => {
        playTone({ freq: n.freq, type: 'sine', duration: n.dur, delay: n.delay, volume: vol * 0.75 });
      });
      break;
    }

    case 'chime_suave':
    default: {
      // Campanilla dulce: C5 (523Hz), G5 (784Hz), C6 (1046Hz), G6 (1568Hz)
      const notes = [
        { freq: 523.25, delay: 0.0, dur: 0.6 },
        { freq: 783.99, delay: 0.18, dur: 0.6 },
        { freq: 1046.50, delay: 0.36, dur: 0.8 },
        { freq: 1567.98, delay: 0.58, dur: 1.4 },
      ];
      notes.forEach((n) => {
        playTone({ freq: n.freq, type: 'sine', duration: n.dur, delay: n.delay, volume: vol * 0.8 });
        // Resonancia suave
        playTone({ freq: n.freq * 1.5, type: 'sine', duration: n.dur * 0.5, delay: n.delay, volume: vol * 0.15 });
      });
      break;
    }
  }
}

// Inicia un bucle continuo de alarma hasta que se llame a stopAlarmLoop
export function startAlarmLoop(toneId = 'chime_suave', volume = 0.8, intervalMs = 3200) {
  stopAlarmLoop();
  isLooping = true;

  const ring = () => {
    if (!isLooping) return;
    playMelody(toneId, volume);
    // Vibración en dispositivos móviles soportados
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {
        // Ignorar si no está permitido
      }
    }
    currentLoopTimer = setTimeout(ring, intervalMs);
  };

  ring();
}

// Detiene la alarma sonora en bucle
export function stopAlarmLoop() {
  isLooping = false;
  if (currentLoopTimer) {
    clearTimeout(currentLoopTimer);
    currentLoopTimer = null;
  }
}

// Prueba rápida de sonido
export function testAlarmSound(toneId = 'chime_suave', volume = 0.8) {
  stopAlarmLoop();
  playMelody(toneId, volume);
}
