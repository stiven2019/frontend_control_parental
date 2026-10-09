import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile, getFileUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'ecografia', label: 'Ecografía' },
  { value: 'mama', label: 'Mamá' },
  { value: 'barriga', label: 'Barriga' },
  { value: 'papa', label: 'Con papá' },
  { value: 'familia', label: 'Familia' },
  { value: 'momento_especial', label: 'Momento especial' },
];

const getLocalDateStr = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const EMPTY_FORM = { category: 'momento_especial', weekNumber: '', date: getLocalDateStr(), description: '', comment: '' };

export default function Album() {
  const { isFamilyMember } = useAuth();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const res = await api.listPhotos();
      setItems(res?.items || []);
    } catch (err) {
      console.error('Error cargando fotos del álbum:', err);
      setItems([]);
      setError(err.message || 'No se pudieron cargar las fotografías.');
    }
  };

  useEffect(() => { load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFamilyMember) return;
    if (!file) { setError('Selecciona una fotografía para continuar.'); return; }
    
    const dateClean = form.date ? String(form.date).split('T')[0] : getLocalDateStr();
    if (!dateClean) { setError('Indica la fecha de la fotografía.'); return; }
    
    setSaving(true);
    setError('');
    try {
      const imageUrl = await uploadFile(file, 'album');
      if (!imageUrl || imageUrl.startsWith('data:')) {
        throw new Error('No se pudo obtener una URL válida de MinIO para la fotografía.');
      }
      await api.createPhoto({
        ...form,
        date: dateClean,
        weekNumber: form.weekNumber ? parseInt(form.weekNumber, 10) : null,
        imageUrl,
      });
      setForm({ ...EMPTY_FORM, date: getLocalDateStr() });
      setFile(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || 'Error al guardar la fotografía.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => { 
    if (isFamilyMember) return;
    await api.deletePhoto(id); 
    setSelected(null); 
    load(); 
  };

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Mi álbum ❤️</h1>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">Recuerdos, ecografías y momentos especiales.</p>
        </div>
        {!isFamilyMember && (
          <button onClick={() => setShowForm((s) => !s)} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl shrink-0 shadow-cloud">
            {showForm ? '×' : '+'}
          </button>
        )}
      </header>

      {isFamilyMember && (
        <div className="mb-6 p-4 rounded-2xl bg-secondary-container/50 border border-secondary/20 text-on-secondary-container text-xs font-semibold flex items-center gap-2 shadow-sm">
          <span>👁️</span>
          <span>Modo Acompañante Familiar: Tienes acceso de solo lectura para disfrutar de las memorias y fotos del bebé.</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">Agregar fotografía</h3>
          <div>
            <label className="field-label">Fotografía</label>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
            />
            {file && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-surface-container/50 rounded-xl border border-outline-variant/30">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Vista previa"
                  className="w-14 h-14 rounded-lg object-cover border border-outline-variant/30"
                />
                <div className="text-xs">
                  <p className="font-medium text-on-surface truncate max-w-[200px]">{file.name}</p>
                  <p className="text-on-surface-variant">{(file.size / 1024).toFixed(0)} KB · Lista para subir a MinIO</p>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Categoría</label>
              <select className="input-field" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="field-label">Semana</label><input type="number" min={1} max={42} className="input-field" value={form.weekNumber} onChange={set('weekNumber')} /></div>
          </div>
          <div><label className="field-label">Fecha</label><input type="date" required className="input-field" value={form.date} onChange={set('date')} /></div>
          <div><label className="field-label">Descripción</label><input className="input-field" placeholder="Ej. Primera ecografía ❤️" value={form.description} onChange={set('description')} /></div>
          <div>
            <label className="field-label">Recuerdo / comentario</label>
            <textarea className="input-field" rows={2} placeholder="Hoy escuchamos por primera vez los latidos de nuestro bebé." value={form.comment} onChange={set('comment')} />
          </div>
          {error && <p className="text-error text-sm font-body">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Subiendo...' : 'Guardar en el álbum'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState icon="📷" title="Tu álbum está vacío" description="Guarda ecografías y fotografías especiales de tu embarazo aquí." />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} className="aspect-square rounded-md overflow-hidden bg-surface-container relative group">
            <img
              src={getFileUrl(p.imageUrl)}
              alt={p.description || ''}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedOriginal && p.imageUrl && p.imageUrl.startsWith('http')) {
                  target.dataset.triedOriginal = 'true';
                  target.src = p.imageUrl;
                  return;
                }
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  target.nextElementSibling.classList.remove('hidden');
                  target.nextElementSibling.classList.add('flex');
                }
              }}
            />
            <div className="hidden absolute inset-0 bg-surface-container flex-col items-center justify-center p-2 text-center text-on-surface-variant">
              <span className="text-2xl mb-1">📷</span>
              <span className="text-[11px] font-medium truncate w-full">{p.description || 'Fotografía'}</span>
            </div>
            {p.weekNumber && (
              <span className="absolute bottom-2 left-2 pill-chip bg-white/85 text-on-surface text-[10px] shadow-sm">Semana {p.weekNumber}</span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-md max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={getFileUrl(selected.imageUrl)}
              alt={selected.description || ''}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedOriginal && selected.imageUrl && selected.imageUrl.startsWith('http')) {
                  target.dataset.triedOriginal = 'true';
                  target.src = selected.imageUrl;
                }
              }}
            />
            <div className="p-5">
              {selected.weekNumber && <p className="font-body text-xs font-semibold text-primary mb-1">Semana {selected.weekNumber}</p>}
              {selected.description && <p className="font-display text-lg font-semibold mb-1">{selected.description}</p>}
              {selected.date && (
                <p className="font-body text-xs text-on-surface-variant mb-2">
                  {new Date(`${String(selected.date).split('T')[0]}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {selected.comment && <p className="font-body text-sm">{selected.comment}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="btn-secondary">Cerrar</button>
                <button onClick={() => remove(selected.id)} className="btn-ghost text-error">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
