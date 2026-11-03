import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ModuleIcon from '../components/ModuleIcons';
import StoryScene from '../components/stories/StoryScene';
import { LoadingState, ErrorState } from '../components/States';
import { PageHeader } from '../components/PageParts';
import { api } from '../api/client';
import { LullabyPlayer } from '../utils/lullaby';

const ACCENT_BG = {
  lilac: 'bg-lilac-container text-on-lilac-container',
  peach: 'bg-peach-container text-on-peach-container',
  mint: 'bg-secondary-container text-on-secondary-container',
  blue: 'bg-tertiary-container text-on-tertiary-container',
};

const MUSIC_PREF = 'mibebe_story_music';
const readMusicPref = () => {
  try { return localStorage.getItem(MUSIC_PREF) !== 'off'; } catch (_) { return true; }
};
const writeMusicPref = (on) => {
  try { localStorage.setItem(MUSIC_PREF, on ? 'on' : 'off'); } catch (_) { /* sin almacenamiento */ }
};

export default function Stories() {
  const { slug } = useParams();
  return slug ? <StoryReader slug={slug} /> : <StoryList />;
}

// ------------------------------ Listado ------------------------------

function StoryList() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.listStories();
      setItems(res?.items || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los cuentos.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!items) return <AppLayout><LoadingState label="Abriendo la biblioteca de cuentos..." /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader title="Cuentos para soñar" subtitle="Historias con dibujos que se mueven y música suave para antes de dormir." />
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((s) => (
          <Link
            key={s.slug}
            to={`/cuentos/${s.slug}`}
            className="group card !p-0 overflow-hidden flex flex-col hover:shadow-float transition-shadow"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <StoryScene scene={s.coverScene} uid={`cover-${s.slug}`} label={`Portada de ${s.title}`} still />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <h2 className="font-display text-lg font-semibold leading-snug">{s.title}</h2>
              <p className="font-body text-sm text-on-surface-variant">{s.summary}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={`pill-chip ${ACCENT_BG[s.accent] || ACCENT_BG.lilac}`}>{s.minutes} min</span>
                <span className="pill-chip bg-surface-container text-on-surface-variant">{s.pageCount} páginas</span>
                {s.pageCount >= 12 && <span className="pill-chip bg-lilac-container text-on-lilac-container">Cuento largo</span>}
                <span className="pill-chip bg-surface-container text-on-surface-variant">{s.ageRange}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}

// ------------------------------ Lector tipo libro ------------------------------

function StoryReader({ slug }) {
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(-1); // -1 portada, 0..n-1 paginas, n fin
  const [dir, setDir] = useState('next');
  const [flipKey, setFlipKey] = useState(0);
  const [musicOn, setMusicOn] = useState(readMusicPref);
  const [volume, setVolume] = useState(0.5);
  const player = useRef(null);
  const touchX = useRef(null);
  const reported = useRef(false);

  useEffect(() => {
    let alive = true;
    setStory(null);
    setPage(-1);
    reported.current = false;
    api.getStory(slug)
      .then((res) => { if (alive) setStory(res.story); })
      .catch((err) => { if (alive) setError(err.message || 'No se pudo abrir el cuento.'); });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    player.current = new LullabyPlayer();
    return () => { player.current?.dispose(); player.current = null; };
  }, []);

  const total = story?.pages.length || 0;

  const startMusic = useCallback(() => {
    if (story && musicOn) player.current?.start(story.music);
  }, [story, musicOn]);

  const go = useCallback((next) => {
    if (!story) return;
    const target = Math.max(-1, Math.min(total, next));
    if (target === page) return;
    setDir(target > page ? 'next' : 'prev');
    setFlipKey((k) => k + 1);
    setPage(target);
    player.current?.chime();
    if (target === total && !reported.current) {
      reported.current = true;
      api.sendClientEvent({ type: 'cuento_leido', ref: story.slug }).catch(() => {});
    }
  }, [story, total, page]);

  const open = () => {
    startMusic();
    go(0);
  };

  const toggleMusic = async () => {
    const next = !musicOn;
    setMusicOn(next);
    writeMusicPref(next);
    if (next && page >= 0 && story) await player.current?.start(story.music);
    else player.current?.stop();
  };

  const changeVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    player.current?.setVolume(v);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, page]);

  if (error) return <AppLayout><ErrorState message={error} onRetry={() => navigate('/cuentos')} /></AppLayout>;
  if (!story) return <AppLayout><LoadingState label="Abriendo el cuento..." /></AppLayout>;

  const current = page >= 0 && page < total ? story.pages[page] : null;
  const flipClass = flipKey === 0 ? '' : dir === 'next' ? 'book-flip-next' : 'book-flip-prev';

  const onTouchStart = (e) => { touchX.current = e.changedTouches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(page + (dx < 0 ? 1 : -1));
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link to="/cuentos" className="inline-flex items-center gap-2 font-body text-sm font-bold text-primary">
          <ModuleIcon name="book" className="w-5 h-5" /> Biblioteca
        </Link>
        <div className="flex items-center gap-3">
          {musicOn && (
            <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
              <span className="sr-only">Volumen de la música</span>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} className="w-24 accent-primary" aria-label="Volumen de la música" />
            </label>
          )}
          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicOn}
            className={`h-11 px-4 rounded-full text-xs font-bold inline-flex items-center gap-2 shadow-cloud-sm ${musicOn ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant'}`}
          >
            <ModuleIcon name="bell" className="w-4 h-4" />
            {musicOn ? 'Música activada' : 'Música apagada'}
          </button>
        </div>
      </div>

      <div className="book-stage max-w-4xl mx-auto" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="rounded-lg bg-primary/15 p-2 sm:p-3 shadow-float">
          <div key={flipKey} className={`book-page rounded-md bg-[#fffdf8] overflow-hidden relative ${flipClass}`}>
            {page === -1 && <Cover story={story} onOpen={open} />}
            {current && <Spread story={story} page={current} index={page} total={total} />}
            {page === total && <TheEnd story={story} onRestart={() => go(-1)} />}
            {flipKey > 0 && (
              <div key={`shade-${flipKey}`} aria-hidden="true" className={`book-shade absolute inset-0 pointer-events-none ${dir === 'next' ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-black/35 via-transparent to-transparent`} />
            )}
            <div aria-hidden="true" className="hidden md:block absolute inset-y-0 left-[60%] w-6 -ml-3 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {page >= 0 && page < total && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => go(page - 1)} className="btn-secondary !w-auto !px-6" aria-label="Página anterior">
              Anterior
            </button>
            <div className="flex items-center gap-1.5" role="presentation">
              {story.pages.map((_, i) => (
                <span key={i} className={`h-2 rounded-full transition-all ${i === page ? 'w-6 bg-primary' : 'w-2 bg-primary/30'}`} />
              ))}
            </div>
            <button type="button" onClick={() => go(page + 1)} className="btn-primary !w-auto !px-6" aria-label="Página siguiente">
              {page === total - 1 ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Cover({ story, onOpen }) {
  return (
    <div className="grid md:grid-cols-5">
      <div className="aspect-[4/3] md:aspect-auto md:min-h-[460px] md:col-span-3 overflow-hidden">
        <StoryScene scene={story.coverScene} uid={`rc-${story.slug}`} label={`Portada de ${story.title}`} />
      </div>
      <div className="md:col-span-2 p-6 sm:p-10 flex flex-col justify-center items-center text-center gap-4 bg-gradient-to-br from-primary-container/40 to-lilac-container/40">
        <p className="font-body text-xs font-bold uppercase tracking-widest text-primary">Un cuento de Mi Bebé</p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-on-surface">{story.title}</h1>
        <p className="font-body text-sm text-on-surface-variant max-w-xs">{story.summary}</p>
        <button type="button" onClick={onOpen} className="btn-primary !w-auto !px-8 mt-2">Abrir el cuento</button>
      </div>
    </div>
  );
}

function Spread({ story, page, index, total }) {
  const words = page.text.split(' ');
  return (
    <div className="grid md:grid-cols-5">
      <div className="aspect-[4/3] md:aspect-auto md:min-h-[460px] md:col-span-3 overflow-hidden">
        <StoryScene scene={page.scene} uid={`p${index}-${story.slug}`} label={`Ilustración de la página ${index + 1}`} />
      </div>
      <div className="md:col-span-2 p-6 sm:p-10 flex flex-col justify-between gap-6 min-h-[200px]">
        <p className="font-display text-xl sm:text-2xl leading-relaxed text-on-surface" aria-label={page.text}>
          {words.map((w, i) => (
            <span key={i} aria-hidden="true" className="book-word" style={{ animationDelay: `${0.35 + i * 0.05}s` }}>
              {i === 0 ? (
                <>
                  <span className="text-4xl font-semibold text-primary mr-0.5 align-baseline">{w.charAt(0)}</span>
                  {w.slice(1)}
                </>
              ) : w}
              {i < words.length - 1 ? '\u00a0' : ''}
            </span>
          ))}
        </p>
        <div>
          <div className="h-1.5 rounded-full bg-primary/15 overflow-hidden" role="presentation">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
          <p className="font-body text-xs font-bold text-on-surface-variant text-center mt-2">{index + 1} de {total}</p>
        </div>
      </div>
    </div>
  );
}

function TheEnd({ story, onRestart }) {
  return (
    <div className="p-8 sm:p-14 text-center flex flex-col items-center gap-4 bg-gradient-to-br from-lilac-container/50 to-primary-container/40">
      <div className="w-40 h-32 rounded-lg overflow-hidden shadow-cloud">
        <StoryScene scene={{ sky: 'night', ground: 'hills', extras: ['stars', 'moon'], hero: { type: story.coverScene?.hero?.type || 'star', x: 50, y: story.coverScene?.hero?.type === 'star' ? 40 : 66, action: 'sleep' } }} uid="end" label="Fin del cuento" />
      </div>
      <h2 className="font-display text-3xl font-semibold">Fin</h2>
      <p className="font-body text-sm text-on-surface-variant max-w-xs">Dulces sueños. Gracias por leer juntos.</p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <button type="button" onClick={onRestart} className="btn-secondary !w-auto !px-6">Leer de nuevo</button>
        <Link to="/cuentos" className="btn-primary !w-auto !px-6">Más cuentos</Link>
      </div>
    </div>
  );
}
