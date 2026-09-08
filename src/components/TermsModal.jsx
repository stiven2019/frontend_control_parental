import React, { useState, useEffect } from 'react';
import {
  TERMS_LAST_UPDATED,
  TERMS_VERSION,
  TERMS_SUMMARY_BULLETS,
  TERMS_SECTIONS
} from '../data/termsContent';

export default function TermsModal({ isOpen, onClose, onConfirm, initiallyAccepted = false }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface rounded-2xl shadow-2xl border border-primary/10 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-surface-lowest border-b border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary-container/70 flex items-center justify-center text-xl shrink-0">
              📜
            </span>
            <div>
              <h2 id="terms-modal-title" className="font-display text-lg sm:text-xl font-bold text-on-surface">
                Términos y Condiciones de Uso
              </h2>
              <p className="font-body text-xs text-on-surface-variant">
                Política de Protección de Datos Personales · <span className="font-semibold text-primary">Leyes 1581 de 2012 y 1480 de 2011 (Colombia)</span>
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

        {/* Resumen Clave Destacado */}
        <div className="px-6 py-3.5 bg-primary-container/25 border-b border-primary-container/40 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-body text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>🇨🇴</span> Aspectos Esenciales (Colombia)
            </span>
            <span className="font-body text-[11px] text-on-surface-variant bg-white/80 px-2 py-0.5 rounded-full">
              Versión {TERMS_VERSION} · Act. {TERMS_LAST_UPDATED}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {TERMS_SUMMARY_BULLETS.map((bullet, idx) => (
              <div key={idx} className="bg-white/80 rounded-lg p-2 flex items-start gap-2 border border-primary/10">
                <span className="text-base shrink-0">{bullet.icon}</span>
                <div>
                  <p className="font-semibold text-on-surface text-[12px]">{bullet.title}</p>
                  <p className="text-on-surface-variant text-[11px] leading-snug">{bullet.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navegación rápida de secciones */}
        <div className="px-6 py-2 bg-surface-lowest border-b border-surface-container flex gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          {TERMS_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveSection(sec.id);
                const el = document.getElementById(`terms-sec-${sec.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`pill-chip text-xs whitespace-nowrap transition-colors ${
                activeSection === sec.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
              }`}
            >
              {sec.number}. {sec.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Contenido Completo Desplazable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm font-body text-on-surface leading-relaxed">
          {TERMS_SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={`terms-sec-${sec.id}`}
              className={`scroll-mt-4 rounded-xl p-4 transition-all ${
                sec.highlight
                  ? 'bg-error-container/20 border-2 border-error/30'
                  : 'bg-white border border-surface-container'
              }`}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    sec.highlight
                      ? 'bg-error text-on-error'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  {sec.number}
                </span>
                <h3 className={`font-display font-semibold text-base ${sec.highlight ? 'text-error' : 'text-on-surface'}`}>
                  {sec.title}
                </h3>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                {sec.content.split('\n\n').map((para, pIdx) => {
                  // Renderizado básico con soporte de negritas simples y viñetas
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

          {/* Información Institucional y Autoridad de Vigilancia */}
          <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/40 text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold text-on-surface">🏛️ Autoridad de Control y Vigilancia en Colombia:</p>
            <p>
              Superintendencia de Industria y Comercio (SIC) — Delegatura para la Protección de Datos Personales. Carrera 13 No. 27 - 00, Bogotá D.C., Colombia. Portal web:{' '}
              <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                www.sic.gov.co
              </a>
            </p>
          </div>
        </div>

        {/* Barra de Acciones y Botón de Confirmación */}
        <div className="px-6 py-4 bg-surface-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-on-surface-variant text-center sm:text-left">
            Al confirmar, manifiestas haber leído y otorgar tu autorización libre y previa.
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
              className="btn-primary !py-2.5 !px-6 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 !w-full sm:!w-auto bg-primary hover:opacity-95"
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
