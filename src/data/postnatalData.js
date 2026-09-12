/**
 * Datos y estándares de Crecimiento y Desarrollo Infantil (Carnet de Salud)
 * Basado en los patrones de crecimiento de la Organización Mundial de la Salud (OMS)
 * y el Programa Ampliado de Inmunizaciones (PAI) del Ministerio de Salud de Colombia.
 */

export const DEFAULT_VACCINES = [
  {
    id: 'rn_bcg',
    ageGroup: 'Recién nacido',
    name: 'BCG (Tuberculosis)',
    disease: 'Formas graves de tuberculosis (meníngea y miliar)',
    dose: 'Dosis única al nacer',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'rn_hepb',
    ageGroup: 'Recién nacido',
    name: 'Hepatitis B',
    disease: 'Infección por el virus de la hepatitis B',
    dose: 'Dosis neonatal (primeras 12 horas)',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm2_penta',
    ageGroup: '2 meses',
    name: 'Pentavalente (1ª dosis)',
    disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B y Haemophilus influenzae tipo b',
    dose: 'Primera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm2_polio',
    ageGroup: '2 meses',
    name: 'Polio IPV inyectable (1ª dosis)',
    disease: 'Poliomielitis',
    dose: 'Primera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm2_rota',
    ageGroup: '2 meses',
    name: 'Rotavirus (1ª dosis)',
    disease: 'Diarrea severa por rotavirus',
    dose: 'Primera dosis oral',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm2_neumo',
    ageGroup: '2 meses',
    name: 'Neumococo conjugada (1ª dosis)',
    disease: 'Neumonía, meningitis y otitis por neumococo',
    dose: 'Primera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm4_penta',
    ageGroup: '4 meses',
    name: 'Pentavalente (2ª dosis)',
    disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B y Hib',
    dose: 'Segunda dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm4_polio',
    ageGroup: '4 meses',
    name: 'Polio IPV inyectable (2ª dosis)',
    disease: 'Poliomielitis',
    dose: 'Segunda dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm4_rota',
    ageGroup: '4 meses',
    name: 'Rotavirus (2ª dosis)',
    disease: 'Diarrea severa por rotavirus',
    dose: 'Segunda dosis oral',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm4_neumo',
    ageGroup: '4 meses',
    name: 'Neumococo conjugada (2ª dosis)',
    disease: 'Neumonía, meningitis y otitis por neumococo',
    dose: 'Segunda dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm6_penta',
    ageGroup: '6 meses',
    name: 'Pentavalente (3ª dosis)',
    disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B y Hib',
    dose: 'Tercera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm6_polio',
    ageGroup: '6 meses',
    name: 'Polio oral o IPV (3ª dosis)',
    disease: 'Poliomielitis',
    dose: 'Tercera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm6_influ',
    ageGroup: '6 meses',
    name: 'Influenza estacional (1ª dosis)',
    disease: 'Gripa grave por virus de la influenza',
    dose: 'Primera dosis pediátrica',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm7_influ',
    ageGroup: '7 meses',
    name: 'Influenza estacional (2ª dosis)',
    disease: 'Gripa grave por virus de la influenza',
    dose: 'Segunda dosis (refuerzo al mes de la 1ª)',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm12_srp',
    ageGroup: '12 meses (1 año)',
    name: 'Triple Viral SRP (1ª dosis)',
    disease: 'Sarampión, Rubeola y Paperas',
    dose: 'Primera dosis',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm12_neumo',
    ageGroup: '12 meses (1 año)',
    name: 'Neumococo (Refuerzo)',
    disease: 'Neumonía y meningitis bacteriana',
    dose: 'Dosis de refuerzo',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm12_fa',
    ageGroup: '12 meses (1 año)',
    name: 'Fiebre Amarilla (Dosis única)',
    disease: 'Fiebre amarilla',
    dose: 'Dosis única',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm12_hepa',
    ageGroup: '12 meses (1 año)',
    name: 'Hepatitis A',
    disease: 'Infección viral del hígado por hepatitis A',
    dose: 'Dosis única',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm18_dpt',
    ageGroup: '18 meses',
    name: 'DPT (1er refuerzo)',
    disease: 'Difteria, Tétanos y Tos ferina',
    dose: 'Primer refuerzo',
    applied: false,
    dateApplied: null,
  },
  {
    id: 'm18_polio',
    ageGroup: '18 meses',
    name: 'Polio (1er refuerzo)',
    disease: 'Poliomielitis',
    dose: 'Primer refuerzo',
    applied: false,
    dateApplied: null,
  },
];

export const DEVELOPMENT_MILESTONES = [
  {
    id: 'm1_head',
    ageRange: '0 - 1 mes',
    area: 'Motor Grueso',
    title: 'Sostiene la cabeza brevemente',
    description: 'Levanta la cabeza unos segundos al estar acostado boca abajo.',
    completed: false,
  },
  {
    id: 'm1_vision',
    ageRange: '0 - 1 mes',
    area: 'Sensorial / Adaptativo',
    title: 'Fija la mirada en rostros',
    description: 'Enfoca la mirada a 20-30 cm, especialmente en los ojos de mamá o papá.',
    completed: false,
  },
  {
    id: 'm2_smile',
    ageRange: '2 meses',
    area: 'Personal Social',
    title: 'Sonrisa social activa',
    description: 'Sonríe voluntariamente como respuesta a la voz o sonrisa de sus padres.',
    completed: false,
  },
  {
    id: 'm2_coo',
    ageRange: '2 meses',
    area: 'Audición y Lenguaje',
    title: 'Gorjeos y sonidos vocálicos',
    description: 'Emite sonidos como "agu", "e", "o" cuando se le habla con cariño.',
    completed: false,
  },
  {
    id: 'm3_head_firm',
    ageRange: '3 meses',
    area: 'Motor Grueso',
    title: 'Control cefálico firme',
    description: 'Mantiene la cabeza erguida y estable cuando está en brazos o sentado con apoyo.',
    completed: false,
  },
  {
    id: 'm4_grasp',
    ageRange: '4 meses',
    area: 'Motor Fino',
    title: 'Agarra objetos y sonajeros',
    description: 'Lleva sus dos manos al centro, sostiene sonajeros y se los lleva a la boca.',
    completed: false,
  },
  {
    id: 'm4_roll',
    ageRange: '4 - 5 meses',
    area: 'Motor Grueso',
    title: 'Se gira sobre sí mismo',
    description: 'Rueda de la posición boca arriba a de costado o boca abajo.',
    completed: false,
  },
  {
    id: 'm6_sit',
    ageRange: '6 meses',
    area: 'Motor Grueso',
    title: 'Se sienta con poco apoyo',
    description: 'Se apoya con sus manos adelante ("trípode") o se sienta con firmeza.',
    completed: false,
  },
  {
    id: 'm6_babble',
    ageRange: '6 meses',
    area: 'Audición y Lenguaje',
    title: 'Balbuceo monosilábico',
    description: 'Repite sílabas como "ba-ba", "da-da", "ma-ma" sin sentido específico.',
    completed: false,
  },
  {
    id: 'm8_transfer',
    ageRange: '7 - 8 meses',
    area: 'Motor Fino',
    title: 'Pasa objetos de una mano a otra',
    description: 'Cambia un juguete de mano con soltura y golpea objetos entre sí.',
    completed: false,
  },
  {
    id: 'm9_crawl',
    ageRange: '8 - 10 meses',
    area: 'Motor Grueso',
    title: 'Inicia gateo o arrastre',
    description: 'Se desplaza arrastrándose sobre la barriga o gateando en cuatro apoyos.',
    completed: false,
  },
  {
    id: 'm10_pincer',
    ageRange: '9 - 11 meses',
    area: 'Motor Fino',
    title: 'Pinza digital (dedo índice y pulgar)',
    description: 'Toma trocitos de comida o juguetes pequeños usando la yema del pulgar e índice.',
    completed: false,
  },
  {
    id: 'm12_stand',
    ageRange: '10 - 12 meses',
    area: 'Motor Grueso',
    title: 'Se pone de pie con apoyo',
    description: 'Se levanta sujetándose de muebles o de las manos de un adulto.',
    completed: false,
  },
  {
    id: 'm12_first_words',
    ageRange: '12 meses (1 año)',
    area: 'Audición y Lenguaje',
    title: 'Primeras palabras con intención',
    description: 'Dice al menos una palabra con significado claro ("mamá", "papá", "agua").',
    completed: false,
  },
];

// Medias y desviaciones estándar aproximadas de la OMS (Peso en kg, Talla en cm, PC en cm)
// Referencia a los 0, 1, 2, 3, 4, 6, 9, 12, 18, 24 meses
export const WHO_STANDARDS = {
  nino: {
    weight: [
      { month: 0, min: 2.5, median: 3.3, max: 4.4 },
      { month: 1, min: 3.4, median: 4.5, max: 5.8 },
      { month: 2, min: 4.3, median: 5.6, max: 7.1 },
      { month: 3, min: 5.0, median: 6.4, max: 8.0 },
      { month: 4, min: 5.6, median: 7.0, max: 8.7 },
      { month: 6, min: 6.4, median: 7.9, max: 9.8 },
      { month: 9, min: 7.1, median: 8.9, max: 11.0 },
      { month: 12, min: 7.7, median: 9.6, max: 12.0 },
      { month: 18, min: 8.6, median: 10.9, max: 13.7 },
      { month: 24, min: 9.7, median: 12.2, max: 15.3 },
    ],
    length: [
      { month: 0, min: 46.1, median: 49.9, max: 53.7 },
      { month: 1, min: 50.8, median: 54.7, max: 58.6 },
      { month: 2, min: 54.4, median: 58.4, max: 62.4 },
      { month: 3, min: 57.3, median: 61.4, max: 65.5 },
      { month: 4, min: 59.7, median: 63.9, max: 68.0 },
      { month: 6, min: 63.3, median: 67.6, max: 71.9 },
      { month: 9, min: 67.7, median: 72.0, max: 76.5 },
      { month: 12, min: 71.0, median: 75.7, max: 80.5 },
      { month: 18, min: 76.9, median: 82.3, max: 87.7 },
      { month: 24, min: 82.1, median: 87.8, max: 93.6 },
    ],
    headCirc: [
      { month: 0, min: 31.9, median: 34.5, max: 37.0 },
      { month: 1, min: 34.9, median: 37.3, max: 39.6 },
      { month: 2, min: 36.8, median: 39.1, max: 41.3 },
      { month: 3, min: 38.1, median: 40.5, max: 42.6 },
      { month: 4, min: 39.2, median: 41.6, max: 43.7 },
      { month: 6, min: 41.0, median: 43.3, max: 45.4 },
      { month: 9, min: 42.6, median: 45.0, max: 47.2 },
      { month: 12, min: 43.5, median: 46.1, max: 48.3 },
      { month: 18, min: 44.8, median: 47.4, max: 49.7 },
      { month: 24, min: 45.7, median: 48.3, max: 50.7 },
    ],
  },
  nina: {
    weight: [
      { month: 0, min: 2.4, median: 3.2, max: 4.2 },
      { month: 1, min: 3.2, median: 4.2, max: 5.5 },
      { month: 2, min: 3.9, median: 5.1, max: 6.6 },
      { month: 3, min: 4.5, median: 5.8, max: 7.5 },
      { month: 4, min: 5.0, median: 6.4, max: 8.2 },
      { month: 6, min: 5.7, median: 7.3, max: 9.3 },
      { month: 9, min: 6.5, median: 8.2, max: 10.5 },
      { month: 12, min: 7.0, median: 8.9, max: 11.5 },
      { month: 18, min: 8.1, median: 10.2, max: 13.2 },
      { month: 24, min: 9.0, median: 11.5, max: 14.8 },
    ],
    length: [
      { month: 0, min: 45.4, median: 49.1, max: 52.9 },
      { month: 1, min: 49.8, median: 53.7, max: 57.6 },
      { month: 2, min: 53.0, median: 57.1, max: 61.1 },
      { month: 3, min: 55.6, median: 59.8, max: 64.0 },
      { month: 4, min: 57.8, median: 62.1, max: 66.4 },
      { month: 6, min: 61.2, median: 65.7, max: 70.3 },
      { month: 9, min: 65.3, median: 70.1, max: 75.0 },
      { month: 12, min: 68.9, median: 74.0, max: 79.2 },
      { month: 18, min: 74.9, median: 80.7, max: 86.5 },
      { month: 24, min: 80.0, median: 86.4, max: 92.5 },
    ],
    headCirc: [
      { month: 0, min: 31.5, median: 33.9, max: 36.2 },
      { month: 1, min: 34.2, median: 36.5, max: 38.8 },
      { month: 2, min: 35.8, median: 38.2, max: 40.4 },
      { month: 3, min: 37.1, median: 39.5, max: 41.8 },
      { month: 4, min: 38.2, median: 40.6, max: 42.8 },
      { month: 6, min: 39.9, median: 42.2, max: 44.4 },
      { month: 9, min: 41.5, median: 43.8, max: 46.1 },
      { month: 12, min: 42.5, median: 44.9, max: 47.3 },
      { month: 18, min: 43.8, median: 46.2, max: 48.6 },
      { month: 24, min: 44.7, median: 47.2, max: 49.6 },
    ],
  },
};

/**
 * Calcula el diagnóstico de métricas del carnet de crecimiento y desarrollo
 */
export function calculateGrowthMetrics({ ageMonths, weightKg, lengthCm, headCircCm, sex = 'nino' }) {
  const genderKey = sex === 'nina' ? 'nina' : 'nino';
  const standards = WHO_STANDARDS[genderKey];

  // Buscar el rango más cercano por mes
  const findClosest = (arr, m) => {
    let closest = arr[0];
    let minDiff = Math.abs(arr[0].month - m);
    for (const item of arr) {
      const diff = Math.abs(item.month - m);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    return closest;
  };

  const wRef = findClosest(standards.weight, ageMonths);
  const lRef = findClosest(standards.length, ageMonths);
  const hRef = findClosest(standards.headCirc, ageMonths);

  // Diagnóstico de Peso para la Edad
  let weightStatus = { status: 'Normal / Eutrófico', tone: 'success', text: 'Peso adecuado para la edad' };
  if (weightKg) {
    if (weightKg < wRef.min) {
      weightStatus = { status: 'Alerta: Bajo peso', tone: 'danger', text: 'Por debajo del percentil mínimo esperado (Riesgo de desnutrición)' };
    } else if (weightKg > wRef.max) {
      weightStatus = { status: 'Alerta: Peso elevado', tone: 'warning', text: 'Por encima del percentil esperado (Posible sobrepeso)' };
    }
  }

  // Diagnóstico de Talla para la Edad
  let lengthStatus = { status: 'Talla adecuada', tone: 'success', text: 'Crecimiento longitudinal acorde a la edad' };
  if (lengthCm) {
    if (lengthCm < lRef.min) {
      lengthStatus = { status: 'Alerta: Talla baja', tone: 'danger', text: 'Por debajo del rango esperado para su edad' };
    } else if (lengthCm > lRef.max) {
      lengthStatus = { status: 'Talla alta', tone: 'info', text: 'Por encima del promedio para su edad' };
    }
  }

  // Diagnóstico de Perímetro Cefálico
  let headStatus = { status: 'Normal', tone: 'success', text: 'Desarrollo craneal dentro de los límites esperados' };
  if (headCircCm) {
    if (headCircCm < hRef.min) {
      headStatus = { status: 'Alerta: Microcefalia relativa', tone: 'danger', text: 'Por debajo de -2 desviaciones estándar' };
    } else if (headCircCm > hRef.max) {
      headStatus = { status: 'Alerta: Macrocefalia relativa', tone: 'warning', text: 'Por encima del rango superior esperado' };
    }
  }

  // Índice de Masa Corporal (IMC) si hay peso y talla
  let imc = null;
  if (weightKg && lengthCm && lengthCm > 0) {
    const heightM = lengthCm / 100;
    imc = Number((weightKg / (heightM * heightM)).toFixed(1));
  }

  return {
    weightStatus,
    lengthStatus,
    headStatus,
    imc,
    references: {
      weight: wRef,
      length: lRef,
      headCirc: hRef,
    },
  };
}
