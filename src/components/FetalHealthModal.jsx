import React from 'react';

export default function FetalHealthModal({ isOpen, onClose, assessment, controlData }) {
  if (!isOpen || !assessment) return null;

  const isAlert = assessment.level === 'alerta';
  const isWarning = assessment.level === 'atencion';
  const percentile = assessment.percentile || 50;
  const birthWeightKg = assessment.birthWeightPredictionG 
    ? (assessment.birthWeightPredictionG / 1000).toFixed(2)
    : '3.40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-surface rounded-2xl shadow-cloud overflow-hidden flex flex-col border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con estado fetal */}
        <div className={`p-5 text-white ${
          isAlert 
            ? 'bg-gradient-to-r from-red-600 to-rose-700' 
            : isWarning 
            ? 'bg-gradient-to-r from-amber-600 to-orange-600' 
            : 'bg-gradient-to-r from-primary to-rose-700'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-white/20 backdrop-blur-md">
                {isAlert ? '🚨' : isWarning ? '⚠️' : '🌟'}
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Pronóstico y Salud Gestacional del Bebé
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold leading-tight">
                  {assessment.predictionTitle}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors text-xl leading-none"
              title="Cerrar dictamen"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-white/95 leading-relaxed bg-black/15 p-3 rounded-xl border border-white/10">
            {assessment.predictionSummary}
          </p>
        </div>

        {/* Cuerpo deslizable */}
        <div className="p-5 overflow-y-auto space-y-4 font-body">
          {/* Tarjetas destacadas de predicción */}
          <div className="grid grid-cols-2 gap-3">
            {/* Percentil de crecimiento */}
            <div className="p-3.5 rounded-xl bg-primary-container/20 border border-primary/20 text-center">
              <span className="text-xl">📊</span>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mt-1">
                Percentil de Peso
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-primary">
                P{percentile}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                {percentile >= 10 && percentile <= 90 ? 'Adecuado (AEG)' : percentile < 10 ? 'Bajo (< P10)' : 'Grande (> P90)'}
              </p>
            </div>

            {/* Predicción de peso al nacer */}
            <div className="p-3.5 rounded-xl bg-secondary-container/20 border border-secondary/20 text-center">
              <span className="text-xl">⚖️</span>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mt-1">
                Predicción a Término
              </p>
              <p className="font-display text-xl sm:text-2xl font-bold text-secondary">
                ~{birthWeightKg} kg
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                Semana 40 estimada
              </p>
            </div>
          </div>

          {/* Barra visual de percentil fetal */}
          <div className="p-3.5 rounded-xl bg-white border border-outline-variant/30 shadow-cloud-sm">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-on-surface-variant">Escala de Crecimiento Intrauterino:</span>
              <span className="text-primary font-bold">{assessment.percentileLabel}</span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex relative">
              <div className="w-[10%] bg-amber-400" title="Bajo (< P10)" />
              <div className="w-[80%] bg-emerald-500" title="Óptimo / AEG (P10 - P90)" />
              <div className="w-[10%] bg-blue-400" title="Grande (> P90)" />
              {/* Marcador del percentil */}
              <div 
                className="absolute top-0 bottom-0 w-2.5 bg-black rounded-full border-2 border-white shadow-md transform -translate-x-1/2"
                style={{ left: `${Math.max(4, Math.min(96, percentile))}%` }}
                title={`Percentil ${percentile}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant font-medium mt-1">
              <span>P10 (Bajo)</span>
              <span className="text-emerald-700 font-bold">Rango Ideal Saludable (P10 a P90)</span>
              <span>P90 (Alto)</span>
            </div>
          </div>

          {/* Alertas si aplican */}
          {assessment.alerts && assessment.alerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <strong className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                <span>⚠️</span> Observaciones de seguimiento:
              </strong>
              {assessment.alerts.map((alert, idx) => (
                <p key={idx} className="leading-relaxed pl-5 list-item">
                  {alert}
                </p>
              ))}
            </div>
          )}

          {/* Hallazgos y mediciones del bebé */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
              <span>🔬</span> Parámetros Fetales Evaluados
            </h3>
            <div className="space-y-2">
              {assessment.findings?.map((find, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-outline-variant/30 shadow-cloud-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">{find.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        find.status === 'alerta'
                          ? 'bg-rose-100 text-rose-800'
                          : find.status === 'atencion'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {find.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      {find.detail}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="font-display font-bold text-sm text-primary">
                      {find.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones de estimulación y salud */}
          {assessment.recommendations && assessment.recommendations.length > 0 && (
            <div className="p-3.5 rounded-xl bg-tertiary-container/20 border border-tertiary/20">
              <h4 className="text-xs font-bold text-tertiary flex items-center gap-1.5 mb-2">
                <span>✨</span> Recomendaciones y Estimulación Prenatal:
              </h4>
              <ul className="text-[11px] text-on-surface-variant space-y-1.5 pl-4 list-disc leading-relaxed">
                {assessment.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container/30 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          <p className="text-[10px] text-on-surface-variant italic">
            * Predicción bioestadística orientativa basada en curvas de referencia Hadlock/OMS.
          </p>
          <button
            onClick={onClose}
            className="btn-primary !w-auto !py-2 !px-5 text-xs font-semibold shrink-0 rounded-full"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
