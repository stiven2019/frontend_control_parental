// Musica de cuna instrumental generada con Web Audio (sin archivos de audio ni dependencias).
// Cada cuento tiene su propia melodia original, en registro grave y timbres calidos
// (piano de fieltro, arpa, kalimba, flauta suave y chelo). Solo arranca tras un gesto del usuario.

const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midi = (name) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  return 12 * (Number(m[2]) + 1) + NOTE_INDEX[m[1]];
};
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

const CHORD_SHAPES = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus2: [0, 2, 7], sus4: [0, 5, 7] };

/** Convierte 'Am' en { bass, tones } (midi). Bajo en octava 2, acorde en octava 3. */
export function parseChord(name) {
  const m = /^([A-G][#b]?)(m7|maj7|sus2|sus4|m|7)?$/.exec(name);
  if (!m) throw new Error(`Acorde invalido: ${name}`);
  const pc = NOTE_INDEX[m[1]];
  const shape = CHORD_SHAPES[m[2] || ''];
  return { bass: 36 + pc, tones: shape.map((i) => 48 + pc + i) };
}

/** Convierte 'E4/2 G4 - A4/.5' en [{ midi|null, beats }]. */
export function parseMelody(src) {
  return src.split(/[\s|]+/).filter(Boolean).map((tok) => {
    const [n, d] = tok.split('/');
    return { midi: n === '-' ? null : midi(n), beats: d ? Number(d) : 1 };
  });
}

// lead: timbre de la melodia. acc: acompanamiento ('pad' solo colchon, 'sway' vals/pulso, 'arp' arpegio).
// Las secciones A y B se encadenan como A-B-A y la musica se repite sin cortes.
const T = (o) => o;
export const TUNES = {
  luna: T({
    bpm: 58, bpb: 3, lead: 'felt', acc: 'sway', gain: 0.9,
    chordsA: 'C Am F G C Am F G', melA: 'E4/2 G4|A4/2 G4|F4/2 A4|G4/3|E4/2 D4|C4/2 E4|A4 G4 F4|D4/3',
    chordsB: 'F C Dm Am F C G C', melB: 'F4/2 A4|G4/2 E4|F4/2 D4|E4/2 C4|A4/2 G4|E4 G4 E4|D4/2 F4|E4/3',
  }),
  bosque: T({
    bpm: 56, bpb: 4, lead: 'cello', acc: 'arp', gain: 0.85,
    chordsA: 'G Em C D G Em C D', melA: 'D4/2 B3 D4|E4/2 D4 B3|G3 C4 E4/2|D4/3 -|B3 D4 G4/2|E4/2 B3/2|C4 D4 E4 D4|D4/4',
    chordsB: 'C G Am D C G D G', melB: 'E4/2 G4/2|G4/2 D4/2|C4 E4 A4/2|F#4/2 E4 D4|E4/2 G4 E4|D4 G4 F#4 D4|E4/2 F#4 A3|G3/4',
  }),
  mar: T({
    bpm: 54, bpb: 3, lead: 'flute', acc: 'arp', gain: 0.85,
    chordsA: 'F Dm Bb C F Dm Bb C', melA: 'F4/2 A4|A4 G4 F4|D4/2 F4|G4/2 E4|F4 A4/2|A4 F4 D4|D4 F4 A4|G4/2 E4',
    chordsB: 'Gm C F Dm Gm C F F', melB: 'Bb4/2 A4|G4/2 E4|F4 A4 F4|D4/2 F4|G4/2 Bb4|G4 E4 C4|A4/2 G4|F4/3',
  }),
  estrellas: T({
    bpm: 60, bpb: 4, lead: 'kalimba', acc: 'pad', gain: 0.95,
    chordsA: 'D Bm G A D Bm G A', melA: 'D4 F#4 A4/2|B4 A4 F#4/2|G4 B4 A4 G4|F#4/2 E4/2|D4 F#4 A4/2|B4/2 A4 F#4|G4 F#4 E4 D4|E4/2 C#4/2',
    chordsB: 'G D Em A G D A D', melB: 'B4/2 G4/2|A4/2 F#4/2|G4 E4 G4 B4|A4/2 E4/2|B4 A4 G4/2|F#4/2 D4/2|E4 F#4 E4 C#4|D4/4',
  }),
  zorro: T({
    bpm: 64, bpb: 3, lead: 'kalimba', acc: 'arp', gain: 0.95,
    chordsA: 'Em C G D Em C D Em', melA: 'B3 E4 G4|E4 G4 E4|D4 G4 B4|A4/2 F#4|G4 B4 G4|E4/2 C4|F#4 A4 F#4|E4/3',
    chordsB: 'C G Am Em C G D Em', melB: 'G4/2 E4|D4 G4 B4|A4/2 E4|G4/2 B3|E4 G4 C5|B4/2 G4|A4 F#4 D4|E4/3',
  }),
  lluvia: T({
    bpm: 50, bpb: 4, lead: 'felt', acc: 'pad', gain: 1,
    chordsA: 'Am F C G Am F Dm E', melA: 'E4/2 C4 A3|C4 F4/2 A3|E4/2 G4 E4|D4/2 B3 G3|A3 C4 E4/2|F4/2 A4 F4|D4/2 F4 A3|E4/2 G#4 B3',
    chordsB: 'F C G Am F C E Am', melB: 'A4/2 F4/2|G4/2 E4/2|D4 G4 B4/2|A4/2 E4/2|F4 A4/2 F4|E4/2 C4/2|B3 E4 G#4 B4|A3/4',
  }),
  oceano: T({
    bpm: 46, bpb: 4, lead: 'cello', acc: 'pad', gain: 0.9,
    chordsA: 'Eb Cm Ab Bb Eb Cm Ab Bb', melA: 'G3/2 Bb3/2|C4/2 G3/2|Eb4/2 C4/2|D4/2 Bb3/2|G3/2 Bb3 Eb4|G4/2 Eb4/2|F4/2 C4/2|Bb3/4',
    chordsB: 'Ab Eb Fm Bb Ab Eb Bb Eb', melB: 'C4/2 Eb4/2|Eb4/2 G4/2|F4/2 Ab4/2|F4/2 D4/2|Eb4/2 C4/2|G3/2 Bb3/2|D4/2 F4/2|Eb4/4',
  }),
  jardin: T({
    bpm: 66, bpb: 3, lead: 'harp', acc: 'sway', gain: 0.95,
    chordsA: 'G D Em C G D C D', melA: 'B3 D4 G4|F#4/2 D4|E4 G4 B4|G4/2 E4|D4 G4 B4|A4/2 F#4|G4 E4 C4|D4/3',
    chordsB: 'Em Bm C G Em Am D G', melB: 'G4/2 E4|F#4 D4 B3|E4/2 G4|D4 B3 G3|E4 B4 G4|A4 E4 C4|F#4 A4 F#4|G4/3',
  }),
  aurora: T({
    bpm: 52, bpb: 4, lead: 'flute', acc: 'arp', gain: 0.85,
    chordsA: 'Dm G Dm C Dm G C Dm', melA: 'D4/2 F4 A4|G4/2 B4/2|A4/2 F4 D4|E4/2 G4/2|F4 A4 G4 F4|D4/2 B3/2|E4/2 C4/2|D4/4',
    chordsB: 'F C Dm Am F C G Dm', melB: 'A4/2 F4/2|G4/2 E4/2|F4/2 D4/2|E4/2 C4/2|F4/2 A4 C5|G4/2 E4/2|D4/2 B3/2|D4/4',
  }),
  fogata: T({
    bpm: 60, bpb: 3, lead: 'cello', acc: 'sway', gain: 0.85,
    chordsA: 'Am Dm Am E Am Dm E Am', melA: 'A3/2 C4|D4/2 F4|E4/2 C4|B3 G#3 B3|A3 C4 E4|F4/2 D4|B3/2 G#3|A3/3',
    chordsB: 'C G Am Em F C E Am', melB: 'E4/2 G4|D4/2 B3|C4/2 E4|G4/2 E4|A4/2 F4|G4/2 E4|G#4/2 B3|A3/3',
  }),
  globo: T({
    bpm: 62, bpb: 4, lead: 'felt', acc: 'arp', gain: 1,
    chordsA: 'C F Am G C F G C', melA: 'C4 E4 G4/2|A4/2 G4 F4|E4 C4 E4/2|D4/2 B3/2|C4 E4 G4 E4|F4/2 A4/2|G4 F4 D4/2|C4/4',
    chordsB: 'Am Dm G C Am F G C', melB: 'E4/2 C4/2|F4/2 D4/2|D4 G4 B4/2|G4/2 E4/2|A4 G4 E4/2|F4/2 A4/2|B3/2 D4/2|E4/2 C4/2',
  }),
  arcoiris: T({
    bpm: 68, bpb: 3, lead: 'harp', acc: 'sway', gain: 0.95,
    chordsA: 'D G A D Bm G A D', melA: 'F#4 A4 F#4|G4/2 B3|E4/2 C#4|D4/3|D4 F#4 B4|G4 B4 G4|E4 A4 E4|F#4/3',
    chordsB: 'Bm G D A Bm G A D', melB: 'B3 D4 F#4|G4/2 B3|A4 F#4 D4|E4/2 C#4|D4 F#4 B4|B4/2 G4|A4/2 E4|D4/3',
  }),
  estanque: T({
    bpm: 58, bpb: 4, lead: 'kalimba', acc: 'sway', gain: 0.95,
    chordsA: 'G C G D G C D G', melA: 'G3 B3 D4/2|E4/2 G4 E4|D4/2 B3/2|A3 D4 F#4/2|G4 D4 B3 D4|E4/2 C4/2|D4 F#4 A4/2|G4/4',
    chordsB: 'Em Am C D Em C D G', melB: 'G4/2 E4/2|C4 E4 A4/2|G4 E4 C4/2|F#4/2 A4/2|B4/2 G4/2|G4 E4 C4/2|D4/2 F#4 A3|B3/2 G3/2',
  }),
  suenos: T({
    bpm: 56, bpb: 3, lead: 'flute', acc: 'sway', gain: 0.85,
    chordsA: 'A E F#m D A E D A', melA: 'E4/2 A4|G#4/2 E4|F#4/2 A4|D4/2 F#4|C#4 E4 A4|G#4/2 B3|A4 F#4 D4|C#4/3',
    chordsB: 'D A E F#m D A E A', melB: 'F#4/2 A4|E4/2 C#4|B3 E4 G#4|F#4/2 C#4|A4 F#4 D4|C#4 E4 A4|G#4/2 B3|A3/3',
  }),
};

export const TUNE_KEYS = Object.keys(TUNES);

/** Expande una melodia en eventos { t (pulsos), kind, ... } para un ciclo completo A-B-A. */
export function buildEvents(tune) {
  const A = parseMelody(tune.melA);
  const B = parseMelody(tune.melB);
  const chordsA = tune.chordsA.split(/\s+/).map(parseChord);
  const chordsB = tune.chordsB.split(/\s+/).map(parseChord);
  const sections = [
    { mel: A, chords: chordsA },
    { mel: B, chords: chordsB },
    { mel: A, chords: chordsA },
  ];
  const events = [];
  let base = 0;
  sections.forEach(({ mel, chords }) => {
    let t = base;
    mel.forEach((n) => {
      if (n.midi != null) events.push({ t, kind: 'lead', midi: n.midi, dur: n.beats });
      t += n.beats;
    });
    const total = t - base;
    chords.forEach((c, i) => {
      const bt = base + i * tune.bpb;
      events.push({ t: bt, kind: 'pad', tones: [c.bass, ...c.tones.slice(0, 3)], dur: tune.bpb * 1.04 });
      const [r, th, fi] = [c.tones[0], c.tones[1], c.tones[2]];
      if (tune.acc === 'sway') {
        events.push({ t: bt, kind: 'bass', midi: c.bass, dur: 1 });
        for (let b = 1; b < tune.bpb; b += 1) events.push({ t: bt + b, kind: 'acc', midi: b % 2 ? th : fi, dur: 1, vel: 0.5 });
      } else if (tune.acc === 'arp') {
        const seq = [r, fi, th + 12, fi, r + 12, fi, th + 12, fi].slice(0, tune.bpb * 2);
        seq.forEach((m, k) => events.push({ t: bt + k * 0.5, kind: 'acc', midi: m, dur: 0.5, vel: 0.42 }));
      }
    });
    base += total;
  });
  events.sort((a, b) => a.t - b.t);
  return { events, length: base };
}

export class LullabyPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bus = null;
    this.timer = null;
    this.tune = null;
    this.built = null;
    this.volume = 0.5;
    this.playing = false;
    this.idx = 0;
    this.loopStart = 0;
  }

  _impulse(seconds = 2.6) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c += 1) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
    }
    return buf;
  }

  _ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;

    // Calidez: recorta agudos. Compresor suave para que nada sobresalga.
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 1900;
    warm.Q.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;

    // Reverberacion de sala con respuesta generada
    const conv = ctx.createConvolver();
    conv.buffer = this._impulse();
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    const verbTone = ctx.createBiquadFilter();
    verbTone.type = 'lowpass';
    verbTone.frequency.value = 1400;

    this.bus = ctx.createGain();
    this.bus.connect(warm);
    warm.connect(comp);
    warm.connect(verbTone);
    verbTone.connect(conv);
    conv.connect(wet);
    wet.connect(comp);
    comp.connect(this.master);
    this.master.connect(ctx.destination);
    return true;
  }

  _env(g, when, peak, attack, hold, release) {
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + attack);
    g.gain.setValueAtTime(Math.max(peak, 0.0002), when + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
  }

  _osc(type, f, when, end, dest, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(dest);
    o.start(when);
    o.stop(end);
    return o;
  }

  _voice(kind, m, when, durSec, vel = 1) {
    const ctx = this.ctx;
    const f = hz(m);
    const g = ctx.createGain();
    g.connect(this.bus);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.connect(g);
    if (kind === 'felt') {
      // Piano de fieltro: seno + triangulo muy filtrado, ataque suave, caida larga
      tone.frequency.setValueAtTime(900 + f, when);
      tone.frequency.exponentialRampToValueAtTime(420, when + 1.2);
      const end = when + 3.2;
      this._env(g, when, 0.34 * vel, 0.018, 0.02, 2.6);
      this._osc('sine', f, when, end, tone);
      const t2 = ctx.createGain(); t2.gain.value = 0.35; t2.connect(tone);
      this._osc('triangle', f, when, end, t2, 4);
      const t3 = ctx.createGain(); t3.gain.value = 0.08; t3.connect(tone);
      this._osc('sine', f * 2, when, when + 1.2, t3);
    } else if (kind === 'harp') {
      tone.frequency.setValueAtTime(1700, when);
      tone.frequency.exponentialRampToValueAtTime(380, when + 1.1);
      const end = when + 2.8;
      this._env(g, when, 0.3 * vel, 0.006, 0.0, 2.3);
      this._osc('triangle', f, when, end, tone);
      const t2 = ctx.createGain(); t2.gain.value = 0.18; t2.connect(tone);
      this._osc('sine', f * 2, when, when + 1.4, t2);
    } else if (kind === 'kalimba') {
      tone.frequency.value = 1600;
      const end = when + 2.4;
      this._env(g, when, 0.34 * vel, 0.004, 0.0, 1.9);
      this._osc('sine', f, when, end, tone);
      const bite = ctx.createGain(); bite.gain.value = 0.14; bite.connect(tone);
      const bg = ctx.createGain(); bg.connect(bite);
      this._env(bg, when, 1, 0.003, 0, 0.16);
      this._osc('sine', f * 5.4, when, when + 0.3, bg);
    } else if (kind === 'flute') {
      tone.frequency.value = 1500;
      const hold = Math.max(durSec * 0.9, 0.5);
      const end = when + 0.16 + hold + 0.7;
      this._env(g, when, 0.26 * vel, 0.16, hold, 0.6);
      const o = this._osc('sine', f, when, end, tone);
      const h2 = ctx.createGain(); h2.gain.value = 0.1; h2.connect(tone);
      const o2 = this._osc('sine', f * 2, when, end, h2);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.8;
      const lg = ctx.createGain(); lg.gain.value = f * 0.0045;
      lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      lfo.start(when + 0.25); lfo.stop(end);
    } else if (kind === 'cello') {
      tone.frequency.value = 620 + f * 0.6;
      tone.Q.value = 0.8;
      const hold = Math.max(durSec * 0.9, 0.6);
      const end = when + 0.3 + hold + 0.8;
      this._env(g, when, 0.22 * vel, 0.3, hold, 0.75);
      const o = this._osc('sawtooth', f, when, end, tone);
      const body = ctx.createGain(); body.gain.value = 0.9; body.connect(g);
      const o2 = this._osc('sine', f, when, end, body);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.4;
      const lg = ctx.createGain(); lg.gain.value = f * 0.0055;
      lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      lfo.start(when + 0.4); lfo.stop(end);
    } else {
      // bajo suave
      tone.frequency.value = 520;
      this._env(g, when, 0.34 * vel, 0.03, 0.1, 1.6);
      this._osc('sine', f, when, when + 2.2, tone);
    }
  }

  _pad(tones, when, dur) {
    tones.forEach((m, i) => {
      const g = this.ctx.createGain();
      g.connect(this.bus);
      const level = i === 0 ? 0.075 : 0.03;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(level, when + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, when + dur);
      this._osc('sine', hz(m), when, when + dur + 0.05, g, i * 3 - 3);
    });
  }

  _play(e, when, beat) {
    const t = this.tune;
    if (e.kind === 'lead') this._voice(t.lead, e.midi, when, e.dur * beat, t.gain);
    else if (e.kind === 'pad') this._pad(e.tones, when, e.dur * beat);
    else if (e.kind === 'bass') this._voice('bass', e.midi, when, beat, 0.9);
    else if (e.kind === 'acc') this._voice(t.acc === 'arp' ? 'harp' : 'felt', e.midi, when, e.dur * beat, e.vel);
  }

  _schedule() {
    const t = this.tune;
    const beat = 60 / t.bpm;
    const horizon = this.ctx.currentTime + 0.5;
    for (;;) {
      const e = this.built.events[this.idx];
      const when = this.loopStart + e.t * beat;
      if (when >= horizon) break;
      this._play(e, Math.max(when, this.ctx.currentTime), beat);
      this.idx += 1;
      if (this.idx >= this.built.events.length) {
        this.idx = 0;
        this.loopStart += this.built.length * beat;
      }
    }
  }

  async start(key) {
    if (!this._ensure()) return false;
    const tune = TUNES[key] || TUNES.luna;
    if (this.playing && this.tune === tune) return true;
    this._clear();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.tune = tune;
    this.built = buildEvents(tune);
    this.idx = 0;
    this.loopStart = this.ctx.currentTime + 0.2;
    this.playing = true;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.volume, now + 2);
    this.timer = setInterval(() => this._schedule(), 150);
    this._schedule();
    return true;
  }

  _clear() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  stop() {
    if (!this.ctx || !this.playing) return;
    this.playing = false;
    this._clear();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + 0.8);
  }

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.ctx && this.playing) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(this.volume, now + 0.25);
    }
  }

  /** Nota grave y breve al pasar de pagina (solo si la musica esta activa). */
  chime() {
    if (!this.ctx || !this.playing) return;
    const now = this.ctx.currentTime;
    this._voice('felt', 55, now + 0.02, 0.5, 0.5);
    this._voice('felt', 62, now + 0.16, 0.5, 0.4);
  }

  dispose() {
    this.stop();
    this._clear();
    if (this.ctx) {
      const ctx = this.ctx;
      setTimeout(() => ctx.close().catch(() => {}), 1000);
      this.ctx = null;
    }
  }
}
