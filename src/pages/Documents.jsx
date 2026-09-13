import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile } from '../api/client';

const CATEGORIES = [
  { value: 'formula_medica', label: 'Fórmula médica' },
  { value: 'resultado_examen', label: 'Resultado de examen' },
  { value: 'orden_medica', label: 'Orden médica' },
  { value: 'ecografia', label: 'Ecografía' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

const EMPTY_FORM = { name: '', category: 'otro', date: '', description: '' };

export default function Documents() {
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.listDocuments();
      setItems(res?.items || []);
    } catch (err) {
      console.error('Error cargando documentos:', err);
      setItems([]);
      setError(err.message || 'No se pudieron cargar los documentos.');
    }
  };


  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Selecciona un archivo o fotografía para continuar.'); return; }
    setSaving(true);
    setError('');
    try {
      const fileUrl = await uploadFile(file);
      await api.createDocument({ ...form, date: form.date || null, fileUrl, thumbnailUrl: fileUrl });
      setForm(EMPTY_FORM);
      setFile(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => { await api.deleteDocument(id); load(); };

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Mis documentos médicos</h1>
        <button onClick={() => setShowForm((s) => !s)} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl shrink-0">
          {showForm ? '×' : '+'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Agregar documento</h3>
          <div><label className="field-label">Nombre</label><input required className="input-field" value={form.name} onChange={set('name')} /></div>
          <div>
            <label className="field-label">Categoría</label>
            <select className="input-field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="field-label">Fecha</label><input type="date" className="input-field" value={form.date} onChange={set('date')} /></div>
          <div><label className="field-label">Descripción</label><textarea className="input-field" rows={2} value={form.description} onChange={set('description')} /></div>
          <div>
            <label className="field-label">Archivo (imagen o PDF)</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => setFile(e.target.files[0])} className="input-field" />
          </div>
          {error && <p className="text-error text-sm font-body">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Subiendo...' : 'Guardar documento'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState icon="📄" title="Sin documentos" description="Guarda fórmulas, resultados de exámenes y órdenes médicas en un solo lugar." />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((d) => (
          <div key={d.id} className="card !p-3">
            <div className="aspect-square rounded-sm bg-surface-container overflow-hidden mb-2 flex items-center justify-center">
              {d.thumbnailUrl?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={d.thumbnailUrl} alt={d.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">📄</span>
              )}
            </div>
            <p className="font-body text-xs font-semibold truncate">{d.name}</p>
            <p className="font-body text-[10px] text-on-surface-variant truncate">{CATEGORIES.find((c) => c.value === d.category)?.label}</p>
            <button onClick={() => remove(d.id)} className="font-body text-[10px] text-outline mt-1">Eliminar</button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
