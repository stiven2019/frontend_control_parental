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

const EMPTY_FORM = { title: '', category: 'vacuna_bebe', date: '', time: '09:00', repeatRule: 'ninguna', notify: true, notes: '' };

export default function Reminders() {
  const { refreshAlarms } = useAlarm();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { items } = await api.listReminders();
    setItems(items);
    refreshAlarms();
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createReminder({ ...form, time: form.time || null });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id) => { await api.completeReminder(id); await load(); };
  const remove = async (id) => { await api.deleteReminder(id); await load(); };


  if (!items) return <AppLayout><LoadingState /></AppLayout>;

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
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud-sm self-start sm:self-auto"
        >
          <span>{showForm ? '✕' : '+'}</span>
          <span>{showForm ? 'Cerrar formulario' : 'Nuevo Recordatorio'}</span>
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Nuevo recordatorio</h3>
          <div><label className="field-label">Nombre</label><input required className="input-field" value={form.title} onChange={set('title')} /></div>
          <div>
            <label className="field-label">Categoría</label>
            <select className="input-field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>
            <div><label className="field-label">Hora</label><input type="time" className="input-field" value={form.time} onChange={set('time')} /></div>
          </div>
          <div>
            <label className="field-label">Repetición</label>
            <select className="input-field" value={form.repeatRule} onChange={set('repeatRule')}>
              <option value="ninguna">No se repite</option>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.notify} onChange={set('notify')} className="w-4 h-4 accent-primary" />
            <span className="font-body text-sm">Notificarme</span>
          </label>
          <div><label className="field-label">Observaciones</label><textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar recordatorio'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState icon="⏰" title="Sin recordatorios" description="Crea recordatorios para no olvidar nada importante." />
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h3 className="font-display text-lg font-semibold mb-3">Pendientes</h3>
          <div className="flex flex-col gap-3">
            {pending.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={r.id} className="card !p-4 flex items-center gap-4">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold">{r.title}</p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {new Date(`${r.date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      {r.time ? ` · ${r.time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                  <button onClick={() => complete(r.id)} className="pill-chip bg-secondary-container text-on-secondary-container">Hecho</button>
                  <button onClick={() => remove(r.id)} className="text-outline text-xs">✕</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h3 className="font-display text-lg font-semibold mb-3 text-on-surface-variant">Completados</h3>
          <div className="flex flex-col gap-3 opacity-60">
            {done.map((r) => (
              <div key={r.id} className="card !p-4 flex items-center gap-4">
                <span className="text-xl">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold line-through">{r.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppLayout>
  );
}
