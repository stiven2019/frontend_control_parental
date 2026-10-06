import React from 'react';

export default function MaternalHealthModal({ isOpen, onClose, assessment, controlData }) {
  if (!isOpen || !assessment) return null;

  const isAlert = assessment.level === 'alerta';
  const isWarning = assessment.level === 'atencion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-surface rounded-2xl shadow-cloud overflow-hidden flex flex-col border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con estado clínico */}
        <div className={`p-5 text-white ${
          isAlert 
            ? 'bg-gradient-to-r from-red-600 to-rose-700' 
            : isWarning 
            ? 'bg-gradient-to-r from-amber-600 to-orange-600' 
            : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-white/20 backdrop-blur-md">
                {isAlert ? '🚨' : isWarning ? '⚠️' : '💚'}
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Evaluación de Salud Materna
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold leading-tight">
                  {assessment.title}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors text-xl leading-none"
              title="Cerrar reporte"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-white/95 leading-relaxed bg-black/15 p-3 rounded-xl border border-white/10">
            {assessment.summary}
          </p>
        </div>

        {/* Cuerpo deslizable */}
        <div className="p-5 overflow-y-auto space-y-4 font-body">
          {/* Alertas prioritarias si existen */}
          {assessment.alarms && assessment.alarms.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <strong className="flex items-center gap-1.5 font-bold text-rose-700 text-sm">
                <span>⚠️</span> Atención médica requerida:
              </strong>
              {assessment.alarms.map((alarm, idx) => (
                <p key={idx} className="leading-relaxed pl-5 list-item">
                  {alarm}
                </p>
              ))}
            </div>
          )}

          {/* Desglose de Parámetros Médicos */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
              <span>🩺</span> Parámetros Clínicos del Control
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.indicators && assessment.indicators.map((ind, idx) => {
                const isBad = ind.status === 'alerta';
                const isWarn = ind.status === 'atencion';
                const isGood = ind.status === 'optimo';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isBad
                        ? 'bg-rose-50/60 border-rose-200'
                        : isWarn
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-white border-outline-variant/30 shadow-cloud-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-on-surface">
                        {ind.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBad
                            ? 'bg-rose-100 text-rose-800'
                            : isWarn
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ind.badge}
                      </span>
                    </div>
                    <p className="font-display font-bold text-base text-on-surface">
                      {ind.value}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                      {ind.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signos de Alarma Obstétrica */}
          <div className="p-3.5 rounded-xl bg-surface-container/40 border border-outline-variant/30">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-2">
              <span>🚩</span> Signos de Alarma para consultar a Urgencias:
            </h4>
            <ul className="text-[11px] text-on-surface-variant space-y-1 pl-4 list-disc leading-relaxed">
              {assessment.universalSigns?.map((sign, idx) => (
                <li key={idx}>{sign}</li>
              ))}
            </ul>
          </div>

          {/* Consejos y Cuidados para Mamá */}
          {assessment.tips && assessment.tips.length > 0 && (
            <div className="p-3.5 rounded-xl bg-primary-container/20 border border-primary/20">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2">
                <span>💡</span> Recomendaciones para tu bienestar:
              </h4>
              <ul className="text-[11px] text-on-surface-variant space-y-1 pl-4 list-disc leading-relaxed">
                {assessment.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container/30 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          <p className="text-[10px] text-on-surface-variant italic">
            * Este reporte es orientativo y complementa las indicaciones de tu médico tratante.
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
