import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState, Banner } from '../components/States';
import { api } from '../api/client';

const SYMPTOMS = [
  { field: 'nausea', label: 'Náuseas', emoji: '🤢' },
  { field: 'headache', label: 'Dolor de cabeza', emoji: '🤕' },
  { field: 'fatigue', label: 'Cansancio', emoji: '😴' },
  { field: 'backPain', label: 'Dolor de espalda', emoji: '🦴' },
  { field: 'dizziness', label: 'Mareos', emoji: '💫' },
  { field: 'swelling', label: 'Hinchazón', emoji: '🦶' },
  { field: 'moodChanges', label: 'Cambios de humor', emoji: '🎭' },
];

const LEVELS = [
  { value: 0, label: 'Nada' },
  { value: 1, label: 'Leve' },
  { value: 2, label: 'Moderado' },
  { value: 3, label: 'Fuerte' },
];

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  nausea: 0, headache: 0, fatigue: 0, backPain: 0, dizziness: 0, swelling: 0, moodChanges: 0,
  appetite: 'normal', sleepQuality: 'buena', otherSymptoms: '', notes: '',
};

export default function Symptoms() {
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState(null);

  const load = async () => {
    try {
      const res = await api.listSymptoms();
      setItems(res?.items || []);
    } catch (err) {
      console.error('Error cargando síntomas:', err);
      setItems([]);
    }
  };


  useEffect(() => { load(); }, []);

  const setLevel = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setWarning(null);
    try {
      const res = await api.createSymptom(form);
      if (res.warning) setWarning(res.warning);
      setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">¿Cómo me siento hoy?</h1>
        <button onClick={() => setShowForm((s) => !s)} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl shrink-0">
          {showForm ? '×' : '+'}
        </button>
      </header>

      <Banner tone="info">
        Esta herramienta sirve únicamente para llevar un registro y no sustituye una valoración médica.
      </Banner>

      {warning && (
        <div className="mt-4">
          <Banner tone="warning">{warning}</Banner>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card my-6 flex flex-col gap-5">
          <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>

          {SYMPTOMS.map((s) => (
            <div key={s.field}>
              <label className="field-label">{s.emoji} {s.label}</label>
              <div className="grid grid-cols-4 gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    type="button"
                    key={lvl.value}
                    onClick={() => setLevel(s.field, lvl.value)}
                    className={`py-2 rounded-md text-xs font-semibold font-body transition-colors ${
                      form[s.field] === lvl.value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Apetito</label>
              <select className="input-field" value={form.appetite} onChange={set('appetite')}>
                <option value="bajo">Bajo</option>
                <option value="normal">Normal</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className="field-label">Sueño</label>
              <select className="input-field" value={form.sleepQuality} onChange={set('sleepQuality')}>
                <option value="mala">Mala</option>
                <option value="regular">Regular</option>
                <option value="buena">Buena</option>
              </select>
            </div>
          </div>

          <div><label className="field-label">Otros síntomas</label><input className="input-field" value={form.otherSymptoms} onChange={set('otherSymptoms')} /></div>
          <div><label className="field-label">Observaciones</label><textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} /></div>

          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar registro'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <div className="mt-6">
          <EmptyState icon="🌡️" title="Sin registros aún" description="Lleva un registro diario de cómo te sientes durante el embarazo." />
        </div>
      )}

      <div className="flex flex-col gap-3 mt-6">
        {items.map((log) => (
          <div key={log.id} className="card !p-4">
            <p className="font-body text-sm font-semibold mb-2">
              {new Date(`${log.date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.filter((s) => log[s.field] > 0).map((s) => (
                <span key={s.field} className="pill-chip bg-surface-container text-on-surface-variant">
                  {s.emoji} {s.label} · {LEVELS[log[s.field]].label}
                </span>
              ))}
              {SYMPTOMS.every((s) => log[s.field] === 0) && (
                <span className="pill-chip bg-secondary-container text-on-secondary-container">😊 Sin síntomas notables</span>
              )}
            </div>
            {log.notes && <p className="font-body text-xs text-on-surface-variant mt-2">{log.notes}</p>}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
