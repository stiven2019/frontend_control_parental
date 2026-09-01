import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { api } from '../api/client';
import { useAlarm } from '../context/AlarmContext';

const EMPTY_FORM = {
  date: '', time: '', doctorName: '', specialty: '', place: '', reason: '',
  weightKg: '', bloodPressure: '', heartRate: '', uterineHeightCm: '',
  observations: '', recommendations: '', nextAppointment: '',
};

export default function MedicalControls() {
  const { refreshAlarms } = useAlarm();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await api.listControls();
      setItems(items);
      refreshAlarms();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createControl({
        ...form,
        weightKg: form.weightKg || null,
        heartRate: form.heartRate || null,
        uterineHeightCm: form.uterineHeightCm || null,
        nextAppointment: form.nextAppointment || null,
        time: form.time || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.deleteControl(id);
    await load();
  };


  if (loading) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Controles médicos</h1>
        <button onClick={() => setShowForm((s) => !s)} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl shrink-0">
          {showForm ? '×' : '+'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Agregar control</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>
            <div><label className="field-label">Hora</label><input type="time" className="input-field" value={form.time} onChange={set('time')} /></div>
          </div>
          <div><label className="field-label">Médico</label><input className="input-field" value={form.doctorName} onChange={set('doctorName')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Especialidad</label><input className="input-field" value={form.specialty} onChange={set('specialty')} /></div>
            <div><label className="field-label">Lugar</label><input className="input-field" value={form.place} onChange={set('place')} /></div>
          </div>
          <div><label className="field-label">Motivo de consulta</label><input className="input-field" value={form.reason} onChange={set('reason')} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="field-label">Peso (kg)</label><input type="number" step="0.1" className="input-field" value={form.weightKg} onChange={set('weightKg')} /></div>
            <div><label className="field-label">Presión arterial</label><input className="input-field" placeholder="120/80" value={form.bloodPressure} onChange={set('bloodPressure')} /></div>
            <div><label className="field-label">FC (lpm)</label><input type="number" className="input-field" value={form.heartRate} onChange={set('heartRate')} /></div>
          </div>
          <div><label className="field-label">Altura uterina (cm)</label><input type="number" step="0.1" className="input-field" value={form.uterineHeightCm} onChange={set('uterineHeightCm')} /></div>
          <div><label className="field-label">Observaciones</label><textarea className="input-field" rows={2} value={form.observations} onChange={set('observations')} /></div>
          <div><label className="field-label">Recomendaciones del médico</label><textarea className="input-field" rows={2} value={form.recommendations} onChange={set('recommendations')} /></div>
          <div><label className="field-label">Próxima cita</label><input type="date" className="input-field" value={form.nextAppointment} onChange={set('nextAppointment')} /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar control'}</button>
        </form>
      )}

      {error && <p className="text-error text-sm font-body mb-4">{error}</p>}

      {items && items.length === 0 && !showForm && (
        <EmptyState
          icon="🩺"
          title="Aún no tienes controles registrados"
          description="Registra tu próxima cita prenatal para llevar tu historial completo."
          action={<button className="btn-primary max-w-[220px]" onClick={() => setShowForm(true)}>+ Agregar control</button>}
        />
      )}

      <div className="flex flex-col gap-3">
        {items?.map((c) => (
          <div key={c.id} className="card !p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-body font-semibold">Control prenatal</span>
              <button onClick={() => remove(c.id)} className="text-outline text-xs">Eliminar</button>
            </div>
            <p className="font-body text-sm text-on-surface-variant">
              {new Date(`${c.date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              {c.doctorName ? ` · ${c.doctorName}` : ''}
            </p>
            {c.observations && <p className="font-body text-sm mt-2">{c.observations}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {c.weightKg && <span className="pill-chip bg-surface-container text-on-surface-variant">Peso {c.weightKg} kg</span>}
              {c.bloodPressure && <span className="pill-chip bg-surface-container text-on-surface-variant">PA {c.bloodPressure}</span>}
              {c.heartRate && <span className="pill-chip bg-surface-container text-on-surface-variant">FC {c.heartRate} lpm</span>}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
