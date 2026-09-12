// Motor de síntesis de audio para alarmas sonoras con Web Audio API y reproductor HTML5 de respaldo
// Funciona de forma 100% nativa y offline en navegadores modernos, incluso con la pestaña en segundo plano.

let audioCtx = null;
let currentLoopTimer = null;
let isLooping = false;
let bgAudioElement = null;

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
  if (ctx && ctx.state === 'suspended') {
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
        playTone({ freq: n.freq, type: 'triangle', duration: n.dur, delay: n.delay, volume: vol * 0.75 });
        playTone({ freq: n.freq * 2, type: 'sine', duration: n.dur * 0.7, delay: n.delay, volume: vol * 0.25 });
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
        playTone({ freq: n.freq, type: 'sine', duration: n.dur, delay: n.delay, volume: vol * 0.65 });
        playTone({ freq: n.freq * 0.5, type: 'triangle', duration: n.dur, delay: n.delay, volume: vol * 0.3 });
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
        playTone({ freq: n.freq, type: 'sine', duration: n.dur, delay: n.delay, volume: vol * 0.8 });
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
        playTone({ freq: n.freq * 2, type: 'sine', duration: n.dur * 0.6, delay: n.delay, volume: vol * 0.2 });
      });
      break;
    }
  }
}

// Generador de audio WAV en memoria para reproducción en segundo plano sin dependencias de red
function generateChimeWav(frequency = 659.25, duration = 1.2) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  buffer.set([82, 73, 70, 70], 0); // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer.set([87, 65, 86, 69], 8); // "WAVE"
  buffer.set([102, 109, 116, 32], 12); // "fmt "
  buffer.set([16, 0, 0, 0], 16);
  buffer.set([1, 0], 20); // PCM
  buffer.set([1, 0], 22); // Mono
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = sampleRate & 0xff;
  buffer[29] = (sampleRate >> 8) & 0xff;
  buffer[30] = (sampleRate >> 16) & 0xff;
  buffer[31] = (sampleRate >> 24) & 0xff;
  buffer.set([1, 0], 32);
  buffer.set([8, 0], 34); // 8-bit
  buffer.set([100, 97, 116, 97], 36); // "data"
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-2.5 * t);
    const sample = (Math.sin(2 * Math.PI * frequency * t) * 0.7 + Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3) * env;
    buffer[44 + i] = Math.floor((sample + 1) * 127.5);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

let cachedWavUri = null;

// Inicia un bucle continuo de alarma hasta que se llame a stopAlarmLoop
export function startAlarmLoop(toneId = 'chime_suave', volume = 0.8, intervalMs = 2800) {
  stopAlarmLoop();
  unlockAudio();
  isLooping = true;

  // Iniciar elemento HTML5 Audio para mantener el canal de audio del navegador abierto en segundo plano
  try {
    if (!cachedWavUri) {
      cachedWavUri = generateChimeWav(783.99, 1.2);
    }
    if (!bgAudioElement) {
      bgAudioElement = new Audio(cachedWavUri);
    }
    bgAudioElement.volume = Math.max(0.1, Math.min(volume, 1.0));
    bgAudioElement.loop = true;
    const playPromise = bgAudioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // En caso de que el navegador requiera gesto de usuario previo, Web Audio maneja el sonido
      });
    }
  } catch (e) {
    // Ignorar si no está permitido
  }

  const ring = () => {
    if (!isLooping) return;
    playMelody(toneId, volume);

    // Vibración en dispositivos móviles
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch (e) {
        // Ignorar
      }
    }
    currentLoopTimer = setTimeout(ring, intervalMs);
  };

  ring();
}

// Dispara un pulso sonoro individual (útil para ser llamado por el Web Worker)
export function playAlarmPulse(toneId = 'chime_suave', volume = 0.8) {
  unlockAudio();
  playMelody(toneId, volume);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([250, 100, 250]);
    } catch (e) {}
  }
}

// Detiene la alarma sonora en bucle
export function stopAlarmLoop() {
  isLooping = false;
  if (currentLoopTimer) {
    clearTimeout(currentLoopTimer);
    currentLoopTimer = null;
  }
  if (bgAudioElement) {
    try {
      bgAudioElement.pause();
      bgAudioElement.currentTime = 0;
    } catch (e) {}
  }
}

// Prueba rápida de sonido
export function testAlarmSound(toneId = 'chime_suave', volume = 0.8) {
  stopAlarmLoop();
  playMelody(toneId, volume);
}
