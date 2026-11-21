// Referencias de crecimiento fetal y estimaciones a partir de los controles registrados.
// Contenido educativo y aproximado: no sustituye la ecografia ni el criterio del medico.
import { FETAL_WEIGHT_PERCENTILES } from './healthEvaluations';
import { localDay } from './dates';

// Puntos de referencia (semana, peso g mediano, longitud cm). Semanas 4-10: valores promedio del desarrollo;
// semanas 12-42: tabla percentil 50 del motor de evaluacion.
const EARLY = [
  [4, 0, 0.2],
  [6, 0.1, 0.6],
  [8, 1, 1.6],
  [10, 4, 3.1],
];

const REF = [
  ...EARLY,
  ...Object.entries(FETAL_WEIGHT_PERCENTILES).map(([w, r]) => [Number(w), r.p50, r.lengthCm]),
].sort((a, b) => a[0] - b[0]);

function interp(week, col) {
  if (week <= REF[0][0]) return REF[0][col];
  const last = REF[REF.length - 1];
  if (week >= last[0]) return last[col];
  for (let i = 0; i < REF.length - 1; i += 1) {
    const a = REF[i];
    const b = REF[i + 1];
    if (week >= a[0] && week <= b[0]) {
      const t = (week - a[0]) / (b[0] - a[0]);
      return a[col] + (b[col] - a[col]) * t;
    }
  }
  return last[col];
}

// Peso y longitud de referencia (mediana) a una edad gestacional decimal
export function referenceAt(week) {
  return { weightG: interp(week, 1), lengthCm: interp(week, 2) };
}

// Edad gestacional (semanas decimales) cuyo peso mediano coincide con el peso dado
function weeksForWeight(weightG) {
  for (let i = 0; i < REF.length - 1; i += 1) {
    const a = REF[i];
    const b = REF[i + 1];
    if (weightG >= a[1] && weightG <= b[1] && b[1] > a[1]) {
      return a[0] + ((weightG - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
    }
  }
  return weightG < REF[0][1] ? REF[0][0] : REF[REF.length - 1][0];
}

function gestationalWeeksOn(lmp, dayStr) {
  const start = localDay(lmp);
  const day = localDay(dayStr);
  return (day.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000);
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round1 = (v) => Math.round(v * 10) / 10;

/**
 * Estimaciones a partir del ultimo control del bebe con peso y/o longitud:
 *  - se mide en que "carril" de crecimiento va el bebe respecto de la mediana (razon peso real / peso mediano),
 *  - ese carril se proyecta a la edad gestacional de hoy: peso y estatura aproximados,
 *  - la fecha probable de parto orientativa sale de la edad de crecimiento (limitada a +-14 dias).
 * Sin controles con datos, se devuelve la referencia de la semana (source: 'referencia').
 */
export function estimateFromControls({ controls = [], lmp, officialDueDate, today }) {
  const todayWeeks = lmp ? gestationalWeeksOn(lmp, today) : null;
  if (todayWeeks === null) return null;

  const valid = (c) => c && c.date;
  const sorted = controls.filter(valid).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  // Cada medida usa el control mas reciente que SI la registro: si un mes no se anoto el peso o la estatura,
  // se mantiene el ultimo dato conocido y sobre ese se sigue calculando.
  const lastWeightCtrl = sorted.find((c) => Number(c.fetalWeightG) > 0) || null;
  const lastLengthCtrl = sorted.find((c) => Number(c.fetalLengthCm) > 0) || null;

  const ref = referenceAt(todayWeeks);
  const base = {
    weeksToday: todayWeeks,
    source: 'referencia',
    weightG: Math.round(ref.weightG),
    lengthCm: round1(ref.lengthCm),
    dueDate: officialDueDate || null,
    dueShiftDays: 0,
    lastControlDate: null,
    lastWeightDate: null,
    lastLengthDate: null,
    lanePercent: null,
  };
  if (!lastWeightCtrl && !lastLengthCtrl) return base;

  const weeksAt = (c) => (Number(c.gestationalWeek) > 0 ? Number(c.gestationalWeek) : gestationalWeeksOn(lmp, c.date));

  const out = { ...base, source: 'controles' };
  if (lastWeightCtrl) {
    const refAt = referenceAt(weeksAt(lastWeightCtrl));
    const ratio = refAt.weightG > 0 ? clamp(Number(lastWeightCtrl.fetalWeightG) / refAt.weightG, 0.6, 1.5) : 1;
    out.weightG = Math.round(ref.weightG * ratio);
    out.lanePercent = Math.round((ratio - 1) * 100);
    out.lastWeightDate = lastWeightCtrl.date;
  }
  if (lastLengthCtrl) {
    const refAt = referenceAt(weeksAt(lastLengthCtrl));
    const ratio = refAt.lengthCm > 0 ? clamp(Number(lastLengthCtrl.fetalLengthCm) / refAt.lengthCm, 0.7, 1.3) : 1;
    out.lengthCm = round1(ref.lengthCm * ratio);
    out.lastLengthDate = lastLengthCtrl.date;
  }
  out.lastControlDate = [out.lastWeightDate, out.lastLengthDate].filter(Boolean).sort().pop();

  // Fecha probable orientativa: edad de crecimiento segun el ultimo peso conocido
  const cw = lastWeightCtrl ? weeksAt(lastWeightCtrl) : 0;
  if (lastWeightCtrl && cw >= 12) {
    const growthWeeks = weeksForWeight(Number(lastWeightCtrl.fetalWeightG));
    const shiftDays = clamp(Math.round((cw - growthWeeks) * 7), -14, 14);
    if (officialDueDate) {
      const due = localDay(officialDueDate);
      due.setDate(due.getDate() + shiftDays);
      out.dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      out.dueShiftDays = shiftDays;
    }
  }
  return out;
}
