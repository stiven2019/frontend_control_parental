import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api } from '../api/client';

export default function PregnancyTimeline() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(null);
  const currentRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTimeline();
      setData(res);
      setActiveWeek(res.currentWeek);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (data && currentRef.current) {
      currentRef.current.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [data]);

  if (loading) return <AppLayout><LoadingState label="Cargando tu línea de tiempo..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;

  const week = data.weeks.find((w) => w.week === activeWeek) || data.weeks[0];

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Mi embarazo</h1>
        <p className="font-body text-on-surface-variant mt-1">Semana 1 a la semana 40, a tu ritmo.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-5 px-5 md:mx-0 md:px-0">
        {data.weeks.map((w) => (
          <button
            key={w.week}
            ref={w.week === data.currentWeek ? currentRef : null}
            onClick={() => setActiveWeek(w.week)}
            className={`shrink-0 w-14 h-16 rounded-md flex flex-col items-center justify-center gap-0.5 font-body transition-colors ${
              w.week === activeWeek
                ? 'bg-primary text-on-primary'
                : w.week === data.currentWeek
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="text-[10px] uppercase font-semibold">Sem</span>
            <span className="text-lg font-semibold">{w.week}</span>
          </button>
        ))}
      </div>

      <section className="card mb-6">
        <span className="pill-chip bg-tertiary-container text-on-tertiary-container mb-3">{week.trimesterLabel}</span>
        <h2 className="font-display text-2xl font-semibold mb-1">Semana {week.week}</h2>
        {week.isCurrent && <p className="font-body text-xs text-primary font-semibold mb-3">Tu semana actual</p>}

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-surface-container rounded-md py-3 text-center">
            <p className="text-xs text-on-surface-variant">Tamaño aprox.</p>
            <p className="font-semibold capitalize">{week.development.size}</p>
          </div>
          <div className="bg-surface-container rounded-md py-3 text-center">
            <p className="text-xs text-on-surface-variant">Longitud / Peso</p>
            <p className="font-semibold">{week.development.lengthCm} cm · {week.development.weightG} g</p>
          </div>
        </div>

        <p className="font-body text-sm text-on-surface-variant">{week.development.note}</p>
      </section>

      <p className="font-body text-xs text-outline text-center">
        La información de tamaño y desarrollo es educativa y aproximada; cada embarazo es distinto.
      </p>
    </AppLayout>
  );
}
