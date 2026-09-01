import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, ErrorState } from '../components/States';
import { api, uploadFile } from '../api/client';

const SEX_LABELS = { nino: 'Niño', nina: 'Niña', sorpresa: '¡Será sorpresa!', desconocido: 'Aún no lo sabemos' };

export default function BabyPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [sex, setSex] = useState('desconocido');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
      setName(res.baby?.provisionalName || '');
      setSex(res.baby?.sex || 'desconocido');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const photoUrl = await uploadFile(file);
    await api.updateBaby({ photoUrl });
    load();
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateBaby({ provisionalName: name, sex });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return <AppLayout><LoadingState /></AppLayout>;

  const { status, weeklyDevelopment, baby } = data;

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Mi bebé 👶</h1>
      </header>

      <section className="card flex flex-col items-center text-center mb-6">
        <label className="relative w-28 h-28 rounded-full overflow-hidden bg-primary-container flex items-center justify-center mb-4 cursor-pointer border-4 border-white shadow-cloud">
          {baby?.photoUrl ? (
            <img src={baby.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👶</span>
          )}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhoto} />
        </label>

        {editing ? (
          <div className="w-full flex flex-col gap-3">
            <input className="input-field text-center" placeholder="Nombre provisional" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="input-field" value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="desconocido">Aún no lo sabemos</option>
              <option value="nina">Niña</option>
              <option value="nino">Niño</option>
              <option value="sorpresa">¡Será sorpresa!</option>
            </select>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-semibold">{baby?.provisionalName || 'Tu bebé'}</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">{SEX_LABELS[baby?.sex] || SEX_LABELS.desconocido}</p>
            <button onClick={() => setEditing(true)} className="font-body text-xs text-primary font-semibold mt-3">Editar</button>
          </>
        )}
      </section>

      <section className="card mb-6">
        <span className="pill-chip bg-tertiary-container text-on-tertiary-container mb-3">Semana {status.week}</span>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-container rounded-md py-4 text-center">
            <p className="text-xs text-on-surface-variant">Tamaño aprox.</p>
            <p className="font-semibold capitalize">{weeklyDevelopment.size}</p>
          </div>
          <div className="bg-surface-container rounded-md py-4 text-center">
            <p className="text-xs text-on-surface-variant">Peso aprox.</p>
            <p className="font-semibold">{weeklyDevelopment.weightG} g</p>
          </div>
        </div>
        <p className="font-body text-sm text-on-surface-variant">{weeklyDevelopment.note}</p>
      </section>

      <p className="font-body text-xs text-outline text-center">
        Contenido educativo sobre el desarrollo fetal. No sustituye una consulta médica.
      </p>
    </AppLayout>
  );
}
