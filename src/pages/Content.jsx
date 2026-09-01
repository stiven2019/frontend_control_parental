import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { LoadingState } from '../components/States';
import FormattedContent from '../components/FormattedContent';

export function ContentList({ title, emoji, subtitle, fetcher }) {
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetcher().then(setData);
  }, [fetcher]);

  const categories = useMemo(() => {
    if (!data?.content) return ['Todos'];
    const unique = Array.from(new Set(data.content.map((c) => c.category).filter(Boolean)));
    return ['Todos', ...unique];
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data?.content) return [];
    return data.content.filter((item) => {
      const matchCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [data, selectedCategory, searchQuery]);

  if (!data) return <LoadingState label="Cargando guías y cuidados..." />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span>{emoji}</span>
            <span>{title}</span>
          </h1>
          {subtitle && <p className="font-body text-sm text-on-surface-variant mt-1">{subtitle}</p>}
        </div>

        {/* Buscador */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar tema o síntoma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field !py-2.5 !px-4 text-sm"
          />
        </div>
      </header>

      {/* Selector de Categorías */}
      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`pill-chip px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista de Contenidos Formateados */}
      <div className="flex flex-col gap-6">
        {filteredItems.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="font-body text-sm font-semibold text-on-surface">No se encontraron resultados</p>
            <p className="font-body text-xs text-on-surface-variant mt-1">Prueba con otro término de búsqueda o categoría.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="card !p-6 md:!p-8 border border-outline-variant/30 hover:shadow-cloud transition-shadow bg-white rounded-2xl"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="pill-chip bg-secondary-container text-on-secondary-container text-xs font-semibold">
                  {item.category || 'Guía de Salud'}
                </span>
                {item.week && (
                  <span className="pill-chip bg-primary-container text-on-primary-container text-xs font-semibold">
                    Semana {item.week}
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface mb-4">
                {item.title}
              </h2>

              {/* Contenido formateado con soporte para tablas, títulos y viñetas */}
              <FormattedContent text={item.body} />

              {/* Advertencias adicionales si existen */}
              {item.warnings && item.warnings.length > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-error-container/20 border border-error/30">
                  <h4 className="font-display font-semibold text-sm text-error flex items-center gap-2 mb-2">
                    <span>⚠️</span>
                    <span>Advertencias médicas importantes:</span>
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {item.warnings.map((w, wIdx) => (
                      <li key={wIdx} className="font-body text-xs text-on-surface-variant flex items-start gap-2">
                        <span className="text-error mt-0.5">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Nota legal y disclaimer */}
      {data.disclaimer && (
        <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-center">
          <p className="font-body text-xs text-outline leading-relaxed">
            ℹ️ {data.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

export function MomCare() {
  return (
    <ContentList
      title="Cuidados de Mamá"
      subtitle="Nutrición, ejercicios recomendados, salud emocional y bienestar durante el embarazo."
      emoji="🌷"
      fetcher={api.getMomCare}
    />
  );
}

export function BabyCare() {
  return (
    <ContentList
      title="Cuidados y Desarrollo del Bebé"
      subtitle="Guía semana a semana del crecimiento fetal, señales de parto y cuidados esenciales."
      emoji="🍼"
      fetcher={api.getBabyCare}
    />
  );
}
