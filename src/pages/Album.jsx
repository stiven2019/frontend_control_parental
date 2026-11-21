import { useEffect, useMemo, useState } from 'react';
import { STORAGE_ALBUM_SEEN_KEY } from '../context/AlarmContext';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile, getFileUrl, getDirectMinioUrl, downloadAlbumZip } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ModuleIcon from '../components/ModuleIcons';
import { PageHeader, Fab } from '../components/PageParts';

const CATEGORIES = [
  { value: 'ecografia', label: 'Ecografía' },
  { value: 'mama', label: 'Mamá' },
  { value: 'barriga', label: 'Barriga' },
  { value: 'papa', label: 'Con papá' },
  { value: 'familia', label: 'Familia' },
  { value: 'momento_especial', label: 'Momento especial' },
];

// Colores suaves por categoria (etiqueta sobre la foto y fondo de respaldo)
const CATEGORY_TINT = {
  ecografia: { bg: 'from-tertiary-container to-secondary-container', label: 'text-on-tertiary-container' },
  mama: { bg: 'from-primary-container to-lilac-container', label: 'text-on-primary-container' },
  barriga: { bg: 'from-primary-container to-lilac-container', label: 'text-on-primary-container' },
  papa: { bg: 'from-peach-container to-primary-container', label: 'text-on-peach-container' },
  familia: { bg: 'from-lilac-container to-tertiary-container', label: 'text-on-lilac-container' },
  momento_especial: { bg: 'from-secondary-container to-peach-container', label: 'text-on-secondary-container' },
};
const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || '';

const getLocalDateStr = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const EMPTY_FORM = { category: 'momento_especial', weekNumber: '', date: getLocalDateStr(), description: '', comment: '' };

export default function Album() {
  const { isFamilyMember, isFamilyLink, isOwner } = useAuth();
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalImgError, setModalImgError] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [filter, setFilter] = useState('todas');

  const load = async () => {
    try {
      const res = await api.listPhotos();
      const list = res?.items || [];
      setItems(list);
      // Marca los recuerdos como vistos (quita el aviso de "nuevos recuerdos" de la campana)
      try {
        const newest = list.reduce((m, p) => (p.createdAt && p.createdAt > m ? p.createdAt : m), '');
        localStorage.setItem(STORAGE_ALBUM_SEEN_KEY, newest || new Date().toISOString());
      } catch (_) { /* sin almacenamiento */ }
    } catch (err) {
      console.error('Error cargando fotos del álbum:', err);
      setItems([]);
      setError(err.message || 'No se pudieron cargar las fotografías.');
    }
  };

  useEffect(() => { load(); }, []);

  const handleDownloadZip = async () => {
    setZipBusy(true);
    setError('');
    try {
      const { blob, fileName } = await downloadAlbumZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError(err.message || 'No se pudo descargar el album.');
    } finally {
      setZipBusy(false);
    }
  };

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
    if (isFamilyLink) return; // Ni las familias ni el papá pueden eliminar fotografías
    await api.deletePhoto(id); 
    setSelected(null); 
    load(); 
  };

  const presentCategories = useMemo(
    () => CATEGORIES.filter((c) => (items || []).some((p) => p.category === c.value)),
    [items],
  );

  // Fotos filtradas y agrupadas por semana (las mas recientes primero)
  const groups = useMemo(() => {
    const list = (items || []).filter((p) => filter === 'todas' || p.category === filter);
    const map = new Map();
    list.forEach((p) => {
      const key = p.weekNumber ? String(p.weekNumber) : 'sin';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()]
      .sort((a, b) => (a[0] === 'sin' ? 1 : b[0] === 'sin' ? -1 : Number(b[0]) - Number(a[0])))
      .map(([key, photos]) => ({ key, title: key === 'sin' ? 'Otros momentos' : `Semana ${key}`, photos }));
  }, [items, filter]);

  if (!items) return <AppLayout><LoadingState /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Mi álbum"
        subtitle="Recuerdos, ecografías y momentos especiales."
        action={!isFamilyMember && items.length > 0 ? (
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={zipBusy}
            className="h-11 px-4 rounded-full bg-secondary-container text-on-secondary-container text-[13px] font-bold disabled:opacity-60 shrink-0"
            title="Descargar todas las fotos del album en un archivo ZIP"
          >
            {zipBusy ? 'Preparando...' : 'Descargar ZIP'}
          </button>
        ) : null}
      />
      {!isFamilyMember && <Fab open={showForm} onClick={() => setShowForm((v) => !v)} label="Agregar fotografía" />}
      {!showForm && error && <p role="alert" className="mb-4 text-xs text-error font-body">{error}</p>}

      {isFamilyMember && (
        <div className="mb-6 p-4 rounded-3xl bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-2">
          <ModuleIcon name="info" className="w-5 h-5 shrink-0" />
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
              <div className="mt-2 flex items-center gap-3 p-2 bg-surface-container/50 rounded-2xl">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Vista previa"
                  className="w-14 h-14 rounded-xl object-cover"
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
          <div><label className="field-label">Descripción</label><input className="input-field" placeholder="Ej. Primera ecografía" value={form.description} onChange={set('description')} /></div>
          <div>
            <label className="field-label">Recuerdo / comentario</label>
            <textarea className="input-field" rows={2} placeholder="Hoy escuchamos por primera vez los latidos de nuestro bebé." value={form.comment} onChange={set('comment')} />
          </div>
          {error && <p className="text-error text-sm font-body">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Subiendo...' : 'Guardar en el álbum'}</button>
        </form>
      )}

      {items.length === 0 && !showForm && (
        <EmptyState icon="camera" title="Tu álbum está vacío" description="Guarda ecografías y fotografías especiales de tu embarazo aquí." />
      )}

      {items.length > 0 && presentCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1" role="group" aria-label="Filtrar por categoría">
          {[{ value: 'todas', label: 'Todas' }, ...presentCategories].map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={filter === c.value}
              onClick={() => setFilter(c.value)}
              className={`px-4 py-2.5 rounded-[20px] text-[13px] font-bold font-body whitespace-nowrap transition-colors active:scale-95 ${
                filter === c.value ? 'bg-primary text-on-primary shadow-cloud-sm' : 'bg-white text-on-surface-variant shadow-cloud-sm'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {groups.map((g) => {
          const mosaic = g.photos.length >= 3;
          return (
            <section key={g.key} aria-label={g.title}>
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.06em] text-on-surface-variant mb-2.5">{g.title}</h2>
              <div className={`grid gap-2.5 ${mosaic ? 'grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[150px]' : 'grid-cols-2 md:grid-cols-3'}`}>
                {g.photos.map((p, idx) => {
                  const tint = CATEGORY_TINT[p.category] || CATEGORY_TINT.momento_especial;
                  const big = mosaic && idx === 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setModalImgError(false);
                        setSelected(p);
                      }}
                      aria-label={`Abrir foto ${p.description || categoryLabel(p.category) || ''}`.trim()}
                      className={`relative group cursor-pointer overflow-hidden shadow-cloud-sm bg-gradient-to-br ${tint.bg} ${
                        big ? 'row-span-2 col-span-1 md:col-span-2 rounded-[26px]' : mosaic ? 'rounded-[22px]' : 'aspect-square rounded-[26px]'
                      }`}
                    >
                      <img
                        src={getFileUrl(p.imageUrl)}
                        alt={p.description || ''}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.triedDirect && p.imageUrl) {
                            target.dataset.triedDirect = 'true';
                            target.src = getDirectMinioUrl(p.imageUrl);
                            return;
                          }
                          target.style.display = 'none';
                          if (target.nextElementSibling) {
                            target.nextElementSibling.classList.remove('hidden');
                            target.nextElementSibling.classList.add('flex');
                          }
                        }}
                      />
                      <div className="hidden absolute inset-0 flex-col items-center justify-center p-2 text-center text-on-surface-variant">
                        <ModuleIcon name="camera" className="w-7 h-7 mb-1" />
                        <span className="text-[11px] font-medium truncate w-full">{p.description || 'Fotografía'}</span>
                      </div>
                      {(big || !mosaic) && categoryLabel(p.category) && (
                        <span className={`absolute bottom-2.5 left-2.5 px-3 py-1.5 rounded-[14px] bg-white/95 text-xs font-bold shadow-sm ${tint.label}`}>
                          {categoryLabel(p.category)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {items.length > 0 && groups.length === 0 && (
          <p className="font-body text-sm text-on-surface-variant">No hay fotos en esta categoría todavía.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[28px] max-w-sm w-full max-h-[92vh] overflow-y-auto shadow-2xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {modalImgError ? (
              <div className="w-full aspect-square bg-surface-container/60 flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
                <ModuleIcon name="camera" className="w-10 h-10 mb-2" />
                <p className="font-display font-semibold text-sm text-on-surface">No se pudo cargar la imagen</p>
                <p className="font-body text-xs text-on-surface-variant mt-1 max-w-[240px]">
                  El archivo no se encuentra disponible en MinIO o hubo un problema de conexión.
                </p>
                {selected.imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalImgError(false);
                    }}
                    className="mt-3 px-3 py-1 rounded-full text-xs bg-primary-container text-primary font-semibold hover:opacity-90 transition-opacity"
                  >
                    Reintentar cargar
                  </button>
                )}
              </div>
            ) : (
              <img
                src={getFileUrl(selected.imageUrl)}
                alt={selected.description || ''}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  // Si falló por proxy de Vite o URL relativa, intentar conectar directamente con el puerto 9000 de MinIO
                  if (!target.dataset.triedDirect && selected.imageUrl) {
                    target.dataset.triedDirect = 'true';
                    target.src = getDirectMinioUrl(selected.imageUrl);
                    return;
                  }
                  // Si ambos métodos fallan, activar vista alternativa limpia
                  setModalImgError(true);
                }}
              />
            )}
            <div className="p-5">
              <div className="flex gap-2 flex-wrap mb-2">
                {selected.weekNumber && <span className="pill-chip bg-primary-container text-on-primary-container">Semana {selected.weekNumber}</span>}
                {categoryLabel(selected.category) && <span className="pill-chip bg-secondary-container text-on-secondary-container">{categoryLabel(selected.category)}</span>}
              </div>
              {selected.description && <p className="font-display text-lg font-semibold mb-1">{selected.description}</p>}
              {selected.date && (
                <p className="font-body text-xs text-on-surface-variant mb-2">
                  {new Date(`${String(selected.date).split('T')[0]}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {selected.comment && <p className="font-body text-sm">{selected.comment}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelected(null)} className="btn-secondary">Cerrar</button>
                {isOwner && (
                  <button onClick={() => remove(selected.id)} className="btn-ghost text-error">Eliminar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
