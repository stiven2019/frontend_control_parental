import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState, Banner } from '../components/States';
import { api } from '../api/client';
import ModuleIcon from '../components/ModuleIcons';
import { PageHeader, Fab } from '../components/PageParts';

const SYMPTOMS = [
  { field: 'nausea', label: 'Náuseas' },
  { field: 'headache', label: 'Dolor de cabeza' },
  { field: 'fatigue', label: 'Cansancio' },
  { field: 'backPain', label: 'Dolor de espalda' },
  { field: 'dizziness', label: 'Mareos' },
  { field: 'swelling', label: 'Hinchazón' },
  { field: 'moodChanges', label: 'Cambios de humor' },
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
      <PageHeader title="¿Cómo me siento hoy?" subtitle="Registra lo que sientes, a tu ritmo." />

      <Banner tone="info">
        Esta herramienta sirve únicamente para llevar un registro y no sustituye una valoración médica.
      </Banner>

      {warning && (
        <div className="mt-4">
          <Banner tone="warning">{warning}</Banner>
        </div>
      )}

      <Fab open={showForm} onClick={() => setShowForm((v) => !v)} label="Registrar síntomas" />

      {showForm && (
        <form onSubmit={handleSubmit} className="card my-6 flex flex-col gap-5">
          <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>

          {SYMPTOMS.map((s) => (
            <div key={s.field}>
              <label className="field-label">{s.label}</label>
              <div className="grid grid-cols-4 gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    type="button"
                    key={lvl.value}
                    onClick={() => setLevel(s.field, lvl.value)}
                    className={`py-2.5 rounded-2xl text-xs font-bold font-body transition-colors ${
                      form[s.field] === lvl.value ? 'bg-secondary-container text-on-secondary-container ring-2 ring-secondary' : 'bg-surface text-on-surface-variant'
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
          <EmptyState icon="pulse" title="Sin registros aún" description="Lleva un registro diario de cómo te sientes durante el embarazo." />
        </div>
      )}

      <div className="flex flex-col gap-3 mt-6">
        {items.map((log) => (
          <div key={log.id} className="card !p-4 sm:!p-5">
            <p className="font-body text-sm font-semibold mb-2">
              {new Date(`${log.date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.filter((s) => log[s.field] > 0).map((s) => (
                <span key={s.field} className="pill-chip bg-primary-container text-on-primary-container">
                  {s.label} · {LEVELS[log[s.field]].label}
                </span>
              ))}
              {SYMPTOMS.every((s) => log[s.field] === 0) && (
                <span className="pill-chip bg-secondary-container text-on-secondary-container"><ModuleIcon name="check" className="w-3.5 h-3.5" strokeWidth={2.4} />Sin síntomas notables</span>
              )}
            </div>
            {log.notes && <p className="font-body text-xs text-on-surface-variant mt-2">{log.notes}</p>}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
