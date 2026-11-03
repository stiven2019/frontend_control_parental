import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState, Banner } from '../components/States';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';
import ModuleIcon from '../components/ModuleIcons';
import { PageHeader, Fab } from '../components/PageParts';

const EMPTY_FORM = { name: '', dose: '', frequency: '', time: '', startDate: '', endDate: '', medicalIndications: '', prescribedBy: '' };

export default function Medications() {
  const { refreshAlarms } = useAlarm();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justTaken, setJustTaken] = useState(null);

  const load = async () => {
    try {
      const res = await api.listMedications();
      setItems(res?.items || []);
      refreshAlarms();
    } catch (err) {
      console.error('Error cargando medicamentos:', err);
      setItems([]);
      setError(err.message || 'No se pudieron cargar los medicamentos.');
    }
  };


  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.createMedication({ ...form, startDate: form.startDate || null, endDate: form.endDate || null, time: form.time || null });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markTaken = async (id) => {
    await api.markMedicationTaken(id);
    setJustTaken(id);
    refreshAlarms();
    setTimeout(() => setJustTaken(null), 2000);
  };

  const remove = async (id) => {
    await api.deleteMedication(id);
    await load();
  };


  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader title="Medicamentos y vitaminas" subtitle="Tus tomas del día, siempre a la mano." />

      <section className="hero-card mb-5 flex items-center gap-4 !from-lilac-container !to-primary-container">
        <span className="w-14 h-14 rounded-2xl bg-white/80 text-primary flex items-center justify-center shrink-0">
          <ModuleIcon name="pill" className="w-7 h-7" />
        </span>
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-wide">Registrados</p>
          <p className="font-display text-2xl font-semibold leading-tight">
            {items.length} {items.length === 1 ? 'medicamento' : 'medicamentos'}
          </p>
        </div>
      </section>

      <Banner tone="warning">
        Los medicamentos y dosis deben ser registrados según las indicaciones de tu profesional de salud. Esta app no recomienda ni modifica medicamentos.
      </Banner>

      {showForm && (
        <form onSubmit={handleSubmit} className="card my-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Agregar medicamento</h3>
          <div><label className="field-label">Nombre</label><input required className="input-field" value={form.name} onChange={set('name')} placeholder="Ej. Ácido fólico" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Dosis</label><input className="input-field" value={form.dose} onChange={set('dose')} placeholder="1 tableta" /></div>
            <div><label className="field-label">Frecuencia</label><input className="input-field" value={form.frequency} onChange={set('frequency')} placeholder="Diaria" /></div>
          </div>
          <div><label className="field-label">Hora</label><input type="time" className="input-field" value={form.time} onChange={set('time')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Fecha de inicio</label><input type="date" className="input-field" value={form.startDate} onChange={set('startDate')} /></div>
            <div><label className="field-label">Fecha de fin</label><input type="date" className="input-field" value={form.endDate} onChange={set('endDate')} /></div>
          </div>
          <div><label className="field-label">Indicaciones médicas</label><textarea className="input-field" rows={2} value={form.medicalIndications} onChange={set('medicalIndications')} /></div>
          <div><label className="field-label">Médico que lo formuló</label><input className="input-field" value={form.prescribedBy} onChange={set('prescribedBy')} /></div>
          {error && <p className="text-error text-sm font-body">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar medicamento'}</button>
        </form>
      )}

      <Fab open={showForm} onClick={() => setShowForm((v) => !v)} label="Agregar medicamento" />

      {items.length === 0 && !showForm && (
        <div className="mt-6">
          <EmptyState icon="pill" title="Sin medicamentos registrados" description="Agrega tus vitaminas o medicamentos indicados por tu médico." />
        </div>
      )}

      <div className="flex flex-col gap-3 mt-6">
        {items.map((m) => (
          <div key={m.id} className="card !p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="w-11 h-11 rounded-2xl bg-peach-container text-on-peach-container flex items-center justify-center shrink-0">
                <ModuleIcon name="pill" className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold">{m.name}</p>
                <p className="font-body text-sm text-on-surface-variant">{m.dose} {m.time ? `· ${m.time.slice(0, 5)}` : ''}</p>
                {m.prescribedBy && <p className="font-body text-xs text-outline mt-1">Formulado por {m.prescribedBy}</p>}
              </div>
              <button onClick={() => remove(m.id)} className="text-on-surface-variant text-xs font-semibold shrink-0 px-2 py-1 rounded-full hover:bg-surface-container">Eliminar</button>
            </div>
            <button
              onClick={() => markTaken(m.id)}
              className={`mt-4 w-full py-3 rounded-full font-body text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 ${
                justTaken === m.id ? 'bg-secondary text-on-secondary' : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              {justTaken === m.id ? (<><ModuleIcon name="check" className="w-4 h-4" strokeWidth={2.4} />Registrado</>) : 'Marcar como tomado'}
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
