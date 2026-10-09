import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { LoadingState } from '../components/States';
import FamilyQrModal from '../components/FamilyQrModal';
import { api, uploadFile, getFileUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PartnerPage() {
  const { user, isFamilyLink, isPartnerLink } = useAuth();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Vínculos familiares
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedRoleForQr, setSelectedRoleForQr] = useState('papa');
  const [revokingId, setRevokingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
      setName(res.partner?.name || '');
    } catch (err) {
      console.error('Error cargando datos de papá:', err);
    }
  };

  const loadFamilyLinks = async () => {
    if (isFamilyLink) return; // Solo mamá gestiona los vínculos
    setLoadingLinks(true);
    try {
      const res = await api.listFamilyLinks();
      setLinks(res?.links || []);
    } catch (err) {
      console.error('Error cargando vínculos familiares:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    if (!isFamilyLink) {
      loadFamilyLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFamilyLink]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const photoUrl = await uploadFile(file, 'pareja');
      if (!photoUrl || photoUrl.startsWith('data:')) {
        throw new Error('No se pudo obtener una URL válida de MinIO para la foto de papá.');
      }
      await api.updatePartner({ photoUrl });
      loadDashboard();
    } catch (err) {
      alert(err.message || 'No se pudo subir la foto.');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePartner({ name });
      setEditing(false);
      loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQrModal = (role) => {
    setSelectedRoleForQr(role);
    setQrModalOpen(true);
  };

  const handleRevoke = async (id, linkName) => {
    const confirmed = window.confirm(
      `¿Estás segura de desvincular a "${linkName || 'este miembro'}"?\nSu acceso se cerrará de forma inmediata.`
    );
    if (!confirmed) return;

    setRevokingId(id);
    setFeedback('');
    try {
      await api.revokeFamilyLink(id);
      setFeedback(`Se ha desvinculado a "${linkName || 'el usuario'}" correctamente.`);
      await loadFamilyLinks();
    } catch (err) {
      alert(err.message || 'No se pudo desvincular.');
    } finally {
      setRevokingId(null);
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  if (!data) return <AppLayout><LoadingState label="Cargando información familiar..." /></AppLayout>;
  const { partner } = data;

  const activeLinks = links.filter((l) => l.status !== 'revoked');
  const partnerLinkActive = activeLinks.some((l) => l.role === 'papa');

  return (
    <AppLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <span>🧑‍🍼</span>
            <span>Papá y Lazos Familiares</span>
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Involucra a papá y a tu red de apoyo mediante códigos QR con permisos controlados.
          </p>
        </div>

        {!isFamilyLink && (
          <button
            type="button"
            onClick={() => handleOpenQrModal('papa')}
            className="btn-primary !py-2.5 !px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-cloud"
          >
            <span>📱</span>
            <span>Vincular por QR</span>
          </button>
        )}
      </header>

      {/* Alerta de feedback */}
      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-secondary-container/80 text-on-secondary-container text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <span>✓</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Vista de Papá */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta de Perfil de Papá */}
        <section className="card flex flex-col items-center text-center p-6 md:col-span-1">
          <label className="relative w-28 h-28 rounded-full overflow-hidden bg-tertiary-container flex items-center justify-center mb-4 cursor-pointer border-4 border-white shadow-cloud group">
            {partner?.photoUrl ? (
              <img
                src={getFileUrl(partner.photoUrl)}
                alt="Foto de papá"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedOriginal && partner.photoUrl && partner.photoUrl.startsWith('http')) {
                    target.dataset.triedOriginal = 'true';
                    target.src = partner.photoUrl;
                  }
                }}
              />
            ) : (
              <span className="text-4xl">🧑</span>
            )}
            {!isFamilyLink && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Cambiar foto
              </div>
            )}
            {!isFamilyLink && (
              <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif" className="hidden" onChange={handlePhoto} />
            )}
          </label>

          {editing && !isFamilyLink ? (
            <div className="w-full flex flex-col gap-2 mt-2">
              <input
                className="input-field text-center font-semibold text-sm"
                placeholder="Nombre de papá"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex gap-2 mt-1">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 text-xs !py-2">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-xs !py-2">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-on-surface">
                {partner?.name || 'Papá'}
              </h2>
              <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                {partnerLinkActive ? '🟢 Vinculado en la App' : '⚪ Sin dispositivo vinculado'}
              </span>

              {!isFamilyLink && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 rounded-full border border-outline-variant/50 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Editar nombre
                  </button>
                  <button
                    onClick={() => handleOpenQrModal('papa')}
                    className="px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <span>📲</span>
                    <span>Generar QR</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Roles y Privilegios */}
        <section className="card p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-primary tracking-wider">
              Seguridad y Control de Accesos
            </span>
            <h3 className="font-display text-lg font-semibold mt-1">
              ¿Qué puede ver cada persona vinculada?
            </h3>
            <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
              La mamá conserva siempre el control absoluto. En cualquier momento puedes desvincular a cualquier miembro con un solo toque.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧑</span>
                  <span className="font-display text-xs font-bold text-on-surface">Papá / Pareja</span>
                </div>
                <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">
                  ✅ Ver y subir fotos al Álbum<br />
                  ✅ Redactar y leer el Diario íntimo<br />
                  ✅ Seguimiento de crecimiento del bebé
                </p>
                {!isFamilyLink && (
                  <button
                    onClick={() => handleOpenQrModal('papa')}
                    className="mt-2 text-[11px] font-bold text-primary text-left hover:underline"
                  >
                    + Generar QR para Papá
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <span className="font-display text-xs font-bold text-on-surface">Familiares (Abuelos/Tíos)</span>
                </div>
                <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">
                  👁️ <strong>Solo lectura</strong> de fotos del Álbum<br />
                  👁️ Guía del bebé semana a semana<br />
                  👁️ Cuenta regresiva al parto
                </p>
                {!isFamilyLink && (
                  <button
                    onClick={() => handleOpenQrModal('familia')}
                    className="mt-2 text-[11px] font-bold text-secondary text-left hover:underline"
                  >
                    + Generar QR para Familiar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant">
              🔒 Tus controles médicos, medicamentos y test emocional son <strong>privados</strong>.
            </span>
            <div className="flex gap-2">
              <Link to="/album" className="text-xs font-semibold text-primary hover:underline">
                Ir al Álbum →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Panel de Gestión de Vínculos (Exclusivo de Mamá) */}
      {!isFamilyLink && (
        <section className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                <span>🔗</span>
                <span>Lazos y Dispositivos Vinculados ({activeLinks.length})</span>
              </h3>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                Familiares y acompañantes que tienen acceso a acompañar tu embarazo.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenQrModal('familia')}
                className="btn-secondary !py-2 !px-3 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Vincular Familiar</span>
              </button>
            </div>
          </div>

          {loadingLinks ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              Cargando dispositivos vinculados...
            </div>
          ) : activeLinks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-container/30 border border-dashed border-outline-variant/40 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">👨‍👩‍👧‍👦</span>
              <p className="font-display text-sm font-semibold text-on-surface">
                Aún no has vinculado a ningún familiar
              </p>
              <p className="font-body text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
                Genera un código QR para que papá, abuelos o tíos puedan conectarse desde sus propios teléfonos.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenQrModal('papa')}
                  className="btn-primary !py-2 !px-4 text-xs font-semibold"
                >
                  Vincular a Papá
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQrModal('familia')}
                  className="btn-secondary !py-2 !px-4 text-xs font-semibold"
                >
                  Vincular Familiar
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {activeLinks.map((link) => (
                <div
                  key={link.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-xl shrink-0 shadow-cloud-sm">
                      {link.role === 'papa' ? '🧑' : '👨‍👩‍👧'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-on-surface">
                          {link.name || (link.role === 'papa' ? 'Papá' : 'Familiar')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            link.role === 'papa'
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}
                        >
                          {link.role === 'papa' ? 'Papá' : 'Solo Lectura'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            link.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {link.status === 'active' ? 'Conectado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">
                        Código: <code className="font-mono text-primary font-bold">{link.inviteCode}</code>
                        {link.lastAccessAt && (
                          <span className="ml-2">
                            • Último acceso:{' '}
                            {new Date(link.lastAccessAt).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Botón de Desvincular para Mamá */}
                  <button
                    type="button"
                    onClick={() => handleRevoke(link.id, link.name)}
                    disabled={revokingId === link.id}
                    className="self-end sm:self-auto px-3.5 py-1.5 rounded-full border border-error/30 text-error hover:bg-error/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    title="Revocar acceso inmediatamente"
                  >
                    <span>🗑️</span>
                    <span>{revokingId === link.id ? 'Desvinculando...' : 'Desvincular'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal Generador de QR */}
      <FamilyQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        initialRole={selectedRoleForQr}
        onLinkCreated={() => loadFamilyLinks()}
      />
    </AppLayout>
  );
}
