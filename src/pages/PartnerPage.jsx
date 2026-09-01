import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState } from '../components/States';
import { api, uploadFile } from '../api/client';

export default function PartnerPage() {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.getDashboard();
    setData(res);
    setName(res.partner?.name || '');
  };

  useEffect(() => { load(); }, []);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const photoUrl = await uploadFile(file);
    await api.updatePartner({ photoUrl });
    load();
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePartner({ name });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <AppLayout><LoadingState /></AppLayout>;
  const { partner } = data;

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Papá</h1>
        <p className="font-body text-on-surface-variant mt-1">Parte importante de este camino.</p>
      </header>

      <section className="card flex flex-col items-center text-center mb-6">
        <label className="relative w-24 h-24 rounded-full overflow-hidden bg-tertiary-container flex items-center justify-center mb-4 cursor-pointer border-4 border-white shadow-cloud">
          {partner?.photoUrl ? <img src={partner.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🧑</span>}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handlePhoto} />
        </label>

        {editing ? (
          <div className="w-full flex flex-col gap-3">
            <input className="input-field text-center" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-semibold">{partner?.name || 'Agrega a papá'}</h2>
            <button onClick={() => setEditing(true)} className="font-body text-xs text-primary font-semibold mt-3">Editar</button>
          </>
        )}
      </section>

      <section className="card text-center">
        <p className="font-body text-sm text-on-surface-variant">
          Aquí podrán guardar juntos fotografías, mensajes y recuerdos especiales de este proceso. Explora el{' '}
          <a href="/album" className="text-primary font-semibold">álbum</a> y el{' '}
          <a href="/diario" className="text-primary font-semibold">diario</a> para sumar momentos compartidos.
        </p>
      </section>
    </AppLayout>
  );
}
