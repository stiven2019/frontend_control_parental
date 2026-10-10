import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../api/client';

export default function FamilyQrModal({
  isOpen,
  onClose,
  initialRole = 'papa',
  onLinkCreated,
  currentCount = 0,
  maxLimit = 10,
  existingLinks = [],
  partnerLinkActive = false,
}) {
  const isPapaDisabled = partnerLinkActive || existingLinks.some((l) => l.role === 'papa' && l.status === 'active');
  const effectiveInitialRole = isPapaDisabled ? 'familia' : initialRole;

  const [role, setRole] = useState(effectiveInitialRole);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [refreshNotice, setRefreshNotice] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRole(isPapaDisabled ? 'familia' : initialRole);
      setName('');
      setError('');
      setGeneratedLink(null);
      setCopied(false);
      setTimeLeft(15 * 60);
      setRefreshNotice('');
    }
  }, [isOpen, initialRole, isPapaDisabled]);

  // Manejo de temporizador regresivo de 15 minutos con auto-refresco si no se conecta
  useEffect(() => {
    if (!generatedLink) return;

    const calcRemaining = () => {
      const exp = generatedLink.expiresAt
        ? new Date(generatedLink.expiresAt).getTime()
        : new Date(generatedLink.createdAt).getTime() + 15 * 60 * 1000;
      return Math.max(0, Math.floor((exp - Date.now()) / 1000));
    };

    const initialRem = calcRemaining();
    setTimeLeft(initialRem);

    if (initialRem <= 0) {
      // Si ya estaba vencido al cargar, refrescar de inmediato
      autoRefresh();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        // Cada 15 min se refresca automáticamente en caso de que no se haya conectado
        autoRefresh();
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedLink?.id, generatedLink?.expiresAt]);

  const autoRefresh = async () => {
    if (!generatedLink?.id || refreshing) return;
    setRefreshing(true);
    try {
      const res = await api.refreshFamilyLink(generatedLink.id);
      setGeneratedLink(res.link);
      setRefreshNotice('El código se renovó automáticamente por caducidad de 15 minutos.');
      if (onLinkCreated) onLinkCreated(res.link);
    } catch (err) {
      console.warn('Auto-refresh fallo:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!generatedLink?.id || refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      const res = await api.refreshFamilyLink(generatedLink.id);
      setGeneratedLink(res.link);
      setRefreshNotice('Código renovado exitosamente por 15 minutos adicionales.');
      if (onLinkCreated) onLinkCreated(res.link);
    } catch (err) {
      setError(err.message || 'No se pudo refrescar el código.');
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshNotice(''), 5000);
    }
  };

  useEffect(() => {
    if (generatedLink?.inviteUrl && canvasRef.current && timeLeft > 0) {
      QRCode.toCanvas(
        canvasRef.current,
        generatedLink.inviteUrl,
        {
          width: 230,
          margin: 2,
          color: {
            dark: '#3A2E39',
            light: '#FFFFFF',
          },
        },
        (err) => {
          if (err) console.error('Error renderizando código QR:', err);
        }
      );
    }
  }, [generatedLink, timeLeft]);

  if (!isOpen) return null;

  const isLimitReached = currentCount >= maxLimit;

  // Validación de nombre duplicado en tiempo real
  const normalize = (s) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const candidateName = name.trim() || (role === 'papa' ? 'Papá' : 'Familiar');
  const duplicateLink = existingLinks.find(
    (l) => ['active', 'pending'].includes(l.status) && normalize(l.name || (l.role === 'papa' ? 'Papá' : 'Familiar')) === normalize(candidateName)
  );
  const isDuplicateName = Boolean(duplicateLink);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (isLimitReached) {
      setError(`Has alcanzado el límite máximo de ${maxLimit} enlaces permitidos.`);
      return;
    }

    if (role === 'papa' && isPapaDisabled) {
      setError('Ya existe un papá vinculado en este embarazo. Solo se permite un solo papá.');
      return;
    }

    if (isDuplicateName) {
      setError(`Ya existe un familiar con el nombre "${candidateName}". Para evitar confusiones, no debe haber dos personas llamadas de la misma forma (ej: agrega un segundo nombre o apellido).`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.generateFamilyQr({ role, name });
      setGeneratedLink(res.link);
      if (onLinkCreated) onLinkCreated(res.link);
    } catch (err) {
      setError(err.message || 'No se pudo generar el código QR.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink?.inviteUrl) return;
    navigator.clipboard.writeText(generatedLink.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isExpired = timeLeft <= 0;

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Te invito a acompañar nuestro embarazo en la app Mi Bebé 👶🌸. Escanea este enlace para vincularte con nosotros (caducidad de 15 min): ${generatedLink?.inviteUrl || ''}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-cloud border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{role === 'papa' ? '🧑' : '👨‍👩‍👧'}</span>
            <div>
              <h3 className="font-display text-lg font-semibold text-on-surface">
                {generatedLink ? 'Código QR Generado' : 'Vincular por Código QR'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Límite: {currentCount}/{maxLimit} enlaces usados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            ✕
          </button>
        </div>

        {!generatedLink ? (
          <form onSubmit={handleGenerate} className="flex flex-col gap-4 mt-4">
            {isLimitReached && (
              <div className="p-3.5 rounded-2xl bg-error-container/30 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  Has alcanzado el límite máximo de {maxLimit} enlaces. Para generar uno nuevo, revoca o elimina enlaces anteriores en la sección de acompañantes.
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  ¿A quién deseas vincular?
                </label>
                {isPapaDisabled && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Solo 1 papá permitido
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isPapaDisabled}
                  onClick={() => setRole('papa')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    isPapaDisabled
                      ? 'opacity-40 cursor-not-allowed bg-surface-container/30 border-outline-variant/30'
                      : role === 'papa'
                      ? 'border-primary bg-primary-container/30 shadow-sm'
                      : 'border-outline-variant/40 hover:bg-surface-container/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🧑</span>
                    {isPapaDisabled && <span className="text-[10px] font-bold text-slate-500">Ya vinculado</span>}
                  </div>
                  <span className="font-display text-sm font-semibold text-on-surface">Papá / Pareja</span>
                  <span className="font-body text-[11px] text-on-surface-variant leading-tight">
                    {isPapaDisabled
                      ? 'Ya existe un papá registrado en la app.'
                      : 'Álbum + Diario íntimo + Desarrollo'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('familia')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    role === 'familia'
                      ? 'border-secondary bg-secondary-container/30 shadow-sm'
                      : 'border-outline-variant/40 hover:bg-surface-container/50'
                  }`}
                >
                  <span className="text-xl">👨‍👩‍👧</span>
                  <span className="font-display text-sm font-semibold text-on-surface">Familiar</span>
                  <span className="font-body text-[11px] text-on-surface-variant leading-tight">
                    Solo lectura de fotos, cuenta regresiva y desarrollo
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-1.5">
                Nombre o apodo diferenciador {role === 'familia' ? '(Requerido para evitar nombres repetidos)' : '(opcional)'}
              </label>
              <input
                type="text"
                className={`input-field w-full text-sm ${isDuplicateName ? 'border-error ring-1 ring-error' : ''}`}
                placeholder={role === 'papa' ? 'Ej: Papá Andrés' : 'Ej: Abuela Rosa, Abuela María, Tía Sofía'}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
              />
              {isDuplicateName && (
                <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1 animate-fade-in">
                  <span>⚠️</span>
                  <span>
                    Ya existe un miembro registrado como "<strong>{duplicateLink.name || duplicateLink.role}</strong>". No debe haber dos familiares llamados de la misma forma (ej: usa "{candidateName} M.").
                  </span>
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container/60 text-xs font-body text-on-surface-variant flex flex-col gap-1.5">
              <div className="flex gap-2 items-start">
                <span className="text-sm shrink-0">🛡️</span>
                <p>
                  {role === 'papa'
                    ? 'Papá podrá ver y subir fotos al álbum, redactar en el diario y ver el desarrollo. Tus controles médicos y síntomas siguen siendo 100% privados.'
                    : 'Los familiares tendrán acceso de SOLO LECTURA a fotos del álbum y desarrollo del bebé. Podrás desvincularlos cuando desees.'}
                </p>
              </div>
              <div className="flex gap-2 items-start pt-1 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                <span className="text-sm shrink-0">⏱️</span>
                <p>
                  <strong>Caducidad de 15 minutos:</strong> El enlace y código vencen a los 15 min si la persona no se ha conectado. Si mantienes abierta la pantalla, se refrescará automáticamente cada 15 min hasta que se conecte.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading || isLimitReached || isDuplicateName}
                className="btn-primary flex-1 !py-3 flex items-center justify-center gap-2 shadow-cloud disabled:opacity-50"
              >
                <span>{loading ? 'Generando...' : 'Generar Código QR (15 min)'}</span>
                <span>✨</span>
              </button>
              <button type="button" onClick={onClose} className="btn-secondary !py-3">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center mt-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-container text-on-primary-container mb-2">
              {generatedLink.role === 'papa' ? '🧑 Para Papá / Pareja' : `👨‍👩‍👧 Para: ${generatedLink.name || 'Familiar (Solo lectura)'}`}
            </span>

            {/* Aviso de refresco automático */}
            {refreshNotice && (
              <div className="mb-2 p-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in">
                <span>🔄</span>
                <span>{refreshNotice}</span>
              </div>
            )}

            {/* Contador de tiempo de 15 minutos con auto-refresco */}
            {!isExpired ? (
              <div className="mb-3 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>
                  Caduca en: <strong className="font-mono text-sm">{formatTimer(timeLeft)}</strong> (se refresca cada 15 min si no se conecta)
                </span>
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔄</span>
                  <span>Refrescando código de 15 minutos...</span>
                </div>
                <p className="text-[11px] font-normal text-amber-700">
                  Caducó el ciclo anterior sin conexión. Renovando código...
                </p>
              </div>
            )}

            <div className={`p-4 bg-white rounded-3xl shadow-cloud border border-outline-variant/30 flex items-center justify-center mb-3 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
              <canvas ref={canvasRef} className="rounded-xl" />
            </div>

            <p className="font-body text-xs text-on-surface-variant max-w-xs mb-3">
              Pídele a {generatedLink.name || (generatedLink.role === 'papa' ? 'papá' : 'tu familiar')} que apunte la cámara de su teléfono a este código QR o abre el enlace en los próximos 15 minutos.
            </p>

            <div className="w-full p-2.5 bg-surface-container rounded-2xl flex items-center justify-between gap-2 mb-3 border border-outline-variant/20">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Código de enlace (15 min):</span>
                <span className="font-mono text-sm font-bold text-primary truncate block">
                  {generatedLink.inviteCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white shadow-sm border border-outline-variant/30 hover:bg-surface-high transition-colors"
              >
                {copied ? '¡Copiado! ✓' : 'Copiar link'}
              </button>
            </div>

            <div className="w-full flex flex-col gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-[#25D366] text-white font-body text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
              >
                <span>📲</span>
                <span>Compartir invitación por WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={handleManualRefresh}
                  className="btn-secondary !text-xs !py-2.5 flex items-center justify-center gap-1.5"
                  title="Refrescar y reiniciar los 15 minutos de caducidad"
                >
                  <span>🔄</span>
                  <span>{refreshing ? 'Refrescando...' : 'Refrescar (15 min)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedLink(null);
                    setError('');
                  }}
                  className="btn-ghost !text-xs !py-2.5"
                >
                  Nuevo miembro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
