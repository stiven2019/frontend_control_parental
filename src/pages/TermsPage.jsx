import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TERMS_LAST_UPDATED,
  TERMS_VERSION,
  TERMS_SUMMARY_BULLETS,
  TERMS_SECTIONS
} from '../data/termsContent';

export default function TermsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(TERMS_SECTIONS[0].id);

  return (
    <div className="min-h-screen bg-surface flex flex-col py-8 px-4 sm:px-6">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost !w-auto !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            ← Volver
          </button>
          <Link to="/" className="font-display text-lg font-semibold text-primary">
            Mi Bebé ❤️
          </Link>
        </div>

        {/* Encabezado Principal */}
        <header className="card mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-2xl">
              📜
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                Términos y Condiciones de Uso
              </h1>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant">
                Política de Tratamiento y Protección de Datos Personales · República de Colombia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-surface-container text-xs text-on-surface-variant">
            <span className="pill-chip bg-primary-container text-on-primary-container">
              🇨🇴 Ley 1581 de 2012
            </span>
            <span className="pill-chip bg-secondary-container text-on-secondary-container">
              Ley 1480 de 2011 (Consumidor)
            </span>
            <span className="pill-chip bg-tertiary-container text-on-tertiary-container">
              Res. 3280 de 2018 (MinSalud)
            </span>
            <span className="ml-auto text-[11px]">
              Versión {TERMS_VERSION} · Actualizado: {TERMS_LAST_UPDATED}
            </span>
          </div>
        </header>

        {/* Tarjetas de Resumen Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {TERMS_SUMMARY_BULLETS.map((bullet, idx) => (
            <div key={idx} className="card !p-4 flex items-start gap-3 border border-primary/10">
              <span className="text-2xl shrink-0">{bullet.icon}</span>
              <div>
                <h2 className="font-body font-semibold text-sm text-on-surface">{bullet.title}</h2>
                <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-snug">{bullet.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navegación Rápida */}
        <nav aria-label="Secciones de términos" className="card !p-3 mb-6 sticky top-4 z-20 shadow-cloud bg-white/95 backdrop-blur-md">
          <p className="font-body text-xs font-semibold text-on-surface-variant mb-2">Índice del documento:</p>
          <div className="flex gap-2 overflow-x-auto text-xs pb-1 no-scrollbar">
            {TERMS_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  const el = document.getElementById(`doc-sec-${sec.id}`);
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
        </nav>

        {/* Secciones del Documento */}
        <main className="space-y-6 flex-1">
          {TERMS_SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={`doc-sec-${sec.id}`}
              className={`card scroll-mt-24 transition-all ${
                sec.highlight
                  ? 'border-2 border-error/40 bg-error-container/10'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    sec.highlight
                      ? 'bg-error text-on-error'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  {sec.number}
                </span>
                <h2 className={`font-display font-semibold text-lg ${sec.highlight ? 'text-error' : 'text-on-surface'}`}>
                  {sec.title}
                </h2>
              </div>
              <div className="space-y-2.5 text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
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
          <div className="card !p-4 bg-surface-container/60 border border-outline-variant/40 text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold text-on-surface">🏛️ Autoridad de Control y Vigilancia en Colombia:</p>
            <p>
              Superintendencia de Industria y Comercio (SIC) — Delegatura para la Protección de Datos Personales.
              Carrera 13 No. 27 - 00, Bogotá D.C., Colombia. Conmutador: (+57 601) 587 00 00.
              Portal institucional:{' '}
              <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">
                www.sic.gov.co
              </a>
            </p>
          </div>
        </main>

        {/* Pie de página */}
        <footer className="mt-8 pt-6 border-t border-surface-container text-center text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Mi Bebé. Diseñado para el bienestar de la mamá y su bebé.</p>
          <div className="flex gap-4">
            <Link to="/crear-cuenta" className="text-primary font-semibold hover:underline">
              Crear cuenta
            </Link>
            <Link to="/iniciar-sesion" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
