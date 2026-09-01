import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile } from '../api/client';

const EMPTY_FORM = { date: '', weekNumber: '', title: '', text: '' };

export default function Journal() {
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { items } = await api.listJournal();
    setItems(items);
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = null;
      if (file) photoUrl = await uploadFile(file);
      await api.createJournal({ ...form, weekNumber: form.weekNumber || null, photoUrl });
      setForm(EMPTY_FORM);
      setFile(null);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => { await api.deleteJournal(id); load(); };

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Mi diario</h1>
        <button onClick={() => setShowForm((s) => !s)} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl shrink-0">
          {showForm ? '×' : '+'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Nueva entrada</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>
            <div><label className="field-label">Semana</label><input type="number" min={1} max={42} className="input-field" value={form.weekNumber} onChange={set('weekNumber')} /></div>
          </div>
          <div><label className="field-label">Título</label><input required className="input-field" placeholder="Ej. Sus primeras pataditas" value={form.title} onChange={set('title')} /></div>
          <div><label className="field-label">Texto</label><textarea required className="input-field" rows={4} placeholder="Hoy sentí..." value={form.text} onChange={set('text')} /></div>
          <div><label className="field-label">Fotografía (opcional)</label><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files[0])} className="input-field" /></div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar entrada'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState icon="📔" title="Tu diario está en blanco" description="Escribe los recuerdos y experiencias de tu embarazo, semana a semana." />
      )}

      <div className="flex flex-col gap-4">
        {items.map((entry) => (
          <div key={entry.id} className="card !p-5">
            {entry.photoUrl && <img src={entry.photoUrl} alt="" className="w-full rounded-sm mb-4 aspect-video object-cover" />}
            <div className="flex items-center justify-between mb-1">
              <p className="font-body text-xs font-semibold text-primary">
                {new Date(`${entry.date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                {entry.weekNumber ? ` · Semana ${entry.weekNumber}` : ''}
              </p>
              <button onClick={() => remove(entry.id)} className="text-outline text-xs">Eliminar</button>
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{entry.title}</h3>
            <p className="font-body text-sm text-on-surface-variant whitespace-pre-line">{entry.text}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
