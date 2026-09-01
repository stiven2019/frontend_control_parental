import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { api } from '../api/client';

const CATEGORY_LABELS = {
  control_medico: 'Control médico',
  medicamento: 'Medicamento',
  vitamina: 'Vitamina',
  ecografia: 'Ecografía',
  examen: 'Examen',
  cita: 'Cita',
  preparacion_parto: 'Preparación para el parto',
  evento_importante: 'Evento importante',
  otro: 'Evento',
};

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { events } = await api.getCalendarEvents();
      setEvents(events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const eventsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  if (loading) return <AppLayout><LoadingState label="Cargando tu calendario..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lunes=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const monthLabel = cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Mi calendario</h1>
      </header>

      <section className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">‹</button>
          <span className="font-body font-semibold capitalize">{monthLabel}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-on-surface-variant">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = eventsByDay[key] || [];
            const isSelected = selectedDay === key;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm relative ${
                  isSelected ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'
                }`}
              >
                {d}
                {dayEvents.length > 0 && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selectedDay ? (
        <section>
          <h3 className="font-display text-lg font-semibold mb-3">
            Eventos del {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
          </h3>
          {selectedEvents.length === 0 ? (
            <EmptyState icon="🗓️" title="Sin eventos este día" description="No tienes eventos programados." />
          ) : (
            <div className="flex flex-col gap-3">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="card !p-4 flex items-center gap-4">
                  <span className="text-xl">{ev.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold">{ev.title}</p>
                    {ev.subtitle && <p className="font-body text-xs text-on-surface-variant">{ev.subtitle}</p>}
                    <p className="font-body text-[11px] text-outline mt-0.5">{CATEGORY_LABELS[ev.type] || 'Evento'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <h3 className="font-display text-lg font-semibold mb-3">Próximos eventos</h3>
          <div className="flex flex-col gap-3">
            {(events || [])
              .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
              .slice(0, 8)
              .map((ev) => (
                <div key={ev.id} className="card !p-4 flex items-center gap-4">
                  <span className="text-xl">{ev.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold">{ev.title}</p>
                    <p className="font-body text-[11px] text-outline mt-0.5">{CATEGORY_LABELS[ev.type] || 'Evento'}</p>
                  </div>
                  <span className="font-body text-xs font-semibold text-primary shrink-0">
                    {new Date(ev.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
}
