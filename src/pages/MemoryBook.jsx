import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState, ErrorState } from '../components/States';
import { api, getFileUrl, downloadAlbumZip } from '../api/client';
import '../styles/memory-book.css';

function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).length <= 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

// Solo se muestran fotos alojadas en el almacenamiento propio de la app
function safePhoto(url) {
  return typeof url === 'string' && url.includes('/mibebe-media/') ? getFileUrl(url) : null;
}

function HeartIcon({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.6 4.5 6.1 4.5c2 0 3.4 1.1 4.2 2.4.3.5 1.1.5 1.4 0 .8-1.3 2.2-2.4 4.2-2.4 3.5 0 5.2 3.7 3.7 7.2C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m12 2.5 2.6 6 6.4.6-4.9 4.2 1.5 6.3L12 16.2 6.4 19.6l1.5-6.3L3 9.1l6.4-.6L12 2.5Z" />
    </svg>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-5 text-center">
      <span className="inline-flex text-primary mb-1"><StarIcon /></span>
      <h2 className="font-display text-2xl font-semibold text-primary">{children}</h2>
      {subtitle && <p className="font-body text-xs text-on-surface-variant mt-1">{subtitle}</p>}
    </div>
  );
}

function Tile({ value, label, tone }) {
  const tones = {
    a: 'bg-primary-container text-on-primary-container',
    b: 'bg-secondary-container text-on-secondary-container',
    c: 'bg-tertiary-container text-on-tertiary-container',
  };
  return (
    <div className={`memory-card rounded-3xl p-4 text-center ${tones[tone]}`}>
      <p className="font-display text-2xl font-bold leading-none">{value}</p>
      <p className="font-body text-[11px] font-semibold mt-2 leading-snug">{label}</p>
    </div>
  );
}

function Metrics({ book }) {
  const u = book.usage;
  const max = Math.max(1, ...u.byModule.map((m) => m.seconds));
  return (
    <section className="memory-section mb-12">
      <SectionTitle subtitle={u.trackedSince ? `Desde el ${formatDate(u.trackedSince)}` : undefined}>{book.sections.metrics.title}</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile value={u.totalLabel || "Recien empezamos"} label="de tiempo juntos en la app" tone="a" />
        <Tile value={u.activeDays} label={u.activeDays === 1 ? 'dia activa' : 'dias activa'} tone="b" />
        <Tile value={u.longestStreak} label="dias seguidos, tu mejor racha" tone="c" />
        <Tile value={u.totalInteractions} label="momentos que guardaste" tone="a" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Tile value={u.sessions} label="visitas a la app" tone="b" />
        <Tile value={u.avgSessionLabel || "-"} label="duracion promedio de cada visita" tone="c" />
      </div>

      {u.byModule.length > 0 && (
        <div className="memory-card card mt-5">
          <h3 className="font-display text-base font-semibold mb-3">Donde pasaste mas tiempo</h3>
          <ul className="flex flex-col gap-3">
            {u.byModule.slice(0, 6).map((m) => (
              <li key={m.key}>
                <div className="flex items-baseline justify-between font-body text-xs mb-1">
                  <span className="font-semibold text-on-surface">{m.label}</span>
                  <span className="text-on-surface-variant">{m.durationLabel}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.round((m.seconds / max) * 100))}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {u.favoriteMoment && (
        <p className="font-body text-xs text-on-surface-variant text-center mt-4">Tu momento favorito para abrir la app: {u.favoriteMoment}.</p>
      )}
    </section>
  );
}

function Timeline({ book }) {
  return (
    <section className="memory-section mb-12">
      <SectionTitle subtitle={`Del primer dia al encuentro con ${book.baby.label}`}>{book.sections.timeline.title}</SectionTitle>
      <ol className="relative border-l-2 border-primary-container ml-3 flex flex-col gap-5">
        {book.timeline.map((item, i) => (
          <li key={`${item.date}-${i}`} className="memory-tl-item ml-6 relative">
            <span className={`absolute -left-[34px] top-1 w-5 h-5 rounded-full border-4 border-surface ${item.future ? 'bg-secondary-container' : 'bg-primary'}`} />
            <div className="memory-card card !p-4">
              <p className="font-body text-[11px] font-semibold text-primary">
                {formatDate(item.date)}
                {typeof item.week === 'number' ? ` · semana ${item.week}` : ''}
                {item.future ? ' · pronto' : ''}
              </p>
              <h3 className="font-display text-base font-semibold text-on-surface mt-0.5">{item.title}</h3>
              {item.text && <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">{item.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Moments({ book }) {
  if (!book.moments.length) {
    return (
      <section className="memory-section mb-12">
        <SectionTitle>{book.sections.moments.title}</SectionTitle>
        <p className="font-body text-sm text-on-surface-variant text-center">Cuando guardes fotos y notas en la app, tus momentos favoritos apareceran aqui.</p>
      </section>
    );
  }
  return (
    <section className="memory-section mb-12">
      <SectionTitle>{book.sections.moments.title}</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        {book.moments.map((m, i) => {
          const src = safePhoto(m.photoUrl);
          return (
            <figure key={`${m.date}-${i}`} className="memory-moment memory-card card !p-3">
              {src && (
                <img src={src} alt={m.title} loading="lazy" referrerPolicy="no-referrer" className="w-full aspect-[4/3] object-cover rounded-2xl bg-surface-container" />
              )}
              <figcaption className="px-1 pt-3 pb-1">
                <p className="font-body text-[11px] font-semibold text-primary">
                  {formatDate(m.date)}{typeof m.week === 'number' ? ` · semana ${m.week}` : ''}
                </p>
                <h3 className="font-display text-base font-semibold text-on-surface mt-0.5">{m.title}</h3>
                {m.text && <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">{m.text}</p>}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function Story({ title, paragraphs, stats }) {
  return (
    <section className="memory-section mb-12">
      <SectionTitle>{title}</SectionTitle>
      <div className="memory-card card flex flex-col gap-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="font-body text-sm text-on-surface leading-relaxed">{p}</p>
        ))}
      </div>
      {stats?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {stats.map((s, i) => <Tile key={i} value={s.value} label={s.label} tone={['a', 'b', 'c'][i % 3]} />)}
        </div>
      )}
    </section>
  );
}

function Help({ book }) {
  return (
    <section className="memory-section mb-12">
      <SectionTitle>{book.sections.help.title}</SectionTitle>
      <p className="font-body text-sm text-on-surface-variant text-center mb-4">{book.sections.help.intro}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {book.modules.map((m) => (
          <div key={m.key} className="memory-card card !p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-on-surface">{m.label}</h3>
              {m.stat && (
                <span className="shrink-0 text-right">
                  <span className="block font-display text-lg font-bold text-primary leading-none">{m.stat.value}</span>
                  <span className="block font-body text-[10px] text-on-surface-variant mt-0.5">{m.stat.label}</span>
                </span>
              )}
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-2 leading-relaxed">{m.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MemoryBook() {
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [zipState, setZipState] = useState({ busy: false, message: '' });

  const load = useCallback(async () => {
    setError('');
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.getMemoryBook(tz);
      setBook(res.book);
    } catch (err) {
      setError(err.needsSetup ? 'Configura tu embarazo para empezar tu libro de recuerdos.' : (err.message || 'No pudimos preparar tu libro de recuerdos.'));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => {
    api.sendClientEvent({ type: 'recuerdo_descargado' }).catch(() => {});
    window.print();
  };

  const handleZip = async () => {
    setZipState({ busy: true, message: '' });
    try {
      const { blob, fileName } = await downloadAlbumZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setZipState({ busy: false, message: 'Tu album se descargo correctamente.' });
    } catch (err) {
      setZipState({ busy: false, message: err.message || 'No se pudo descargar el album.' });
    }
  };

  const generated = useMemo(() => (book ? formatDate(book.generatedAt) : ''), [book]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface px-5 py-10 max-w-xl mx-auto">
        <ErrorState message={error} onRetry={load} />
        <Link to="/inicio" className="btn-ghost mt-4">Volver al inicio</Link>
      </div>
    );
  }
  if (!book) return <div className="min-h-screen bg-surface"><LoadingState label="Preparando tu libro de recuerdos..." /></div>;

  return (
    <div className="memory-book min-h-screen bg-surface">
      <div className="no-print sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/40">
        <div className="max-w-3xl mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <Link to="/inicio" aria-label="Volver al inicio" className="icon-btn"><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg></Link>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleZip} disabled={zipState.busy} className="pill-chip !py-2.5 !px-4 bg-secondary-container text-on-secondary-container disabled:opacity-60">
              {zipState.busy ? 'Preparando ZIP...' : 'Descargar fotos (ZIP)'}
            </button>
            <button type="button" onClick={handlePrint} className="pill-chip !py-2.5 !px-4 bg-primary text-on-primary">Guardar como PDF</button>
          </div>
        </div>
        {zipState.message && <p role="status" className="max-w-3xl mx-auto px-5 pb-2 font-body text-xs text-on-surface-variant">{zipState.message}</p>}
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-16">
        <header className="memory-cover rounded-b-[3rem] -mx-5 px-8 py-16 text-center min-h-[70vh] flex flex-col items-center justify-center mb-12">
          <span className="text-primary mb-4"><HeartIcon className="w-14 h-14" /></span>
          <p className="font-body text-xs font-semibold tracking-widest uppercase text-on-primary-container">Libro de recuerdos</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mt-3 leading-tight">{book.cover.title}</h1>
          <p className="font-body text-sm text-on-surface-variant mt-3 max-w-xs">{book.cover.subtitle}</p>
          {book.baby.photoUrl && safePhoto(book.baby.photoUrl) && (
            <img src={safePhoto(book.baby.photoUrl)} alt="" referrerPolicy="no-referrer" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-cloud mt-6" />
          )}
          <p className="font-body text-[11px] text-on-surface-variant mt-8">Creado el {generated}</p>
        </header>

        <Metrics book={book} />
        <Timeline book={book} />
        <Moments book={book} />
        <Story title={book.sections.pregnancy.title} paragraphs={book.sections.pregnancy.paragraphs} />
        <Story title={book.sections.postpartum.title} paragraphs={book.sections.postpartum.paragraphs} stats={book.sections.postpartum.stats} />
        <Help book={book} />

        <footer className="text-center pt-6">
          <span className="text-primary inline-flex"><HeartIcon className="w-6 h-6" /></span>
          <p className="font-display text-lg text-primary mt-2">Gracias por dejarnos ser parte de tu historia</p>
          <p className="font-body text-[11px] text-on-surface-variant mt-1">Mi Bebe - Control prenatal y salud infantil</p>
        </footer>
      </div>
    </div>
  );
}
