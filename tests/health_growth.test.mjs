// Pruebas de los dictamenes y de las estimaciones de crecimiento (sin navegador).
// Uso (desde la raiz del frontend): node tests/health_growth.test.mjs
import { register } from 'node:module';

// Las fuentes importan sin extension (estilo Vite): este cargador agrega ".js" al resolver.
register('data:text/javascript,' + encodeURIComponent(
  "export async function resolve(s,c,n){try{return await n(s,c);}catch(e){if(s.startsWith('.'))return n(s+'.js',c);throw e;}}",
));

const { evaluateFetalHealth, evaluateMaternalHealth, parseBloodPressure } = await import('../src/utils/healthEvaluations.js');
const { estimateFromControls, referenceAt } = await import('../src/utils/fetalGrowth.js');
const { localDay, todayStr } = await import('../src/utils/dates.js');

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASA ' : 'FALLA'} ${name}${ok || !detail ? '' : ' -> ' + detail}`);
};

// ---- Dictamen fetal: los umbrales existentes no cambian ----
const f1 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 1005, fetalHeartRate: 140 });
check('fetal: peso en P50 y FCF normal -> optimo', f1.level === 'optimo' && f1.percentile >= 45 && f1.percentile <= 55, JSON.stringify([f1.level, f1.percentile]));
const f2 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 700, fetalHeartRate: 140 });
check('fetal: peso < P10 -> atencion', f2.level === 'atencion' && f2.percentile < 10);
const f3 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 1005, fetalHeartRate: 100 });
check('fetal: bradicardia (< 110) -> alerta', f3.level === 'alerta');
const f4 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 1005, fetalHeartRate: 180 });
check('fetal: taquicardia (> 175) -> alerta', f4.level === 'alerta');
const f5 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 1005, fetalHeartRate: 140, amnioticFluid: 'bajo' });
check('fetal: liquido bajo -> atencion', f5.level === 'atencion');
const f6 = evaluateFetalHealth({ gestationalWeek: 28, fetalWeightG: 1005, fetalHeartRate: 140, fetalMovements: 'disminuido' });
check('fetal: movimientos disminuidos -> atencion', f6.level === 'atencion');

// ---- Dictamen fetal: ya no inventa datos ----
const f7 = evaluateFetalHealth({ gestationalWeek: 28, fetalHeartRate: 140 });
check('fetal: sin peso no inventa percentil ni peso al nacer', f7.percentile === null && f7.birthWeightPredictionG === null, JSON.stringify([f7.percentile, f7.birthWeightPredictionG]));
check('fetal: sin peso el resumen no afirma percentil', !/Percentil 50|3\.45 kg/.test(f7.predictionSummary), f7.predictionSummary);
const f8 = evaluateFetalHealth({ gestationalWeek: 8, fetalWeightG: 1, fetalHeartRate: 160 });
check('fetal: semana 8 no se compara con la tabla de la semana 40', f8.percentile === null && f8.level !== 'atencion' || f8.level === 'optimo', JSON.stringify([f8.level, f8.percentile]));
const f9 = evaluateFetalHealth({ gestationalWeek: 300, fetalWeightG: 3400 });
check('fetal: semana absurda se limita a 42', f9.week === 42);

// ---- Dictamen materno ----
check('materno: 118/76 -> optimo', evaluateMaternalHealth({ bloodPressure: '118/76', heartRate: 80, gestationalWeek: 24 }).level === 'optimo');
check('materno: 130/85 -> alerta (>=140/90 no, >=120/80 atencion)', evaluateMaternalHealth({ bloodPressure: '130/85' }).level === 'atencion');
check('materno: 145/95 -> alerta', evaluateMaternalHealth({ bloodPressure: '145/95' }).level === 'alerta');
check('materno: 165/112 -> alerta severa', evaluateMaternalHealth({ bloodPressure: '165/112' }).alarms.length > 0);
check('materno: presion imposible "12/8" se ignora', parseBloodPressure('12/8') === null);
check('materno: presion invertida "80/120" se ignora', parseBloodPressure('80/120') === null);
const m0 = evaluateMaternalHealth({});
check('materno: sin mediciones no declara salud optima', /Sin mediciones/.test(m0.title), m0.title);
check('materno: pulso 120 -> atencion', evaluateMaternalHealth({ heartRate: 120 }).level === 'atencion');

// ---- Estimaciones de crecimiento ----
const ref28 = referenceAt(28);
check('referencia semana 28 ~ 1005 g / 37.6 cm', Math.abs(ref28.weightG - 1005) < 1 && Math.abs(ref28.lengthCm - 37.6) < 0.1, JSON.stringify(ref28));
const noCtrl = estimateFromControls({ controls: [], lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20' });
check('sin controles: usa referencia y FPP oficial', noCtrl.source === 'referencia' && noCtrl.dueDate === '2027-03-08' && noCtrl.dueShiftDays === 0);
const big = estimateFromControls({ controls: [{ date: '2026-10-20', gestationalWeek: 20, fetalWeightG: 340, fetalLengthCm: 26 }], lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20' });
check('bebe grande: peso proyectado mayor que la referencia', big.weightG > noCtrl.weightG && big.lanePercent > 0, JSON.stringify(big));
check('bebe grande: FPP orientativa antes o igual a la oficial y max 14 dias', big.dueShiftDays <= 0 && big.dueShiftDays >= -14);
const small = estimateFromControls({ controls: [{ date: '2026-10-20', gestationalWeek: 20, fetalWeightG: 220 }], lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20' });
check('bebe pequeno: peso menor y FPP posterior (max 14 dias)', small.weightG < noCtrl.weightG && small.dueShiftDays >= 0 && small.dueShiftDays <= 14, JSON.stringify(small));
const garbage = estimateFromControls({ controls: [{ date: '2026-10-20', fetalWeightG: -50, fetalLengthCm: 'abc' }, null, {}], lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20' });
check('datos basura en controles no rompen la estimacion', garbage.source === 'referencia' && Number.isFinite(garbage.weightG));
check('sin FUM no estima', estimateFromControls({ controls: [], lmp: null, officialDueDate: null, today: '2026-11-20' }) === null);

// ---- Datos faltantes: se mantiene el ultimo dato conocido de cada medida ----
const gap = estimateFromControls({
  controls: [
    { date: '2026-09-20', gestationalWeek: 16, fetalWeightG: 130, fetalLengthCm: 12.5 },
    { date: '2026-10-20', gestationalWeek: 20, fetalHeartRate: 145 },
  ],
  lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20',
});
check('control sin peso ni talla: conserva el ultimo peso/talla conocidos', gap.source === 'controles' && gap.lastWeightDate === '2026-09-20' && gap.lastLengthDate === '2026-09-20', JSON.stringify(gap));
check('proyecta desde el dato anterior (bebe sobre el promedio)', gap.weightG > noCtrl.weightG && gap.lengthCm > noCtrl.lengthCm, JSON.stringify([gap.weightG, gap.lengthCm]));
const mixed = estimateFromControls({
  controls: [
    { date: '2026-09-20', gestationalWeek: 16, fetalWeightG: 130 },
    { date: '2026-10-20', gestationalWeek: 20, fetalLengthCm: 26 },
  ],
  lmp: '2026-06-01', officialDueDate: '2027-03-08', today: '2026-11-20',
});
check('peso de un control y talla de otro se combinan', mixed.lastWeightDate === '2026-09-20' && mixed.lastLengthDate === '2026-10-20');

// ---- Fechas locales ----
const d = localDay('2027-03-08');
check('localDay interpreta AAAA-MM-DD como dia local', d.getFullYear() === 2027 && d.getMonth() === 2 && d.getDate() === 8);
check('todayStr usa la fecha local (no UTC)', todayStr(new Date(2026, 10, 20, 23, 30)) === '2026-11-20');

console.log(failed ? `\n${failed} PRUEBA(S) FALLARON` : '\nTODO OK');
process.exit(failed ? 1 : 0);
