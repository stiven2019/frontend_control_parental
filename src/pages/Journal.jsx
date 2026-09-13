import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile } from '../api/client';

const getLocalDateStr = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

export default function Journal() {
  const [items, setItems] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: getLocalDateStr(),
    weekNumber: '',
    title: '',
    text: '',
  });
  const [file, setFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [filterWeek, setFilterWeek] = useState('todas');
  const formRef = useRef(null);

  const load = async () => {
    try {
      const [journalRes, dashRes] = await Promise.allSettled([
        api.listJournal(),
        api.getDashboard(),
      ]);

      if (journalRes.status === 'fulfilled') {
        setItems(journalRes.value.items || []);
      }
      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value);
        // Si el formulario está vacío de semana, inicializar con la semana actual
        setForm((prev) => ({
          ...prev,
          weekNumber: prev.weekNumber || dashRes.value?.status?.week || '',
        }));
      }
    } catch (err) {
      console.error('Error cargando diario:', err);
      setItems((prev) => prev || []);
    }
  };


  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleOpenCreate = () => {
    setEditingId(null);
    setFile(null);
    setPhotoPreview('');
    setForm({
      date: getLocalDateStr(),
      weekNumber: dashboard?.status?.week || '',
      title: '',
      text: '',
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setFile(null);
    setPhotoPreview(entry.photoUrl || '');
    setForm({
      date: entry.date || getLocalDateStr(),
      weekNumber: entry.weekNumber || '',
      title: entry.title || '',
      text: entry.text || '',
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFile(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      let photoUrl = photoPreview;
      if (file) {
        photoUrl = await uploadFile(file);
      }

      const payload = {
        date: form.date,
        weekNumber: form.weekNumber ? parseInt(form.weekNumber, 10) : null,
        title: form.title,
        text: form.text,
        photoUrl: photoUrl || null,
      };

      if (editingId) {
        // Actualizar entrada existente
        await api.updateJournal(editingId, payload);
        setFeedback('¡Entrada del diario actualizada exitosamente! 💖');
      } else {
        // Crear nueva entrada
        await api.createJournal(payload);
        setFeedback('¡Nueva experiencia guardada en tu diario! 📖');
      }

      setShowForm(false);
      setEditingId(null);
      setFile(null);
      setPhotoPreview('');
      await load();
      setTimeout(() => setFeedback(''), 3500);
    } catch (err) {
      alert(err.message || 'No pudimos guardar la entrada. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Estás segura de eliminar este recuerdo de tu diario?')) return;
    try {
      await api.deleteJournal(id);
      if (editingId === id) handleCancelForm();
      await load();
      setFeedback('Entrada eliminada.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  if (!items) return <AppLayout><LoadingState label="Cargando tu diario prenatal..." /></AppLayout>;

  // Filtrado por semana
  const availableWeeks = Array.from(
    new Set(items.map((i) => i.weekNumber).filter(Boolean))
  ).sort((a, b) => b - a);

  const filteredItems = items.filter((entry) => {
    if (filterWeek === 'todas') return true;
    return String(entry.weekNumber) === filterWeek;
  });

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
            <span>📖</span>
            <span>Mi Diario de Embarazo</span>
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Guarda tus emociones, vivencias y anécdotas semana a semana.
          </p>
        </div>

        <button
          onClick={showForm ? handleCancelForm : handleOpenCreate}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-transform active:scale-95 shadow-cloud-sm ${
            showForm ? 'bg-surface-container text-on-surface' : 'bg-primary text-on-primary'
          }`}
          title={showForm ? 'Cerrar formulario' : 'Escribir nueva entrada'}
        >
          {showForm ? '×' : '+'}
        </button>
      </header>

      {/* Banner de Bienestar Emocional */}
      <div className="card mb-6 !p-4 bg-primary-container/20 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">🌸</span>
          <div>
            <p className="font-body text-xs font-semibold text-on-surface">
              ¿Quieres registrar cómo te sientes hoy emocionalmente?
            </p>
            <p className="font-body text-[11px] text-on-surface-variant mt-0.5">
              Haz tu Test de Bienestar Emocional o consulta tips asertivos para soltar culpas y estrés.
            </p>
          </div>
        </div>
        <Link
          to="/bienestar-emocional"
          className="btn-secondary !w-auto !py-1.5 !px-4 text-xs font-semibold shrink-0 text-center shadow-cloud-sm"
        >
          Test Emocional 🌸
        </Link>
      </div>

      {feedback && (
        <div className="p-3.5 mb-5 rounded-xl bg-secondary-container/80 text-on-secondary-container text-xs font-semibold flex items-center gap-2 animate-fadeIn border border-secondary/20">
          <span>✓</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Formulario de Crear / Editar Entrada */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="card mb-6 flex flex-col gap-4 border-2 border-primary/20 animate-scaleUp shadow-cloud"
        >
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-base">
                {editingId ? '✏️' : '📝'}
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  {editingId ? 'Editar recuerdo del diario' : 'Nueva entrada en tu diario'}
                </h3>
                <p className="font-body text-[11px] text-on-surface-variant">
                  {editingId ? 'Modifica los datos y guarda los cambios.' : 'Comparte tus pensamientos y sensaciones de hoy.'}
                </p>
              </div>
            </div>
            {editingId && (
              <span className="pill-chip bg-primary-container text-on-primary-container text-[10px] font-bold">
                Modo Edición
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campo Fecha Actual */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0">Fecha</label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, date: getLocalDateStr() }))}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  📅 Hoy
                </button>
              </div>
              <input
                type="date"
                required
                className="input-field"
                value={form.date}
                onChange={set('date')}
              />
            </div>

            {/* Campo Semana de Embarazo (Arrastre automático de la actual) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0">Semana de embarazo</label>
                {dashboard?.status?.week && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weekNumber: dashboard.status.week }))}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    ✨ Semana actual ({dashboard.status.week})
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={42}
                  placeholder={`Ej. ${dashboard?.status?.week || 24}`}
                  className="input-field"
                  value={form.weekNumber}
                  onChange={set('weekNumber')}
                />
              </div>
            </div>
          </div>

          {/* Título de la entrada */}
          <div>
            <label className="field-label">Título de la vivencia</label>
            <input
              required
              className="input-field font-medium"
              placeholder="Ej. Hoy sentimos sus primeras pataditas ❤️"
              value={form.title}
              onChange={set('title')}
            />
          </div>

          {/* Texto del diario */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="field-label !mb-0">¿Qué viviste o sentiste hoy?</label>
              <span className="text-[11px] text-outline">{form.text.length} caracteres</span>
            </div>
            <textarea
              required
              rows={5}
              className="input-field leading-relaxed"
              placeholder="Escribe libremente cómo te sientes, los cambios de tu cuerpo o lo que le quieres decir a tu bebé..."
              value={form.text}
              onChange={set('text')}
            />
          </div>

          {/* Foto adjunta */}
          <div>
            <label className="field-label">Fotografía del momento (opcional)</label>
            {photoPreview && !file && (
              <div className="relative w-full max-w-xs h-36 rounded-xl overflow-hidden mb-2 border border-surface-container bg-surface-container">
                <img src={photoPreview} alt="Foto actual" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                  title="Quitar foto"
                >
                  ✕
                </button>
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  setFile(f);
                  setPhotoPreview(URL.createObjectURL(f));
                }
              }}
              className="input-field text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:opacity-80 cursor-pointer"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 !py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>{saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Guardar en mi Diario'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              className="btn-secondary !w-auto !py-3 !px-5 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Selector de Filtro por Semana */}
      {availableWeeks.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="font-semibold text-on-surface-variant shrink-0">Filtrar:</span>
          <button
            onClick={() => setFilterWeek('todas')}
            className={`pill-chip ${filterWeek === 'todas' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
          >
            Todas ({items.length})
          </button>
          {availableWeeks.map((wk) => (
            <button
              key={wk}
              onClick={() => setFilterWeek(String(wk))}
              className={`pill-chip ${filterWeek === String(wk) ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              Semana {wk}
            </button>
          ))}
        </div>
      )}

      {/* Estado Vacío */}
      {items.length === 0 && !showForm && (
        <EmptyState
          icon="📔"
          title="Tu diario está en blanco"
          description="Escribe los recuerdos, emociones y vivencias de tu embarazo, semana a semana."
          action={
            <button onClick={handleOpenCreate} className="btn-primary max-w-[220px] text-sm">
              + Escribir primera entrada
            </button>
          }
        />
      )}

      {/* Lista de Entradas del Diario */}
      <div className="flex flex-col gap-4">
        {filteredItems.map((entry) => (
          <article
            key={entry.id}
            className={`card !p-5 border transition-all ${
              editingId === entry.id ? 'border-primary shadow-cloud' : 'border-surface-container hover:shadow-cloud-sm'
            }`}
          >
            {entry.photoUrl && (
              <div className="w-full rounded-xl overflow-hidden mb-4 aspect-video bg-surface-container">
                <img
                  src={entry.photoUrl}
                  alt={entry.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

            {/* Cabecera de la entrada */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="pill-chip bg-primary-container/80 text-on-primary-container text-xs font-bold">
                  {new Date(`${entry.date}T00:00:00`).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                {entry.weekNumber && (
                  <span className="pill-chip bg-secondary-container/80 text-on-secondary-container text-xs font-semibold">
                    Semana {entry.weekNumber}
                  </span>
                )}
              </div>

              {/* Botones Editar y Eliminar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleStartEdit(entry)}
                  className="pill-chip bg-surface-container hover:bg-surface-high text-primary font-semibold text-xs transition-colors flex items-center gap-1"
                  title="Editar esta entrada"
                >
                  <span>✏️</span>
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="pill-chip bg-surface-container hover:bg-error-container hover:text-error text-outline text-xs transition-colors flex items-center gap-1"
                  title="Eliminar recuerdo"
                >
                  <span>🗑️</span>
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>

            {/* Título y Contenido */}
            <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface mb-2">
              {entry.title}
            </h2>
            <p className="font-body text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
              {entry.text}
            </p>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
