import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api } from '../api/client';
import FetusViewer from '../components/FetusViewer';
import { estimateFromControls, referenceAt } from '../utils/fetalGrowth';
import { formatDay, todayStr } from '../utils/dates';

export default function PregnancyTimeline() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(null);
  const [growth, setGrowth] = useState(null);
  const currentRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTimeline();
      setData(res);
      setActiveWeek(res.currentWeek);
      // Estimaciones segun los controles del bebe (si el rol o el plan no permiten verlos, simplemente no se muestran)
      try {
        const [dash, ctrls] = await Promise.allSettled([api.getDashboard(), api.listControls()]);
        const pregnancy = dash.status === 'fulfilled' ? dash.value?.pregnancy : null;
        if (pregnancy?.lastMenstrualPeriod) {
          setGrowth(estimateFromControls({
            controls: ctrls.status === 'fulfilled' ? ctrls.value?.items || [] : [],
            lmp: pregnancy.lastMenstrualPeriod,
            officialDueDate: pregnancy.probableDeliveryDate,
            today: todayStr(),
          }));
        }
      } catch (_) { /* estimaciones opcionales */ }
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
  const weekRef = referenceAt(week.week);

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

      <FetusViewer
        week={week.week}
        onWeekChange={setActiveWeek}
        currentWeek={data.currentWeek}
        currentDays={growth ? growth.weeksToday * 7 : undefined}
        sizeLabel={week.development.size}
      />

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

      {growth && (
        <section className="card mb-6" aria-label="Estimaciones según los controles de tu bebé">
          <h2 className="font-display text-lg font-semibold mb-1">Tu bebé hoy, según tus controles</h2>
          <p className="font-body text-xs text-on-surface-variant mb-4">
            {growth.source === 'controles'
              ? `Calculado con tus controles: ${[
                growth.lastWeightDate && `peso del ${formatDay(growth.lastWeightDate, { day: 'numeric', month: 'short' })}`,
                growth.lastLengthDate && `estatura del ${formatDay(growth.lastLengthDate, { day: 'numeric', month: 'short' })}`,
              ].filter(Boolean).join(' y ')}. Si un control no trae peso o estatura, se mantiene el último dato conocido.`
              : 'Aún no hay peso ni estatura registrados en el control del bebé: se muestran los valores de referencia de tu semana.'}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-surface-container rounded-2xl py-3 px-2 text-center">
              <p className="text-[11px] text-on-surface-variant">Peso aprox.</p>
              <p className="font-display text-lg font-semibold">{growth.weightG >= 1000 ? `${(growth.weightG / 1000).toFixed(2)} kg` : `${growth.weightG} g`}</p>
            </div>
            <div className="bg-surface-container rounded-2xl py-3 px-2 text-center">
              <p className="text-[11px] text-on-surface-variant">Estatura aprox.</p>
              <p className="font-display text-lg font-semibold">{growth.lengthCm} cm</p>
            </div>
            <div className="bg-surface-container rounded-2xl py-3 px-2 text-center">
              <p className="text-[11px] text-on-surface-variant">Parto probable</p>
              <p className="font-display text-sm font-semibold leading-tight mt-1">
                {growth.dueDate ? formatDay(growth.dueDate, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin dato'}
              </p>
            </div>
          </div>
          {growth.source === 'controles' && growth.lanePercent !== null && (
            <p className="font-body text-xs text-on-surface-variant">
              {Math.abs(growth.lanePercent) <= 5
                ? 'Tu bebé crece muy cerca del promedio para su semana.'
                : growth.lanePercent > 0
                  ? `Tu bebé va aproximadamente ${growth.lanePercent}% por encima del peso promedio de su semana.`
                  : `Tu bebé va aproximadamente ${Math.abs(growth.lanePercent)}% por debajo del peso promedio de su semana.`}
            </p>
          )}
          {growth.dueShiftDays !== 0 && (
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Por su ritmo de crecimiento, la fecha orientativa se mueve {Math.abs(growth.dueShiftDays)} día{Math.abs(growth.dueShiftDays) === 1 ? '' : 's'} {growth.dueShiftDays < 0 ? 'antes' : 'después'} de la calculada con tu última menstruación.
            </p>
          )}
          <p className="font-body text-[11px] text-outline mt-3">
            Valores aproximados y educativos. La fecha oficial de parto y el peso reales los define tu médico en la ecografía.
          </p>
        </section>
      )}

      <p className="font-body text-xs text-outline text-center">
        La información de tamaño y desarrollo es educativa y aproximada; cada embarazo es distinto.
      </p>
    </AppLayout>
  );
}
