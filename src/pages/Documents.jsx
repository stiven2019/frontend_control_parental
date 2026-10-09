import { useEffect, useState, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingState, EmptyState } from '../components/States';
import { api, uploadFile, getFileUrl } from '../api/client';

const CATEGORIES = [
  { value: 'formula_medica', label: 'Fórmula médica', icon: '💊', color: 'emerald' },
  { value: 'resultado_examen', label: 'Resultado de examen', icon: '🔬', color: 'blue' },
  { value: 'orden_medica', label: 'Orden médica', icon: '📋', color: 'amber' },
  { value: 'ecografia', label: 'Ecografía', icon: '👶', color: 'pink' },
  { value: 'certificado', label: 'Certificado', icon: '📜', color: 'purple' },
  { value: 'otro', label: 'Otro documento', icon: '📁', color: 'slate' },
];

const EMPTY_FORM = { name: '', category: 'otro', date: '', description: '' };

function getFileType(url) {
  if (!url) return 'unknown';
  if (url.startsWith('data:image/')) return 'image';
  if (url.startsWith('data:application/pdf')) return 'pdf';
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(jpe?g|png|webp|gif|svg|bmp|avif)$/i.test(clean)) return 'image';
  if (/\.pdf$/i.test(clean)) return 'pdf';
  return 'unknown';
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Documents() {
  const [items, setItems] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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

  useEffect(() => {
    load();
  }, []);

  // Manejar preview del archivo antes de subirlo
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isImg) {
      const objectUrl = URL.createObjectURL(file);
      setFilePreview({ type: 'image', url: objectUrl, name: file.name, size: file.size });
      return () => URL.revokeObjectURL(objectUrl);
    } else if (isPdf) {
      setFilePreview({ type: 'pdf', name: file.name, size: file.size });
    } else {
      setFilePreview({ type: 'other', name: file.name, size: file.size });
    }
  }, [file]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    // Sugerir nombre amigable si el usuario aún no escribió uno
    if (!form.name.trim()) {
      const lastDot = selectedFile.name.lastIndexOf('.');
      const baseName = lastDot > 0 ? selectedFile.name.substring(0, lastDot) : selectedFile.name;
      const cleanName = baseName.replace(/[-_]+/g, ' ').trim();
      if (cleanName) {
        setForm((f) => ({
          ...f,
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        }));
      }
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo (imagen o PDF) para continuar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fileUrl = await uploadFile(file, 'documentos');
      const dateClean = form.date ? String(form.date).split('T')[0] : null;
      await api.createDocument({
        ...form,
        date: dateClean,
        fileUrl,
        thumbnailUrl: fileUrl,
      });
      setForm(EMPTY_FORM);
      setFile(null);
      setFilePreview(null);
      setShowForm(false);
      await load();
    } catch (err) {
      console.error('Error guardando documento:', err);
      setError(err.message || 'Ocurrió un error al guardar el documento.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, e) => {
    if (e) e.stopPropagation();
    const docToDelete = items?.find((d) => d.id === id);
    const confirmMsg = docToDelete
      ? `¿Estás segura de eliminar el documento "${docToDelete.name}"? Esta acción no se puede deshacer.`
      : '¿Deseas eliminar este documento?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(id);
      await api.deleteDocument(id);
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
      await load();
    } catch (err) {
      alert('Error eliminando documento: ' + (err.message || 'Error desconocido'));
    } finally {
      setDeletingId(null);
    }
  };

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedDoc(null);
    };
    if (selectedDoc) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedDoc]);

  // Filtrado de documentos
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((d) => {
      const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        CATEGORIES.find((c) => c.value === d.category)?.label.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  if (!items) {
    return (
      <AppLayout>
        <LoadingState />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header Principal */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
              Mis documentos médicos 📁
            </h1>
            <span className="pill-chip bg-primary-container text-primary font-bold text-xs">
              {items.length} {items.length === 1 ? 'guardado' : 'guardados'}
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Organiza, visualiza y descarga tus ecografías, fórmulas y resultados de laboratorio.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((s) => !s);
            if (showForm) {
              setFile(null);
              setFilePreview(null);
              setError('');
            }
          }}
          className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 text-sm font-semibold flex items-center justify-center gap-2 shadow-cloud-sm rounded-full active:scale-95 transition-all"
        >
          <span className="text-lg leading-none">{showForm ? '✕' : '＋'}</span>
          <span>{showForm ? 'Cerrar formulario' : 'Agregar documento'}</span>
        </button>
      </header>

      {/* Formulario de Subida */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card mb-8 border-2 border-primary/20 bg-gradient-to-b from-white to-primary-container/10 flex flex-col gap-4 animate-fade-in shadow-cloud"
        >
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
              <span>📄</span> Nuevo documento médico
            </h3>
            <span className="text-xs text-on-surface-variant">Formatos: PDF, JPG, PNG, WEBP</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Nombre del documento *</label>
              <input
                required
                placeholder="Ej. Ecografía morfológica semana 20"
                className="input-field"
                value={form.name}
                onChange={set('name')}
              />
            </div>

            <div>
              <label className="field-label">Categoría médica</label>
              <select className="input-field bg-white" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Fecha del documento</label>
              <input
                type="date"
                className="input-field bg-white"
                value={form.date}
                onChange={set('date')}
              />
            </div>

            <div>
              <label className="field-label">Notas o indicaciones médicas (opcional)</label>
              <textarea
                className="input-field bg-white"
                rows={2}
                placeholder="Ej. Resultados normales, peso del bebé 350g, repetir en 4 semanas."
                value={form.description}
                onChange={set('description')}
              />
            </div>
          </div>

          {/* Selector de Archivo con Previsualización */}
          <div>
            <label className="field-label">Archivo del documento (PDF o imagen) *</label>
            <div className="relative border-2 border-dashed border-primary/30 rounded-2xl p-4 sm:p-5 bg-white/70 hover:bg-primary-container/15 transition-colors text-center">
              <input
                type="file"
                required={!file}
                accept=".jpg,.jpeg,.png,.webp,.pdf,.heic,.heif,image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {!filePreview ? (
                <div className="flex flex-col items-center justify-center gap-2 py-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-primary-container/50 flex items-center justify-center text-2xl text-primary">
                    ☁️
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-on-surface">
                      Haz clic aquí o arrastra tu archivo
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Admite ecografías (JPG, PNG), fórmulas médicas o exámenes en PDF (hasta 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-outline-variant/40 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    {filePreview.type === 'image' ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-outline-variant/30">
                        <img
                          src={filePreview.url}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-red-100 border border-red-200 flex flex-col items-center justify-center shrink-0 text-red-600 font-bold">
                        <span className="text-xl">📑</span>
                        <span className="text-[10px] uppercase tracking-wider">PDF</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-on-surface truncate">
                        {filePreview.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {filePreview.type === 'image' ? '🖼️ Imagen' : '📄 Documento PDF'} · {formatBytes(filePreview.size)}
                      </p>
                      <span className="inline-block mt-1 text-[11px] text-primary font-medium">
                        ✓ Archivo listo para subir
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="relative z-20 text-xs text-error hover:underline px-3 py-1.5 rounded-md hover:bg-error-container/20 font-medium"
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-3 font-semibold flex items-center justify-center gap-2"
            >
              <span>{saving ? '⏳' : '💾'}</span>
              <span>{saving ? 'Subiendo documento a la nube...' : 'Guardar documento'}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setFile(null);
                setFilePreview(null);
                setError('');
              }}
              className="btn-ghost !w-auto !py-2.5 !px-5 text-xs text-on-surface-variant"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Barra de Filtros y Búsqueda */}
      {items.length > 0 && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`pill-chip transition-all text-xs whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-highest'
              }`}
            >
              Todos ({items.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = items.filter((d) => d.category === c.value).length;
              if (count === 0) return null;
              const isSelected = selectedCategory === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value)}
                  className={`pill-chip transition-all text-xs whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-highest'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Búsqueda */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <input
              type="text"
              placeholder="Buscar documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field !py-2 !text-xs !rounded-full pl-8 pr-8 bg-surface-container/70"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-outline hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estado Vacío General */}
      {items.length === 0 && !showForm && (
        <EmptyState
          icon="📄"
          title="Sin documentos médicos guardados"
          description="Guarda fórmulas, resultados de exámenes, ecografías y órdenes médicas en un solo lugar seguro y consúltalos cuando los necesites."
        />
      )}

      {/* Estado Vacío de Búsqueda o Filtro */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="card text-center py-10 my-4 bg-surface-container/30 border border-outline-variant/30 rounded-2xl">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="font-display text-base font-bold text-on-surface mb-1">
            No se encontraron documentos
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-4">
            No hay documentos que coincidan con los filtros seleccionados o el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="btn-secondary !w-auto !py-2 !px-4 text-xs font-semibold rounded-full mx-auto"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* Grid de Documentos Guardados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((d) => {
          const resolvedUrl = getFileUrl(d.fileUrl || d.thumbnailUrl);
          const type = getFileType(resolvedUrl);
          const catInfo = CATEGORIES.find((c) => c.value === d.category) || {
            label: 'Otro',
            icon: '📁',
          };
          const formattedDate = d.date
            ? new Date(`${d.date}T00:00:00`).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : null;

          return (
            <div
              key={d.id}
              onClick={() => setSelectedDoc(d)}
              className="card !p-4 flex flex-col justify-between hover:shadow-cloud transition-all duration-200 hover:-translate-y-1 cursor-pointer border border-outline-variant/30 hover:border-primary/40 group bg-white rounded-2xl"
            >
              <div>
                {/* Cabecera de la tarjeta: Categoría y Fecha */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="pill-chip bg-primary-container/40 text-on-primary-container text-[11px] font-semibold py-1 px-2.5">
                    <span>{catInfo.icon}</span>
                    <span className="truncate max-w-[130px]">{catInfo.label}</span>
                  </span>
                  {formattedDate && (
                    <span className="text-[11px] font-medium text-on-surface-variant shrink-0">
                      📅 {formattedDate}
                    </span>
                  )}
                </div>

                {/* Área de Visualización / Miniatura */}
                <div className="aspect-16/10 rounded-xl bg-surface-container overflow-hidden mb-3 relative flex items-center justify-center border border-outline-variant/30 group-hover:border-primary/30 transition-colors">
                  {type === 'image' ? (
                    <>
                      <img
                        src={resolvedUrl}
                        alt={d.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center text-center p-2 text-on-surface-variant">
                        <span className="text-3xl mb-1">🖼️</span>
                        <span className="text-[10px]">Imagen guardada</span>
                      </div>
                      {/* Overlay con indicación de Ver */}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white/95 text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                          <span>👁️</span> Visualizar imagen
                        </span>
                      </div>
                    </>
                  ) : type === 'pdf' ? (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 via-white to-red-50 p-4 flex flex-col items-center justify-center relative text-center">
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md shadow-xs">
                        PDF
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-1.5 shadow-cloud-sm border border-red-200">
                        📑
                      </div>
                      <span className="text-xs font-bold text-on-surface">Documento PDF</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">
                        Clic para leer o previsualizar
                      </span>

                      {/* Overlay con indicación de Ver */}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white/95 text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                          <span>👁️</span> Visualizar PDF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-3xl mb-1">📄</span>
                      <span className="text-xs font-semibold text-on-surface">Archivo adjunto</span>
                      <span className="text-[10px] text-on-surface-variant">Clic para ver detalles</span>
                    </div>
                  )}
                </div>

                {/* Título y Descripción */}
                <h3 className="font-display text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {d.name}
                </h3>

                {d.description ? (
                  <p className="font-body text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-3">
                    {d.description}
                  </p>
                ) : (
                  <p className="font-body text-xs text-on-surface-variant/60 italic mb-3">
                    Sin descripción médica adicional
                  </p>
                )}
              </div>

              {/* Acciones de la tarjeta */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(d)}
                  className="btn-secondary !w-auto !py-2 !px-3.5 text-xs font-semibold flex items-center gap-1.5 rounded-full"
                >
                  <span>👁️</span>
                  <span>Ver documento</span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Abrir en nueva pestaña */}
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container/30 transition-colors text-xs"
                    title="Abrir archivo en pestaña nueva"
                  >
                    ↗️
                  </a>

                  {/* Eliminar */}
                  <button
                    type="button"
                    disabled={deletingId === d.id}
                    onClick={(e) => remove(d.id, e)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error-container/30 transition-colors text-xs"
                    title="Eliminar documento"
                  >
                    {deletingId === d.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL DE VISUALIZACIÓN COMPLETA DEL DOCUMENTO GUARDADO */}
      {/* ======================================================== */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-white/20 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex items-center justify-between gap-3 bg-surface-container/30">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="pill-chip bg-primary-container text-primary text-xs font-bold py-1 px-3">
                    {CATEGORIES.find((c) => c.value === selectedDoc.category)?.icon}{' '}
                    {CATEGORIES.find((c) => c.value === selectedDoc.category)?.label}
                  </span>
                  {selectedDoc.date && (
                    <span className="text-xs font-semibold text-on-surface-variant bg-white px-2.5 py-1 rounded-full border border-outline-variant/30">
                      📅{' '}
                      {new Date(`${selectedDoc.date}T00:00:00`).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg sm:text-2xl font-bold text-on-surface truncate">
                  {selectedDoc.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-highest text-on-surface flex items-center justify-center text-xl font-bold shrink-0 transition-transform active:scale-95"
                title="Cerrar visor"
              >
                ✕
              </button>
            </div>

            {/* Barra de Acciones Directas del Visor */}
            <div className="px-4 sm:px-5 py-2.5 bg-surface-container/60 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span>
                  {getFileType(getFileUrl(selectedDoc.fileUrl || selectedDoc.thumbnailUrl)) === 'pdf'
                    ? '📑 Documento PDF'
                    : '🖼️ Imagen médica'}
                </span>
                <span>·</span>
                <span className="text-[11px]">Guardado en tu expediente prenatal</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getFileUrl(selectedDoc.fileUrl || selectedDoc.thumbnailUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !w-auto !py-1.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5 rounded-full shadow-cloud-sm"
                >
                  <span>↗️</span>
                  <span>Abrir en nueva pestaña</span>
                </a>
                <a
                  href={getFileUrl(selectedDoc.fileUrl || selectedDoc.thumbnailUrl)}
                  download={selectedDoc.name || 'documento'}
                  className="btn-secondary !w-auto !py-1.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5 rounded-full"
                >
                  <span>⬇️</span>
                  <span>Descargar</span>
                </a>
              </div>
            </div>

            {/* Contenido Visual del Documento */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(94vh-180px)] flex flex-col gap-4">
              {/* Notas Médicas si existen */}
              {selectedDoc.description && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-on-surface text-xs sm:text-sm">
                  <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <span>📝</span> Notas e Indicaciones:
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedDoc.description}</p>
                </div>
              )}

              {/* Visor de PDF o Imagen */}
              {(() => {
                const docUrl = getFileUrl(selectedDoc.fileUrl || selectedDoc.thumbnailUrl);
                const docType = getFileType(docUrl);

                if (docType === 'pdf') {
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="w-full h-[58vh] sm:h-[64vh] rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container relative shadow-inner">
                        <iframe
                          src={`${docUrl}#toolbar=1&navpanes=0`}
                          title={selectedDoc.name}
                          className="w-full h-full border-0 rounded-2xl bg-white"
                        />
                      </div>
                      <div className="p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span>
                          💡 Si el visor integrado de PDF no se despliega en tu dispositivo, puedes abrirlo a pantalla completa:
                        </span>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1"
                        >
                          <span>Ver PDF a pantalla completa</span>
                          <span>→</span>
                        </a>
                      </div>
                    </div>
                  );
                }

                if (docType === 'image') {
                  return (
                    <div className="flex flex-col items-center justify-center bg-surface-container/30 rounded-2xl p-2 sm:p-4 border border-outline-variant/30 min-h-[300px]">
                      <img
                        src={docUrl}
                        alt={selectedDoc.name}
                        className="max-h-[64vh] max-w-full object-contain rounded-xl shadow-cloud-sm border border-outline-variant/20"
                      />
                    </div>
                  );
                }

                // Archivo no estándar o tipo no identificado
                return (
                  <div className="p-8 text-center bg-surface-container/30 rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center gap-3">
                    <span className="text-5xl">📄</span>
                    <h4 className="font-display text-base font-bold text-on-surface">
                      Documento adjunto disponible
                    </h4>
                    <p className="text-xs text-on-surface-variant max-w-sm">
                      Este archivo no dispone de previsualización web directa, pero puedes abrirlo o descargarlo directamente a continuación.
                    </p>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary !w-auto !py-2.5 !px-6 text-xs font-semibold rounded-full"
                    >
                      Abrir archivo original
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-container/20 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => remove(selectedDoc.id)}
                className="btn-ghost !w-auto !py-2 !px-4 text-xs font-semibold text-error hover:bg-error-container/30 rounded-full flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Eliminar documento</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="btn-secondary !w-auto !py-2 !px-6 text-xs font-semibold rounded-full"
              >
                Cerrar visor
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
