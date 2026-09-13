import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';

const CATEGORIES = [
  { value: 'vacuna_bebe', label: 'Vacuna del bebé', icon: '💉' },
  { value: 'control_pediatrico', label: 'Control pediátrico', icon: '🩺' },
  { value: 'cuidado_bebe', label: 'Cuidado / Rutina del bebé', icon: '👶' },
  { value: 'vitamina_bebe', label: 'Vitamina del bebé', icon: '🥄' },
  { value: 'medicamento', label: 'Medicamento mamá', icon: '💊' },
  { value: 'vitamina', label: 'Vitamina mamá', icon: '💊' },
  { value: 'control_medico', label: 'Control prenatal', icon: '🩺' },
  { value: 'ecografia', label: 'Ecografía', icon: '📷' },
  { value: 'examen', label: 'Examen de laboratorio', icon: '🧪' },
  { value: 'cita', label: 'Cita médica', icon: '📅' },
  { value: 'preparacion_parto', label: 'Preparación para el parto', icon: '🤰' },
  { value: 'otro', label: 'Otro', icon: '📌' },
];

const getTodayStr = () => new Date().toISOString().slice(0, 10);

const getEmptyForm = () => ({
  title: '',
  category: 'vacuna_bebe',
  date: getTodayStr(),
  time: '09:00',
  repeatRule: 'ninguna',
  notify: true,
  notes: '',
});

export default function Reminders() {
  const { refreshAlarms } = useAlarm();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    try {
      const res = await api.listReminders();
      setItems(res?.items || []);
      refreshAlarms();
    } catch (err) {
      console.error('Error cargando recordatorios:', err);
      setItems([]);
      setError(err.message || 'No se pudieron cargar los recordatorios.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createReminder({
        title: form.title.trim(),
        category: form.category,
        date: form.date,
        time: form.time ? form.time.slice(0, 5) : null,
        repeatRule: form.repeatRule,
        notify: Boolean(form.notify),
        notes: form.notes?.trim() || null,
      });

      setForm(getEmptyForm());
      setShowForm(false);
      setFeedback('¡Recordatorio guardado y programado con éxito!');
      setTimeout(() => setFeedback(null), 3500);
      await load();
    } catch (err) {
      console.error('Error guardando recordatorio:', err);
      setError(err.message || 'No pudimos guardar el recordatorio. Revisa los datos ingresados.');
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id) => {
    try {
      await api.completeReminder(id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al completar el recordatorio.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Deseas eliminar este recordatorio?')) return;
    try {
      await api.deleteReminder(id);
      await load();
    } catch (err) {
      alert(err.message || 'Error al eliminar el recordatorio.');
    }
  };

  if (!items) {
    return (
      <AppLayout>
        <LoadingState label="Cargando recordatorios..." />
      </AppLayout>
    );
  }

  const pending = items.filter((r) => !r.completed);
  const done = items.filter((r) => r.completed);

  return (
    <AppLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span>⏰</span>
            <span>Mis Recordatorios y Alarmas</span>
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Programa avisos para vacunas del bebé, controles pediátricos, medicamentos y rutinas.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowForm((s) => !s);
          }}
          className="btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud-sm self-start sm:self-auto"
        >
          <span>{showForm ? '✕' : '+'}</span>
          <span>{showForm ? 'Cerrar formulario' : 'Nuevo Recordatorio'}</span>
        </button>
      </header>

      {/* Banner de feedback positivo */}
      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs font-semibold flex items-center gap-2">
          <span>✓</span> {feedback}
        </div>
      )}

      {/* Banner de error general */}
      {error && !showForm && (
        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-semibold flex items-center justify-between gap-2">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Nuevo recordatorio</h3>

          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="field-label">Nombre del Recordatorio</label>
            <input
              required
              className="input-field"
              placeholder="Ej. Vacuna Neumococo, Tomar Ácido Fólico, etc."
              value={form.title}
              onChange={set('title')}
            />
          </div>

          <div>
            <label className="field-label">Categoría</label>
            <select className="input-field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Fecha</label>
              <input
                type="date"
                required
                className="input-field"
                value={form.date}
                onChange={set('date')}
              />
            </div>
            <div>
              <label className="field-label">Hora de la Alarma</label>
              <input
                type="time"
                className="input-field"
                value={form.time}
                onChange={set('time')}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Frecuencia de Repetición</label>
            <select className="input-field" value={form.repeatRule} onChange={set('repeatRule')}>
              <option value="ninguna">No se repite (una sola vez)</option>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-surface-container/60 border border-outline-variant/30">
            <input
              type="checkbox"
              checked={form.notify}
              onChange={set('notify')}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="font-body text-xs sm:text-sm font-semibold text-on-surface">
              Activar notificación y alarma sonora para este recordatorio
            </span>
          </label>

          <div>
            <label className="field-label">Observaciones (Opcional)</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Notas, dosis o indicaciones adicionales..."
              value={form.notes}
              onChange={set('notes')}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !w-auto !py-2.5 !px-6 text-sm font-semibold"
            >
              {saving ? 'Guardando...' : 'Guardar Recordatorio'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="btn-ghost !w-auto !py-2.5 !px-4 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState
          icon="⏰"
          title="Sin recordatorios pendientes"
          description="Crea recordatorios para vacunas del recién nacido, medicamentos, controles o citas importantes."
        />
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h3 className="font-display text-lg font-semibold mb-3">Pendientes ({pending.length})</h3>
          <div className="flex flex-col gap-3">
            {pending.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={r.id} className="card !p-4 flex items-center gap-4">
                  <span className="text-2xl shrink-0 p-2 rounded-xl bg-surface-container">
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-on-surface truncate">{r.title}</p>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {new Date(`${r.date}T00:00:00`).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {r.time ? ` · ${r.time.slice(0, 5)}` : ''}
                      {r.repeatRule && r.repeatRule !== 'ninguna' ? ` · 🔁 ${r.repeatRule}` : ''}
                    </p>
                    {r.notes && (
                      <p className="font-body text-xs text-on-surface-variant/80 mt-1 italic line-clamp-1">
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => complete(r.id)}
                    className="pill-chip bg-secondary-container text-on-secondary-container hover:opacity-80 shrink-0"
                    title="Marcar como completado"
                  >
                    Hecho ✓
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-error text-xs shrink-0"
                    title="Eliminar recordatorio"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h3 className="font-display text-lg font-semibold mb-3 text-on-surface-variant">
            Completados ({done.length})
          </h3>
          <div className="flex flex-col gap-3 opacity-60">
            {done.map((r) => (
              <div key={r.id} className="card !p-4 flex items-center gap-4">
                <span className="text-xl shrink-0">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold line-through text-on-surface">{r.title}</p>
                  <p className="font-body text-xs text-on-surface-variant">
                    {new Date(`${r.date}T00:00:00`).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="text-outline hover:text-error text-xs px-2 py-1"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
}
