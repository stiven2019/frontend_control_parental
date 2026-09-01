import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, Banner } from '../components/States';
import FormattedContent from '../components/FormattedContent';
import { api } from '../api/client';

export default function BabyDevelopmentGuide() {
  const [content, setContent] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedTrimester, setSelectedTrimester] = useState('Todos');

  useEffect(() => {
    api.getBabyCare().then((data) => {
      setContent(data);
      if (data?.content && data.content.length > 0) {
        setSelected(data.content[0]);
      }
    });
  }, []);

  if (!content) return <AppLayout><LoadingState label="Cargando guía de desarrollo..." /></AppLayout>;

  const trimesters = ['Todos', 'Primer Trimestre', 'Segundo Trimestre', 'Tercer Trimestre'];

  const filteredWeeks = (content.content || []).filter((item) => {
    if (selectedTrimester === 'Todos') return true;
    return item.trimester?.toLowerCase().includes(selectedTrimester.toLowerCase());
  });

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
          <span>👶</span>
          <span>Desarrollo del Bebé Semana a Semana</span>
        </h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Guía médica detallada del crecimiento fetal, hitos, pruebas clínicas y señales de parto.
        </p>
      </header>

      {content.disclaimer && (
        <Banner tone="info" className="mb-6">
          {content.disclaimer}
        </Banner>
      )}

      {/* Filtro por Trimestres */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5 md:mx-0 md:px-0">
        {trimesters.map((tri) => (
          <button
            key={tri}
            onClick={() => setSelectedTrimester(tri)}
            className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTrimester === tri
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
            }`}
          >
            {tri}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SIDEBAR — Lista de semanas */}
        <div className="md:col-span-1">
          <div className="card !p-0 md:sticky md:top-20 max-h-[72vh] overflow-y-auto rounded-2xl border border-outline-variant/30">
            <div className="p-3 bg-surface-container/60 border-b border-outline-variant/30">
              <span className="font-body text-xs font-semibold uppercase text-on-surface-variant tracking-wider">
                Etapas del embarazo ({filteredWeeks.length})
              </span>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {filteredWeeks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                    selected?.id === item.id
                      ? 'bg-primary-container/60 border-l-4 border-primary text-on-primary-container'
                      : 'hover:bg-surface-container/40 text-on-surface'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">🌱</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-sm">Semana {item.week}</span>
                      <span className="text-[10px] font-semibold text-primary uppercase">
                        {item.trimester?.split(' ')[0]}
                      </span>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT — Guía formateada */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {selected ? (
            <>
              {/* Header de la semana */}
              <div className="card !p-6 bg-white rounded-2xl border border-outline-variant/30">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="pill-chip bg-tertiary-container text-on-tertiary-container text-xs font-semibold">
                    {selected.trimester}
                  </span>
                  <span className="pill-chip bg-primary-container text-on-primary-container text-xs font-semibold">
                    Semana {selected.week}
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface mb-1">
                  {selected.title}
                </h2>
                <p className="font-body text-xs text-outline">{selected.category || 'Desarrollo fetal'}</p>
              </div>

              {/* Contenido con tablas markdown y viñetas */}
              <div className="card !p-6 md:!p-8 bg-white rounded-2xl border border-outline-variant/30">
                <FormattedContent text={selected.body} />
              </div>

              {/* Advertencias médicas */}
              {selected.warnings && selected.warnings.length > 0 && (
                <div className="card !p-6 bg-error-container/20 border border-error/30 rounded-2xl">
                  <h3 className="font-display font-bold text-base text-error flex items-center gap-2 mb-3">
                    <span>⚠️</span>
                    <span>Advertencias y cuidados para esta etapa:</span>
                  </h3>
                  <ul className="space-y-2">
                    {selected.warnings.map((warning, idx) => (
                      <li key={idx} className="font-body text-xs md:text-sm text-on-surface-variant flex items-start gap-2.5">
                        <span className="text-error font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botones de navegación Anterior / Siguiente */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const idx = content.content.findIndex((i) => i.id === selected.id);
                    if (idx > 0) setSelected(content.content[idx - 1]);
                  }}
                  disabled={content.content[0].id === selected.id}
                  className="btn-secondary !w-auto !py-3 !px-6 text-sm flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Semana Anterior</span>
                </button>
                <button
                  onClick={() => {
                    const idx = content.content.findIndex((i) => i.id === selected.id);
                    if (idx < content.content.length - 1) setSelected(content.content[idx + 1]);
                  }}
                  disabled={content.content[content.content.length - 1].id === selected.id}
                  className="btn-secondary !w-auto !py-3 !px-6 text-sm flex items-center gap-2 ml-auto"
                >
                  <span>Siguiente Semana</span>
                  <span>→</span>
                </button>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-on-surface-variant font-body text-sm">Selecciona una semana para ver la guía de desarrollo.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
