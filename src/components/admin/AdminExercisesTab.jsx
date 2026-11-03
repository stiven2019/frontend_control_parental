import { useCallback, useEffect, useState } from 'react';
import { api, uploadExerciseVideo } from '../../api/client';

const AUDIENCES = [
  { value: 'mama', label: 'Para mama' },
  { value: 'papa', label: 'Para papa' },
  { value: 'ambos', label: 'Para ambos' },
];

const CATEGORIES = [
  { value: 'respiracion', label: 'Respiracion' },
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'fuerza', label: 'Fuerza suave' },
  { value: 'suelo_pelvico', label: 'Suelo pelvico' },
  { value: 'posicion_parto', label: 'Posiciones de parto' },
  { value: 'relajacion', label: 'Relajacion' },
  { value: 'masaje', label: 'Masaje y apoyo' },
];

const MAX_VIDEO_MB = 80;

const EMPTY = {
  title: '', audience: 'mama', category: 'respiracion', description: '', durationSeconds: 300,
  stepsText: '', laborBenefit: '', precautions: '', minWeek: '', sortOrder: 100,
  isPublished: true, videoSource: 'none', youtubeUrl: '', sourceCredit: '',
};

function toForm(item) {
  return {
    title: item.title || '',
    audience: item.audience || 'mama',
    category: item.category || 'movilidad',
    description: item.description || '',
    durationSeconds: item.durationSeconds || 0,
    stepsText: (item.steps || []).join('\n'),
    laborBenefit: item.laborBenefit || '',
    precautions: item.precautions || '',
    minWeek: item.minWeek ?? '',
    sortOrder: item.sortOrder ?? 100,
    isPublished: item.isPublished !== false,
    videoSource: item.videoSource || 'none',
    youtubeUrl: item.youtubeId ? `https://youtu.be/${item.youtubeId}` : '',
    sourceCredit: item.sourceCredit || '',
  };
}

function VideoBadge({ item }) {
  const map = { upload: 'Video subido', youtube: 'YouTube', none: 'Sin video' };
  const tone = item.videoSource === 'none' ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary-container text-on-secondary-container';
  return <span className={`pill-chip !py-0.5 ${tone}`}>{map[item.videoSource] || 'Sin video'}</span>;
}

export default function AdminExercisesTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // null | { id|null, form }
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('todos');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.listAdminExercises();
      setItems(res.items || []);
    } catch (err) {
      setItems([]);
      setError(err.message || 'No se pudieron cargar los ejercicios.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setFile(null); setError(''); setNotice(''); setEditing({ id: null, form: { ...EMPTY } }); };
  const openEdit = (item) => { setFile(null); setError(''); setNotice(''); setEditing({ id: item.id, form: toForm(item) }); };
  const setField = (field) => (e) => setEditing((s) => ({ ...s, form: { ...s.form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } }));

  const onFile = (e) => {
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`El video supera ${MAX_VIDEO_MB} MB. Usa un clip mas corto o comprimido.`);
      e.target.value = '';
      return;
    }
    setError('');
    setFile(picked);
  };

  const buildPayload = (f) => {
    const payload = {
      title: f.title,
      audience: f.audience,
      category: f.category,
      description: f.description,
      durationSeconds: Number(f.durationSeconds) || 0,
      steps: f.stepsText.split('\n').map((s) => s.trim()).filter(Boolean),
      laborBenefit: f.laborBenefit,
      precautions: f.precautions,
      minWeek: f.minWeek === '' ? null : Number(f.minWeek),
      sortOrder: Number(f.sortOrder) || 0,
      isPublished: f.isPublished,
      sourceCredit: f.sourceCredit,
    };
    if (f.videoSource === 'youtube') {
      payload.videoSource = 'youtube';
      payload.youtubeId = f.youtubeUrl;
    } else if (f.videoSource === 'none' && !file) {
      payload.videoSource = 'none';
    }
    return payload;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const f = editing.form;
      if (f.videoSource === 'youtube' && !f.youtubeUrl.trim()) throw new Error('Pega el enlace de YouTube del video.');
      const payload = buildPayload(f);
      const res = editing.id ? await api.updateAdminExercise(editing.id, payload) : await api.createAdminExercise(payload);
      const id = res.item.id;
      if (f.videoSource === 'upload' && file) {
        await uploadExerciseVideo(id, file);
      }
      setNotice('Ejercicio guardado correctamente.');
      setEditing(null);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el ejercicio.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item) => {
    setError('');
    try {
      await api.updateAdminExercise(item.id, { isPublished: !item.isPublished });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la visibilidad.');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Eliminar "${item.title}"? Tambien se borrara su video subido.`)) return;
    setError('');
    try {
      await api.deleteAdminExercise(item.id);
      setNotice('Ejercicio eliminado.');
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el ejercicio.');
    }
  };

  if (!items) return <p className="font-body text-sm text-on-surface-variant">Cargando ejercicios...</p>;

  const visible = items.filter((i) => filter === 'todos' || i.audience === filter || (filter === 'sinvideo' && i.videoSource === 'none'));
  const withoutVideo = items.filter((i) => i.videoSource === 'none').length;
  const f = editing?.form;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-body text-sm text-on-surface-variant max-w-xl">
          Biblioteca de videos cortos de ejercicios para el parto. Cada ejercicio puede tener un video propio (MP4 o WEBM) o un enlace de YouTube. Mama y papa solo ven los ejercicios publicados.
        </p>
        <button type="button" onClick={openNew} className="pill-chip bg-primary text-on-primary text-xs font-semibold">Nuevo ejercicio</button>
      </div>

      {withoutVideo > 0 && (
        <p className="font-body text-xs p-3 rounded-2xl bg-tertiary-container/60 text-on-tertiary-container">
          {withoutVideo} {withoutVideo === 1 ? 'ejercicio aun no tiene' : 'ejercicios aun no tienen'} video. Mientras tanto se muestran con su guia escrita.
        </p>
      )}
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      {notice && <p role="status" className="text-xs text-secondary font-semibold">{notice}</p>}

      <div className="flex flex-wrap gap-2">
        {[['todos', 'Todos'], ['mama', 'Mama'], ['papa', 'Papa'], ['sinvideo', 'Sin video']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setFilter(v)} className={`pill-chip text-xs font-semibold ${filter === v ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>{l}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-cloud-sm border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill-chip !py-0.5 bg-primary-container text-on-primary-container">{AUDIENCES.find((a) => a.value === item.audience)?.label}</span>
              <VideoBadge item={item} />
              {!item.isPublished && <span className="pill-chip !py-0.5 bg-error-container text-on-error-container">Oculto</span>}
            </div>
            <h4 className="font-display text-base font-semibold text-on-surface">{item.title}</h4>
            <p className="font-body text-xs text-on-surface-variant line-clamp-2">{item.description}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <button type="button" onClick={() => openEdit(item)} className="pill-chip bg-surface-container text-on-surface text-xs font-semibold">Editar</button>
              <button type="button" onClick={() => togglePublish(item)} className="pill-chip bg-surface-container text-on-surface text-xs font-semibold">{item.isPublished ? 'Ocultar' : 'Publicar'}</button>
              <button type="button" onClick={() => remove(item)} className="pill-chip bg-error-container text-on-error-container text-xs font-semibold">Eliminar</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="font-body text-sm text-outline">No hay ejercicios en esta vista.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Editar ejercicio">
          <form onSubmit={save} className="bg-surface w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">{editing.id ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-surface-container text-lg" aria-label="Cerrar">&times;</button>
            </div>

            <div>
              <label className="field-label" htmlFor="ex-title">Titulo</label>
              <input id="ex-title" required maxLength={150} className="input-field" value={f.title} onChange={setField('title')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="ex-aud">Para</label>
                <select id="ex-aud" className="input-field" value={f.audience} onChange={setField('audience')}>
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="ex-cat">Categoria</label>
                <select id="ex-cat" className="input-field" value={f.category} onChange={setField('category')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="ex-desc">Descripcion corta</label>
              <textarea id="ex-desc" rows={2} maxLength={2000} className="input-field" value={f.description} onChange={setField('description')} />
            </div>
            <div>
              <label className="field-label" htmlFor="ex-steps">Pasos (uno por linea)</label>
              <textarea id="ex-steps" rows={4} className="input-field" value={f.stepsText} onChange={setField('stepsText')} />
            </div>
            <div>
              <label className="field-label" htmlFor="ex-benefit">Como ayuda en el parto</label>
              <textarea id="ex-benefit" rows={2} maxLength={2000} className="input-field" value={f.laborBenefit} onChange={setField('laborBenefit')} />
            </div>
            <div>
              <label className="field-label" htmlFor="ex-prec">Precauciones</label>
              <textarea id="ex-prec" rows={2} maxLength={2000} className="input-field" value={f.precautions} onChange={setField('precautions')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label" htmlFor="ex-dur">Duracion (seg)</label>
                <input id="ex-dur" type="number" min="0" max="7200" className="input-field" value={f.durationSeconds} onChange={setField('durationSeconds')} />
              </div>
              <div>
                <label className="field-label" htmlFor="ex-week">Desde semana</label>
                <input id="ex-week" type="number" min="0" max="42" className="input-field" value={f.minWeek} onChange={setField('minWeek')} />
              </div>
              <div>
                <label className="field-label" htmlFor="ex-order">Orden</label>
                <input id="ex-order" type="number" min="0" max="10000" className="input-field" value={f.sortOrder} onChange={setField('sortOrder')} />
              </div>
            </div>

            <fieldset className="rounded-2xl border border-outline-variant/50 p-4 flex flex-col gap-3">
              <legend className="px-2 font-body text-xs font-semibold text-on-surface-variant">Video</legend>
              <div className="flex flex-wrap gap-4 font-body text-sm">
                {[['none', 'Sin video'], ['upload', 'Subir archivo'], ['youtube', 'Enlace de YouTube']].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2">
                    <input type="radio" name="videoSource" value={v} checked={f.videoSource === v} onChange={setField('videoSource')} />
                    {l}
                  </label>
                ))}
              </div>
              {f.videoSource === 'upload' && (
                <div>
                  <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" onChange={onFile} className="input-field" />
                  <p className="font-body text-[11px] text-on-surface-variant mt-1.5">
                    MP4 o WEBM de hasta {MAX_VIDEO_MB} MB. Recomendado: clips de 1 a 3 minutos. Usa solo videos propios o con licencia que permita publicarlos.
                  </p>
                  {editing.id && !file && <p className="font-body text-[11px] text-outline mt-1">Si no eliges archivo se conserva el video actual.</p>}
                </div>
              )}
              {f.videoSource === 'youtube' && (
                <div>
                  <input type="url" className="input-field" placeholder="https://youtu.be/..." value={f.youtubeUrl} onChange={setField('youtubeUrl')} />
                  <p className="font-body text-[11px] text-on-surface-variant mt-1.5">Se reproduce en modo privado (youtube-nocookie) dentro de la app.</p>
                </div>
              )}
              <div>
                <label className="field-label" htmlFor="ex-credit">Credito / fuente del video</label>
                <input id="ex-credit" maxLength={200} className="input-field" value={f.sourceCredit} onChange={setField('sourceCredit')} />
              </div>
            </fieldset>

            <label className="flex items-center gap-2 font-body text-sm">
              <input type="checkbox" checked={f.isPublished} onChange={setField('isPublished')} />
              Publicado (visible para mamas y papas)
            </label>

            {error && <p role="alert" className="text-xs text-error">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary !w-auto px-6 !py-3 text-sm">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary !w-auto px-6 !py-3 text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
