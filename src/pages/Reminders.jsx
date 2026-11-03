import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';
import ModuleIcon from '../components/ModuleIcons';
import { PageHeader, Fab } from '../components/PageParts';

const CATEGORIES = [
  { value: 'vacuna_bebe', label: 'Vacuna del bebé', icon: 'pill', tint: 'bg-peach-container text-on-peach-container' },
  { value: 'control_pediatrico', label: 'Control pediátrico', icon: 'steth', tint: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'cuidado_bebe', label: 'Cuidado / Rutina del bebé', icon: 'baby', tint: 'bg-primary-container text-on-primary-container' },
  { value: 'vitamina_bebe', label: 'Vitamina del bebé', icon: 'sprout', tint: 'bg-secondary-container text-on-secondary-container' },
  { value: 'medicamento', label: 'Medicamento mamá', icon: 'pill', tint: 'bg-lilac-container text-on-lilac-container' },
  { value: 'vitamina', label: 'Vitamina mamá', icon: 'pill', tint: 'bg-lilac-container text-on-lilac-container' },
  { value: 'control_medico', label: 'Control prenatal', icon: 'steth', tint: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'ecografia', label: 'Ecografía', icon: 'camera', tint: 'bg-secondary-container text-on-secondary-container' },
  { value: 'examen', label: 'Examen de laboratorio', icon: 'pulse', tint: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'cita', label: 'Cita médica', icon: 'calendar', tint: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'preparacion_parto', label: 'Preparación para el parto', icon: 'heart', tint: 'bg-primary-container text-on-primary-container' },
  { value: 'otro', label: 'Otro', icon: 'bell', tint: 'bg-peach-container text-on-peach-container' },
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
      <PageHeader
        title="Recordatorios y alarmas"
        subtitle="Avisos para vacunas, controles, medicamentos y rutinas."
      />
      <Fab
        open={showForm}
        label="Nuevo recordatorio"
        onClick={() => {
          setError(null);
          setShowForm((v) => !v);
        }}
      />

      {/* Banner de feedback positivo */}
      {feedback && (
        <div role="status" className="mb-4 p-3.5 rounded-3xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2">
          <ModuleIcon name="check" className="w-4 h-4" strokeWidth={2.4} /> {feedback}
        </div>
      )}

      {/* Banner de error general */}
      {error && !showForm && (
        <div role="alert" className="mb-4 p-3.5 rounded-3xl bg-error-container text-on-error-container text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><ModuleIcon name="alert" className="w-4 h-4" />{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar aviso" className="p-1"><ModuleIcon name="close" className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Nuevo recordatorio</h3>

          {error && (
            <div role="alert" className="p-3.5 rounded-3xl bg-error-container text-on-error-container text-xs font-bold">
              {error}
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
                  {c.label}
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

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-2xl bg-surface-container/60">
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
          icon="bell"
          title="Sin recordatorios pendientes"
          description="Crea recordatorios para vacunas del recién nacido, medicamentos, controles o citas importantes."
        />
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h3 className="section-title mb-3">Pendientes ({pending.length})</h3>
          <div className="flex flex-col gap-3">
            {pending.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={r.id} className="card !p-4 flex items-center gap-4">
                  <span className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center ${cat.tint}`}>
                    <ModuleIcon name={cat.icon} className="w-5 h-5" />
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
                      {r.repeatRule && r.repeatRule !== 'ninguna' ? ` · se repite ${r.repeatRule}` : ''}
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
                    Hecho
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-error shrink-0"
                    title="Eliminar recordatorio"
                    aria-label="Eliminar recordatorio"
                  >
                    <ModuleIcon name="close" className="w-4 h-4" />
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
                <span className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-secondary-container text-on-secondary-container"><ModuleIcon name="check" className="w-5 h-5" strokeWidth={2.4} /></span>
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
