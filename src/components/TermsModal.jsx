import { useState, useEffect } from 'react';
import {
  TERMS_LAST_UPDATED,
  TERMS_VERSION,
  TERMS_SUMMARY_BULLETS,
  TERMS_SECTIONS
} from '../data/termsContent';

export default function TermsModal({ isOpen, onClose, onConfirm, initiallyAccepted = false }) {
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'summary'
  const [activeSection, setActiveSection] = useState(TERMS_SECTIONS[0].id);

  // Bloquear scroll de fondo mientras el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl h-[92vh] max-h-[92vh] flex flex-col bg-surface rounded-2xl shadow-2xl border border-primary/20 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-3.5 bg-surface-lowest border-b border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary-container/70 flex items-center justify-center text-lg shrink-0">
              📜
            </span>
            <div>
              <h2 id="terms-modal-title" className="font-display text-base sm:text-lg font-bold text-on-surface leading-tight">
                Términos y Condiciones y Protección de Datos
              </h2>
              <p className="font-body text-[11px] sm:text-xs text-on-surface-variant">
                Leyes 1581 de 2012 y 1480 de 2011 · Versión {TERMS_VERSION} ({TERMS_LAST_UPDATED})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Vista: Documento Completo vs Resumen */}
        <div className="px-5 sm:px-6 py-2 bg-surface-container/40 border-b border-surface-container flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'full'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              📜 Texto Legal Completo (7 Artículos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'summary'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              💡 Resumen Ejecutivo Rápido
            </button>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-on-surface-variant">
            🇨🇴 Marco Normativo Colombia
          </span>
        </div>

        {/* Navegación rápida de artículos si está en modo completo */}
        {activeTab === 'full' && (
          <div className="px-5 sm:px-6 py-2 bg-surface-lowest border-b border-surface-container flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 no-scrollbar">
            <span className="text-[11px] font-semibold text-on-surface-variant mr-1 shrink-0">Ir a:</span>
            {TERMS_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSection(sec.id);
                  const el = document.getElementById(`terms-modal-sec-${sec.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`pill-chip text-xs whitespace-nowrap !py-1 !px-2.5 transition-colors ${
                  activeSection === sec.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
                }`}
              >
                Art. {sec.number}
              </button>
            ))}
          </div>
        )}

        {/* Área de Lectura Principal (Ocupa la mayor parte del modal) */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-sm font-body text-on-surface leading-relaxed">
          {activeTab === 'summary' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary-container/30 border border-primary/20">
                <h3 className="font-display font-semibold text-sm text-primary mb-1">
                  Resumen de Compromisos y Derechos
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Este resumen destaca los principios esenciales que rigen la aplicación Mi Bebé bajo la legislación colombiana. Para conocer todos los detalles legales, puedes consultar la pestaña de Texto Completo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TERMS_SUMMARY_BULLETS.map((bullet, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-surface-container shadow-cloud-sm flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{bullet.icon}</span>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-on-surface mb-1">{bullet.title}</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{bullet.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-xs text-on-surface-variant space-y-2">
                <p className="font-semibold text-on-surface">🏛️ Autoridad de Control y Vigilancia:</p>
                <p>
                  Superintendencia de Industria y Comercio (SIC) — Delegatura para la Protección de Datos Personales.
                  Carrera 13 No. 27 - 00, Bogotá D.C. Línea gratuita nacional: 01 8000 910165. Portal web:{' '}
                  <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline">
                    www.sic.gov.co
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {TERMS_SECTIONS.map((sec) => (
                <section
                  key={sec.id}
                  id={`terms-modal-sec-${sec.id}`}
                  className={`scroll-mt-4 rounded-xl p-4 sm:p-5 transition-all ${
                    sec.highlight
                      ? 'bg-error-container/15 border-2 border-error/30 shadow-cloud-sm'
                      : 'bg-white border border-surface-container shadow-cloud-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        sec.highlight
                          ? 'bg-error text-on-error'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {sec.number}
                    </span>
                    <h3 className={`font-display font-bold text-base ${sec.highlight ? 'text-error' : 'text-on-surface'}`}>
                      {sec.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                    {sec.content.split('\n\n').map((para, pIdx) => {
                      const formatted = para.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="text-on-surface font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      });
                      return <p key={pIdx}>{formatted}</p>;
                    })}
                  </div>
                </section>
              ))}

              {/* Información Institucional */}
              <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-xs text-on-surface-variant space-y-1.5">
                <p className="font-semibold text-on-surface">🏛️ Autoridad de Control y Vigilancia en Colombia:</p>
                <p>
                  Superintendencia de Industria y Comercio (SIC) — Delegatura para la Protección de Datos Personales.
                  Carrera 13 No. 27 - 00, Bogotá D.C., Colombia. Portal web:{' '}
                  <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">
                    www.sic.gov.co
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior de Confirmación */}
        <div className="px-5 sm:px-6 py-3.5 bg-surface-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-on-surface-variant text-center sm:text-left">
            Al aceptar, otorgas tu consentimiento informado conforme a la <strong>Ley 1581 de 2012</strong>.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost !py-2.5 !px-4 text-xs font-semibold !w-auto"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              id="btn-confirm-terms"
              className="btn-primary !py-2.5 !px-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 !w-full sm:!w-auto bg-primary hover:opacity-95 shadow-md"
            >
              <span>✓</span>
              <span>{initiallyAccepted ? 'Mantener Aceptación' : 'Aceptar y Confirmar Términos'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
