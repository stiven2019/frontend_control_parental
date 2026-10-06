/**
 * Motor de Evaluación y Diagnóstico Clínico Materno-Fetal
 * Mi Bebé (Control Prenatal y Salud Gestacional)
 * 
 * Cumple con directrices obstétricas de la OMS, ACOG y Guías de Control Prenatal MinSalud.
 */

// Tablas de Percentiles Fetales de Peso (Hadlock / OMS) por Semana Gestacional (12 a 42)
export const FETAL_WEIGHT_PERCENTILES = {
  12: { p10: 12, p50: 14, p90: 18, lengthCm: 5.4 },
  13: { p10: 20, p50: 23, p90: 28, lengthCm: 7.4 },
  14: { p10: 38, p50: 43, p90: 55, lengthCm: 8.7 },
  15: { p10: 60, p50: 70, p90: 85, lengthCm: 10.1 },
  16: { p10: 85, p50: 100, p90: 125, lengthCm: 11.6 },
  17: { p10: 120, p50: 140, p90: 170, lengthCm: 13.0 },
  18: { p10: 160, p50: 190, p90: 230, lengthCm: 14.2 },
  19: { p10: 210, p50: 240, p90: 290, lengthCm: 15.3 },
  20: { p10: 260, p50: 300, p90: 360, lengthCm: 25.6 }, // Desde sem 20 corona-talón
  21: { p10: 320, p50: 360, p90: 430, lengthCm: 26.7 },
  22: { p10: 380, p50: 430, p90: 510, lengthCm: 27.8 },
  23: { p10: 450, p50: 500, p90: 600, lengthCm: 28.9 },
  24: { p10: 530, p50: 600, p90: 710, lengthCm: 30.0 },
  25: { p10: 620, p50: 660, p90: 800, lengthCm: 34.6 },
  26: { p10: 720, p50: 760, p90: 920, lengthCm: 35.6 },
  27: { p10: 830, p50: 875, p90: 1050, lengthCm: 36.6 },
  28: { p10: 950, p50: 1005, p90: 1200, lengthCm: 37.6 },
  29: { p10: 1080, p50: 1150, p90: 1380, lengthCm: 38.6 },
  30: { p10: 1230, p50: 1320, p90: 1570, lengthCm: 39.9 },
  31: { p10: 1400, p50: 1500, p90: 1780, lengthCm: 41.1 },
  32: { p10: 1580, p50: 1700, p90: 2010, lengthCm: 42.4 },
  33: { p10: 1780, p50: 1920, p90: 2260, lengthCm: 43.7 },
  34: { p10: 2000, p50: 2150, p90: 2520, lengthCm: 45.0 },
  35: { p10: 2220, p50: 2380, p90: 2780, lengthCm: 46.2 },
  36: { p10: 2450, p50: 2620, p90: 3050, lengthCm: 47.4 },
  37: { p10: 2680, p50: 2860, p90: 3310, lengthCm: 48.6 },
  38: { p10: 2880, p50: 3080, p90: 3550, lengthCm: 49.8 },
  39: { p10: 3050, p50: 3290, p90: 3770, lengthCm: 50.7 },
  40: { p10: 3180, p50: 3460, p90: 3950, lengthCm: 51.2 },
  41: { p10: 3260, p50: 3580, p90: 4070, lengthCm: 51.7 },
  42: { p10: 3300, p50: 3640, p90: 4150, lengthCm: 52.0 },
};

/**
 * Parsea y clasifica la Presión Arterial (PA) de la mamá
 * Formato aceptado: "120/80", "110 / 70", "130-80", etc.
 */
export function parseBloodPressure(bpString) {
  if (!bpString || typeof bpString !== 'string') return null;
  const match = bpString.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  if (!match) return null;
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  return { systolic, diastolic, raw: `${systolic}/${diastolic}` };
}

/**
 * 👩‍🍼 EVALUACIÓN CLÍNICA DE LA SALUD DE MAMÁ
 * Analiza presión arterial, frecuencia cardíaca, altura uterina y peso
 */
export function evaluateMaternalHealth(control, pregnancyContext = {}) {
  const bp = parseBloodPressure(control?.bloodPressure);
  const hr = control?.heartRate ? Number(control.heartRate) : null;
  const au = control?.uterineHeightCm ? Number(control.uterineHeightCm) : null;
  const weight = control?.weightKg ? Number(control.weightKg) : null;
  const week = control?.gestationalWeek || pregnancyContext?.week || null;

  let overallLevel = 'optimo'; // 'optimo' | 'atencion' | 'alerta'
  const indicators = [];
  const alarms = [];
  const tips = [];

  // 1. Evaluación de Presión Arterial
  if (bp) {
    const { systolic, diastolic } = bp;
    if (systolic >= 160 || diastolic >= 110) {
      overallLevel = 'alerta';
      indicators.push({
        name: 'Presión Arterial',
        value: `${systolic}/${diastolic} mmHg`,
        status: 'alerta',
        badge: 'Crisis Hipertensiva Severa',
        message: 'Tensión arterial en rango crítico para el embarazo. Riesgo inmediato de preeclampsia grave.',
      });
      alarms.push('Presión arterial severamente elevada (≥ 160/110 mmHg). Requiere traslado o atención médica de urgencias de inmediato.');
    } else if (systolic >= 140 || diastolic >= 90) {
      overallLevel = 'alerta';
      indicators.push({
        name: 'Presión Arterial',
        value: `${systolic}/${diastolic} mmHg`,
        status: 'alerta',
        badge: 'Hipertensión Gestacional',
        message: 'Tensión arterial elevada. Requiere evaluación médica prioritaria para descartar preeclampsia.',
      });
      alarms.push('Presión arterial elevada (≥ 140/90 mmHg). Consulta con tu obstetra o acude a urgencias para toma de proteinuria.');
    } else if (systolic >= 120 || diastolic >= 80) {
      if (overallLevel !== 'alerta') overallLevel = 'atencion';
      indicators.push({
        name: 'Presión Arterial',
        value: `${systolic}/${diastolic} mmHg`,
        status: 'atencion',
        badge: 'Prehipertensión / Límite',
        message: 'Tensión arterial ligeramente limítrofe. Monitorear en reposo 2 veces al día y reducir consumo de sodio.',
      });
      tips.push('Reduce la sal añadida a las comidas y descansa sobre tu costado izquierdo para optimizar la circulación.');
    } else if (systolic < 90 || diastolic < 60) {
      indicators.push({
        name: 'Presión Arterial',
        value: `${systolic}/${diastolic} mmHg`,
        status: 'info',
        badge: 'Hipotensión Leve (Baja)',
        message: 'Presión arterial baja, común en el embarazo por dilatación de vasos sanguíneos. Hidrátate abundantemente.',
      });
      tips.push('Bebe de 2 a 2.5 litros de agua al día y no te pongas de pie bruscamente para prevenir mareos.');
    } else {
      indicators.push({
        name: 'Presión Arterial',
        value: `${systolic}/${diastolic} mmHg`,
        status: 'optimo',
        badge: 'Presión Arterial Óptima',
        message: 'Tensión arterial en rango perfecto para el embarazo (90-119 / 60-79 mmHg). Flujo placentario excelente.',
      });
    }
  }

  // 2. Frecuencia Cardíaca Materna
  if (hr) {
    if (hr > 115) {
      if (overallLevel !== 'alerta') overallLevel = 'atencion';
      indicators.push({
        name: 'Frecuencia Cardíaca',
        value: `${hr} lpm`,
        status: 'atencion',
        badge: 'Taquicardia Materna',
        message: 'Pulso elevado en reposo (> 115 lpm). Puede indicar deshidratación, estrés, fiebre o anemia.',
      });
      tips.push('Verifica que estés bien hidratada y toma un descanso en reposo tranquilo.');
    } else if (hr >= 95) {
      indicators.push({
        name: 'Frecuencia Cardíaca',
        value: `${hr} lpm`,
        status: 'optimo',
        badge: 'Elevación Fisiológica Normal',
        message: 'Frecuencia cardíaca ligeramente activa, completamente normal por el aumento del volumen sanguíneo gestacional.',
      });
    } else if (hr < 55) {
      indicators.push({
        name: 'Frecuencia Cardíaca',
        value: `${hr} lpm`,
        status: 'atencion',
        badge: 'Bradicardia',
        message: 'Pulso bajo (< 55 lpm). Monitorear si se acompaña de mareos o debilidad.',
      });
    } else {
      indicators.push({
        name: 'Frecuencia Cardíaca',
        value: `${hr} lpm`,
        status: 'optimo',
        badge: 'Ritmo Cardíaco Normal',
        message: 'Frecuencia cardíaca materna dentro del rango saludable (60 - 95 lpm).',
      });
    }
  }

  // 3. Altura Uterina vs. Semanas (Regla de McDonald)
  if (au) {
    if (week && week >= 20) {
      const diff = au - week;
      if (diff > 4) {
        if (overallLevel !== 'alerta') overallLevel = 'atencion';
        indicators.push({
          name: 'Altura Uterina',
          value: `${au} cm (Semana ${week})`,
          status: 'atencion',
          badge: 'Altura Aumentada',
          message: `La altura uterina (${au} cm) está por encima de las semanas (+${diff} cm). Puede indicar bebé grande o líquido aumentado.`,
        });
      } else if (diff < -4) {
        if (overallLevel !== 'alerta') overallLevel = 'atencion';
        indicators.push({
          name: 'Altura Uterina',
          value: `${au} cm (Semana ${week})`,
          status: 'atencion',
          badge: 'Altura Disminuida',
          message: `La altura uterina (${au} cm) está por debajo de las semanas (${diff} cm). Requiere ecografía para verificar crecimiento fetal.`,
        });
      } else {
        indicators.push({
          name: 'Altura Uterina',
          value: `${au} cm (Semana ${week})`,
          status: 'optimo',
          badge: 'Crecimiento Uterino Conforme',
          message: `Altura uterina adecuada y armónica con tu edad gestacional (Regla de McDonald: sem ± 2 cm).`,
        });
      }
    } else {
      indicators.push({
        name: 'Altura Uterina',
        value: `${au} cm`,
        status: 'optimo',
        badge: 'Registrada',
        message: 'Medición registrada con éxito para el seguimiento de la curva obstétrica.',
      });
    }
  }

  // 4. Peso Materno
  if (weight) {
    indicators.push({
      name: 'Peso Materno',
      value: `${weight} kg`,
      status: 'optimo',
      badge: 'Registrado',
      message: 'Control ponderal actualizado. Mantén tu ingesta de proteínas, vegetales y agua.',
    });
  }

  // Recomendaciones y Signos de Alarma Obstétrica universales
  const universalSigns = [
    'Dolor de cabeza intenso que no cede con analgésicos suaves.',
    'Ver lucecitas parpadeantes (fosfenos) o visión borrosa.',
    'Zumbido de oídos (acúfenos) o dolor en la boca del estómago.',
    'Hinchazón repentina y marcada en la cara, manos o tobillos.',
    'Pérdida de líquido claro por vagina o sangrado genital.',
  ];

  let title = '¡Salud Materna en Rango Óptimo y Estable! 💚';
  let summary = 'Tus parámetros de este control reflejan una salud cardiovascular y física materna en excelente equilibrio. El ambiente para tu bebé es seguro y propicio.';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (overallLevel === 'alerta') {
    title = 'Atención Médica Requerida — Salud Materna en Alerta 🚨';
    summary = 'Se han detectado parámetros en este control (como la presión arterial) que requieren valoración obstétrica prioritaria. No te alarmes, pero acude con tu médico para revisión.';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (overallLevel === 'atencion') {
    title = 'Salud Materna Estable — Monitoreo Preventivo Recomendado ⚠️';
    summary = 'La mayoría de tus valores son adecuados, pero hay indicadores límite (como tensión limítrofe o pulso acelerado) que aconsejan descanso, hidratación y vigilancia activa.';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  // Tips adicionales
  tips.push('Descansa preferentemente recostada sobre tu lado izquierdo para optimizar la perfusión sanguínea hacia la placenta.');
  tips.push('Continúa tomando tus micronutrientes prenatales diarios (ácido fólico, hierro y calcio según formulación médica).');

  return {
    level: overallLevel,
    title,
    summary,
    badgeColor,
    indicators,
    alarms,
    tips,
    universalSigns,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * 👶 PREDICCIÓN Y EVALUACIÓN CLÍNICA DE SALUD FETAL
 * Analiza medidas biométricas fetales, FCF, peso estimado, percentiles Hadlock y líquido amniótico
 */
export function evaluateFetalHealth(control, pregnancyContext = {}) {
  const week = Number(control?.gestationalWeek || pregnancyContext?.week || 28);
  const fcf = control?.fetalHeartRate ? Number(control.fetalHeartRate) : null;
  const weightG = control?.fetalWeightG ? Number(control.fetalWeightG) : null;
  const lengthCm = control?.fetalLengthCm ? Number(control.fetalLengthCm) : null;
  const amniotic = control?.amnioticFluid || 'normal';
  const movements = control?.fetalMovements || 'activo';
  const presentation = control?.fetalPresentation || 'cefalica';
  const placenta = control?.placentaMaturity || 'grado_1';

  let overallLevel = 'optimo'; // 'optimo' | 'atencion' | 'alerta'
  let score = 95; // Puntuación de vitalidad de 0 a 100
  const findings = [];
  const alerts = [];
  const recommendations = [];

  // 1. Cálculo de Percentil Fetal (Hadlock / OMS)
  let percentile = 50;
  let percentileLabel = 'Percentil 50 (Mediana exacta)';
  let birthWeightPrediction = 3450; // Gramos proyectados a las 40 semanas
  const ref = FETAL_WEIGHT_PERCENTILES[week] || FETAL_WEIGHT_PERCENTILES[40];

  if (weightG && ref) {
    if (weightG < ref.p10) {
      // Menor al percentil 10
      const ratio = weightG / ref.p10;
      percentile = Math.max(1, Math.round(ratio * 9));
      percentileLabel = `Percentil ${percentile} (Por debajo de P10)`;
      score -= 25;
      overallLevel = 'atencion';
      findings.push({
        label: 'Crecimiento Fetal (Peso)',
        value: `${weightG} g (Semana ${week})`,
        status: 'atencion',
        badge: 'Riesgo RCIU / PEG (Pequeño)',
        detail: `El peso está por debajo del percentil 10 de referencia (${ref.p10} g). Se recomienda ecografía Doppler feto-placentaria para descartar restricción de crecimiento.`,
      });
      alerts.push('Peso fetal estimado bajo para la edad gestacional (< P10). Informa a tu médico para seguimiento ecográfico de flujos arteriales.');
      birthWeightPrediction = Math.round(3180 * (weightG / ref.p10));
    } else if (weightG > ref.p90) {
      // Mayor al percentil 90
      const ratio = weightG / ref.p90;
      percentile = Math.min(99, Math.round(90 + (ratio - 1) * 9));
      percentileLabel = `Percentil ${percentile} (Por encima de P90)`;
      score -= 15;
      findings.push({
        label: 'Crecimiento Fetal (Peso)',
        value: `${weightG} g (Semana ${week})`,
        status: 'atencion',
        badge: 'Sospecha de Macrosomía / GEG (Grande)',
        detail: `El peso está por encima del percentil 90 de referencia (${ref.p90} g). Suele asociarse a factores constitucionales genéticos o metabolismo materno de glucosa.`,
      });
      recommendations.push('Revisa tus valores de glucosa en sangre o prueba de tolerancia oral a la glucosa con tu obstetra.');
      birthWeightPrediction = Math.round(3950 * (weightG / ref.p90));
    } else {
      // Entre percentil 10 y 90 (Adecuado para edad gestacional - AEG)
      if (weightG < ref.p50) {
        const factor = (weightG - ref.p10) / (ref.p50 - ref.p10);
        percentile = Math.round(10 + factor * 40);
      } else {
        const factor = (weightG - ref.p50) / (ref.p90 - ref.p50);
        percentile = Math.round(50 + factor * 40);
      }
      percentileLabel = `Percentil ${percentile} (Rango Ideal AEG)`;
      findings.push({
        label: 'Crecimiento Fetal (Peso)',
        value: `${weightG} g (Semana ${week})`,
        status: 'optimo',
        badge: 'Crecimiento Armonioso y Óptimo',
        detail: `Peso adecuado para la edad gestacional (AEG). Tu bebé se sitúa en el percentil ${percentile}, con un desarrollo ponderal idóneo.`,
      });
      // Proyección a semana 40
      birthWeightPrediction = Math.round(3180 + ((percentile - 10) / 80) * (3950 - 3180));
    }
  } else {
    // Estimación teórica si no hay peso en gramos
    findings.push({
      label: 'Crecimiento Fetal',
      value: `Semana ${week} de gestación`,
      status: 'optimo',
      badge: 'Desarrollo en curso',
      detail: `Promedio de referencia para la semana ${week}: peso ~${ref?.p50 || 1200} g y longitud ~${ref?.lengthCm || 37} cm.`,
    });
  }

  // 2. Frecuencia Cardíaca Fetal (FCF en lpm)
  if (fcf) {
    if (fcf < 110) {
      score -= 35;
      overallLevel = 'alerta';
      findings.push({
        label: 'Frecuencia Cardíaca Fetal (FCF)',
        value: `${fcf} lpm`,
        status: 'alerta',
        badge: 'Bradicardia Fetal',
        detail: 'La frecuencia cardíaca fetal está por debajo de 110 lpm. Esto es un signo de alerta que requiere monitoreo fetal inmediato.',
      });
      alerts.push('Bradicardia fetal (< 110 lpm). Acude a valoración de urgencias obstétricas para monitoreo continuo.');
    } else if (fcf > 175) {
      score -= 25;
      if (overallLevel !== 'alerta') overallLevel = 'alerta';
      findings.push({
        label: 'Frecuencia Cardíaca Fetal (FCF)',
        value: `${fcf} lpm`,
        status: 'alerta',
        badge: 'Taquicardia Fetal Marcada',
        detail: 'La frecuencia cardíaca está por encima de 175 lpm. Puede asociarse a fiebre materna, taquicardia o estrés fetal transitorio.',
      });
      alerts.push('Taquicardia fetal (> 175 lpm). Requiere verificación médica de temperatura materna y registro cardiotocográfico.');
    } else if (fcf > 160) {
      score -= 10;
      if (overallLevel !== 'alerta') overallLevel = 'atencion';
      findings.push({
        label: 'Frecuencia Cardíaca Fetal (FCF)',
        value: `${fcf} lpm`,
        status: 'atencion',
        badge: 'FCF Levemente Acelerada',
        detail: 'Frecuencia cardíaca en el límite superior (161-175 lpm). Frecuente si el bebé estaba pateando activamente o la mamá tenía calor.',
      });
      recommendations.push('Descansa en un ambiente fresco, hidrátate bien y repite la auscultación en reposo.');
    } else if (fcf < 120) {
      findings.push({
        label: 'Frecuencia Cardíaca Fetal (FCF)',
        value: `${fcf} lpm`,
        status: 'optimo',
        badge: 'Límite Normal en Reposo',
        detail: 'FCF en 110-120 lpm. Es normal en fases de sueño fetal profundo al tercer trimestre.',
      });
    } else {
      findings.push({
        label: 'Frecuencia Cardíaca Fetal (FCF)',
        value: `${fcf} lpm`,
        status: 'optimo',
        badge: 'Ritmo Reactivo y Fuerte',
        detail: 'FCF en rango ideal (120 - 160 lpm). Señal indiscutible de buena oxigenación y tono miocárdico fetal.',
      });
    }
  }

  // 3. Líquido Amniótico (ILA)
  if (amniotic === 'bajo') {
    score -= 20;
    if (overallLevel !== 'alerta') overallLevel = 'atencion';
    findings.push({
      label: 'Líquido Amniótico (ILA)',
      value: 'Disminuido (Oligohidramnios)',
      status: 'atencion',
      badge: 'Volumen Bajo',
      detail: 'El volumen de líquido amniótico está reducido. Es esencial aumentar la hidratación materna y vigilar la función placentaria.',
    });
    recommendations.push('Aumenta tu ingesta de líquidos a mínimo 2.5 - 3 litros de agua al día y guarda reposo relativo.');
  } else if (amniotic === 'aumentado') {
    score -= 10;
    if (overallLevel !== 'alerta') overallLevel = 'atencion';
    findings.push({
      label: 'Líquido Amniótico (ILA)',
      value: 'Aumentado (Polihidramnios)',
      status: 'atencion',
      badge: 'Volumen Alto',
      detail: 'Volumen de líquido amniótico por encima de lo esperado. Se recomienda evaluar curvas de glucosa materna y deglución.',
    });
  } else {
    findings.push({
      label: 'Líquido Amniótico (ILA)',
      value: 'Adecuado y Normal',
      status: 'optimo',
      badge: 'Volumen Óptimo',
      detail: 'Líquido amniótico suficiente para amortiguar al bebé, mantener temperatura constante y facilitar el ejercicio respiratorio fetal.',
    });
  }

  // 4. Movimientos Fetales
  if (movements === 'disminuido') {
    score -= 25;
    if (overallLevel !== 'alerta') overallLevel = 'atencion';
    findings.push({
      label: 'Movimientos Fetales',
      value: 'Disminuidos',
      status: 'atencion',
      badge: 'Actividad Baja',
      detail: 'Patrón de movimientos fetales reducido. Si notas menos de 10 movimientos en 2 horas tras comer, requiere evaluación médica.',
    });
    alerts.push('Movimientos fetales disminuidos. Come un refrigerio ligero, acuéstate de lado izquierdo y cuenta pataditas; consulta si persisten bajos.');
  } else {
    findings.push({
      label: 'Movimientos Fetales',
      value: movements === 'activo' ? 'Activo y Vigoroso 🦶' : 'Normal y Constante',
      status: 'optimo',
      badge: 'Excelente Vitalidad',
      detail: 'Los movimientos regulares reflejan integridad del sistema nervioso central y excelente oxigenación muscular.',
    });
  }

  // 5. Presentación y Placenta
  const presentationMap = {
    cefalica: 'Cefálica (Cabeza hacia abajo — Posición ideal)',
    podalica: 'Podálica / Pelviana (De nalgas o pies)',
    transversa: 'Transversa (Atravesado)',
  };
  findings.push({
    label: 'Presentación Fetal',
    value: presentationMap[presentation] || presentation,
    status: 'optimo',
    badge: week >= 34 && presentation === 'cefalica' ? 'Posición de Parto' : 'En evolución',
    detail: week < 32 
      ? 'Aún tiene amplio espacio para rotar y cambiar de posición con naturalidad.'
      : 'Posición acorde al último trimestre.',
  });

  // Diagnóstico Global y Predicción de Salud Fetal
  score = Math.max(20, Math.min(100, score));

  let predictionTitle = '🌟 ¡Tu bebé viene creciendo maravilloso y con excelente salud!';
  let predictionSummary = `A sus ${week} semanas de gestación, el bebé demuestra un desarrollo armónico. Su ritmo cardíaco es fuerte y reactivo, y su trayectoria ponderal se ubica en el ${percentileLabel}. Se proyecta un peso al nacer cercano a los ${(birthWeightPrediction / 1000).toFixed(2)} kg (semana 40).`;
  let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (overallLevel === 'alerta') {
    predictionTitle = '🚨 Alerta Fetal — Requiere Evaluación Médica Pronta';
    predictionSummary = `Se han identificado parámetros (como ritmo cardíaco o crecimiento) que precisan seguimiento obstétrico prioritario. Comunícate con tu especialista para un monitoreo fetal o ecografía complementaria.`;
    statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (overallLevel === 'atencion') {
    predictionTitle = '⚠️ Crecimiento Fetal con Seguimiento Preventivo';
    predictionSummary = `Tu bebé se encuentra activo, pero algunos valores biométricos o de líquido aconsejan seguimiento preventivo en tu próximo control ecográfico para asegurar su curva de ganancia de peso óptima.`;
    statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  recommendations.push('Habla y cántale a tu vientre: a partir del segundo trimestre el bebé ya reconoce las voces de sus padres.');
  recommendations.push('Realiza el conteo diario de pataditas en momentos de calma después de las comidas.');

  return {
    level: overallLevel,
    score,
    percentile,
    percentileLabel,
    birthWeightPredictionG: birthWeightPrediction,
    predictionTitle,
    predictionSummary,
    statusBadge,
    findings,
    alerts,
    recommendations,
    week,
    evaluatedAt: new Date().toISOString(),
  };
}
