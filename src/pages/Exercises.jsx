import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api, getFileUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORY_LABELS = {
  respiracion: 'Respiracion',
  movilidad: 'Movilidad',
  fuerza: 'Fuerza suave',
  suelo_pelvico: 'Suelo pelvico',
  posicion_parto: 'Posiciones de parto',
  relajacion: 'Relajacion',
  masaje: 'Masaje y apoyo',
};

function PlayIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const min = Math.round(seconds / 60);
  return min <= 1 ? '1 min' : `${min} min`;
}

function VideoArea({ exercise, onPlayed }) {
  if (exercise.videoSource === 'upload' && exercise.videoUrl) {
    return (
      <video
        key={exercise.id}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="w-full rounded-2xl bg-black aspect-video"
        src={getFileUrl(exercise.videoUrl)}
        poster={exercise.thumbnailUrl ? getFileUrl(exercise.thumbnailUrl) : undefined}
        onPlay={onPlayed}
      >
        Tu navegador no puede reproducir este video.
      </video>
    );
  }
  if (exercise.videoSource === 'youtube' && exercise.youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe
          key={exercise.id}
          title={exercise.title}
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(exercise.youtubeId)}?rel=0&modestbranding=1`}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          onLoad={onPlayed}
        />
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-2xl bg-primary-container/60 flex flex-col items-center justify-center text-on-primary-container text-center px-6">
      <PlayIcon className="w-10 h-10 opacity-60 mb-2" />
      <p className="font-body text-sm font-semibold">El video de este ejercicio llegara pronto</p>
      <p className="font-body text-xs mt-1 opacity-80">Mientras tanto, sigue los pasos escritos.</p>
    </div>
  );
}

function ExternalVideoLink({ exercise }) {
  if (!exercise.externalUrl) return null;
  const isVideo = exercise.externalKind === 'video';
  const report = () => {
    api.sendClientEvent({ type: 'video_externo_abierto', ref: exercise.id }).catch(() => {});
  };
  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-lilac-container/60 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-on-surface">
          {isVideo ? 'Video de referencia en YouTube' : 'Buscar videos de este ejercicio en YouTube'}
        </p>
        <p className="font-body text-xs text-on-surface-variant mt-0.5 truncate">
          {isVideo && exercise.externalTitle ? `${exercise.externalTitle} (contenido de terceros)` : 'Se abre YouTube en otra pestana.'}
        </p>
      </div>
      <a
        href={exercise.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={report}
        className="btn-primary !py-2.5 !px-4 text-xs font-semibold !w-auto inline-flex items-center justify-center gap-2"
      >
        <PlayIcon className="w-4 h-4" />
        <span>{isVideo ? 'Ver en YouTube' : 'Buscar en YouTube'}</span>
      </a>
    </div>
  );
}

function ExerciseDetail({ exercise, onClose }) {
  const reported = useRef(false);

  const handlePlayed = () => {
    if (reported.current) return;
    reported.current = true;
    api.sendClientEvent({ type: 'video_visto', ref: exercise.id }).catch(() => {});
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={exercise.title} onClick={onClose}>
      <div className="bg-surface w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-cloud p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="pill-chip bg-primary-container text-on-primary-container">{CATEGORY_LABELS[exercise.category] || 'Ejercicio'}</span>
            <h2 className="font-display text-xl sm:text-2xl font-semibold mt-2 text-on-surface">{exercise.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-full bg-surface-container text-on-surface-variant text-lg" aria-label="Cerrar">
            &times;
          </button>
        </div>

        <VideoArea exercise={exercise} onPlayed={handlePlayed} />
        <ExternalVideoLink exercise={exercise} />
        {exercise.sourceCredit && <p className="font-body text-[11px] text-outline mt-2">Fuente del video: {exercise.sourceCredit}</p>}

        <p className="font-body text-sm text-on-surface-variant mt-4 leading-relaxed">{exercise.description}</p>

        {exercise.steps.length > 0 && (
          <section className="mt-5">
            <h3 className="font-display text-base font-semibold mb-2">Paso a paso</h3>
            <ol className="flex flex-col gap-2">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex gap-3 font-body text-sm text-on-surface">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {exercise.laborBenefit && (
          <section className="mt-5 p-4 rounded-2xl bg-tertiary-container/60">
            <h3 className="font-display text-base font-semibold text-on-tertiary-container mb-1">Como ayuda en el parto</h3>
            <p className="font-body text-sm text-on-tertiary-container leading-relaxed">{exercise.laborBenefit}</p>
          </section>
        )}

        {exercise.precautions && (
          <section className="mt-4 p-4 rounded-2xl bg-error-container/40 border border-error/15">
            <h3 className="font-display text-base font-semibold text-on-error-container mb-1">Precauciones</h3>
            <p className="font-body text-xs text-on-error-container leading-relaxed">{exercise.precautions}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(exercise)} className="card !p-4 text-left flex gap-4 items-start hover:shadow-cloud-sm transition-shadow w-full">
      <span className="shrink-0 w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
        <PlayIcon className="w-6 h-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 mb-1">
          <span className="pill-chip !py-0.5 bg-secondary-container text-on-secondary-container">{CATEGORY_LABELS[exercise.category] || 'Ejercicio'}</span>
          {exercise.durationSeconds ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant font-semibold"><ClockIcon />{formatDuration(exercise.durationSeconds)}</span>
          ) : null}
          {!exercise.hasVideo && <span className="text-[11px] text-outline font-semibold">Solo guia escrita</span>}
        </span>
        <span className="block font-display text-base font-semibold text-on-surface leading-snug">{exercise.title}</span>
        <span className="block font-body text-xs text-on-surface-variant mt-1 line-clamp-2">{exercise.description}</span>
        {exercise.minWeek > 1 && <span className="block text-[11px] text-outline mt-1.5">Recomendado desde la semana {exercise.minWeek}</span>}
      </span>
    </button>
  );
}

export default function Exercises() {
  const { isPartnerLink } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(isPartnerLink ? 'papa' : 'mama');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.listExercises();
      setItems(res?.items || res?.exercises || []);
    } catch (err) {
      setItems([]);
      setError(err.message || 'No se pudieron cargar los ejercicios.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (!items) return [];
    return items.filter((e) => e.audience === 'ambos' || e.audience === tab);
  }, [items, tab]);

  const tabs = isPartnerLink
    ? [{ id: 'papa', label: 'Para papa' }]
    : [{ id: 'mama', label: 'Para mama' }, { id: 'papa', label: 'Para papa' }];

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-5">
        <h1 className="page-title">Ejercicios para el parto</h1>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">
          Videos cortos y guias para prepararse juntos: respiracion, movilidad, posiciones y apoyo.
        </p>
      </header>

      {tabs.length > 1 && (
        <div className="flex gap-2 mb-5" role="tablist" aria-label="Audiencia">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`pill-chip text-xs font-semibold ${tab === t.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'papa' && !isPartnerLink && (
        <p className="font-body text-xs text-on-surface-variant mb-4 p-3 rounded-2xl bg-secondary-container/40">
          Estos ejercicios los hace papa o tu acompanante durante el trabajo de parto. Puedes verlos juntos.
        </p>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <div className="card text-center py-10">
          <p className="font-body text-sm text-on-surface-variant">Aun no hay ejercicios publicados en esta seccion.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((e) => <ExerciseCard key={e.id} exercise={e} onOpen={setSelected} />)}
        </div>
      )}

      <p className="font-body text-[11px] text-outline mt-6 leading-relaxed">
        Contenido educativo general. No reemplaza la indicacion de tu medico, matrona o fisioterapeuta de suelo pelvico. Consulta antes de empezar cualquier rutina.
      </p>

      {selected && <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}
