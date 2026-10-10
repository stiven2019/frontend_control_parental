import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/States';

export default function FamilyLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithFamilyLink, user } = useAuth();

  const codeFromUrl = searchParams.get('code') || '';
  const [code, setCode] = useState(codeFromUrl);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(Boolean(codeFromUrl));
  const [infoError, setInfoError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  const [name, setName] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [remainingSecs, setRemainingSecs] = useState(0);

  // Temporizador regresivo si el enlace está pendiente
  useEffect(() => {
    if (!remainingSecs || remainingSecs <= 0) return;

    const timer = setInterval(() => {
      setRemainingSecs((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSecs]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cargar información de la invitación si hay código
  const fetchInfo = async (codeToFetch) => {
    if (!codeToFetch) return;
    setLoadingInfo(true);
    setInfoError('');
    setIsExpired(false);
    try {
      const data = await api.getFamilyInviteInfo(codeToFetch);
      setInviteInfo(data);
      setName(data.suggestedName || (data.role === 'papa' ? 'Papá' : 'Familiar'));
      if (data.remainingSeconds) {
        setRemainingSecs(data.remainingSeconds);
      }
    } catch (err) {
      if (err.expired || err.status === 410 || (err.message && err.message.toLowerCase().includes('vencid'))) {
        setIsExpired(true);
      } else {
        setInfoError(err.message || 'El código no es válido o ha expirado.');
      }
      setInviteInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    if (codeFromUrl) {
      fetchInfo(codeFromUrl);
    }
  }, [codeFromUrl]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    fetchInfo(code.trim().toUpperCase());
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setRedeemError('Por favor ingresa tu nombre.');
      return;
    }

    setRedeeming(true);
    setRedeemError('');
    try {
      const res = await api.redeemFamilyQr({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      });

      loginWithFamilyLink(res.token, res.user);
      navigate('/inicio');
    } catch (err) {
      if (err.expired || err.status === 410 || (err.message && err.message.toLowerCase().includes('vencid'))) {
        setIsExpired(true);
        setInviteInfo(null);
      } else {
        setRedeemError(err.message || 'No se pudo completar la vinculación.');
      }
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-low flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-cloud border border-outline-variant/30 p-6 sm:p-8 animate-fade-in">
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-primary-container/40 flex items-center justify-center text-3xl shadow-cloud-sm mb-3">
            {isExpired ? '⏳' : inviteInfo?.role === 'papa' ? '🧑' : '👨‍👩‍👧'}
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Vínculo Familiar Mi Bebé
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Acompaña cada paso del embarazo y la llegada del recién nacido.
          </p>
        </div>

        {loadingInfo ? (
          <LoadingState label="Verificando invitación..." />
        ) : isExpired ? (
          /* Estado Vencido (no se conectó en 15 min) */
          <div className="flex flex-col items-center text-center py-2">
            <div className="p-3 px-4 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-3 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Enlace Vencido (Límite de 15 minutos)</span>
            </div>
            <h2 className="font-display text-lg font-bold text-on-surface mb-2">
              Este código de invitación ha expirado
            </h2>
            <p className="font-body text-xs text-on-surface-variant max-w-xs mb-4 leading-relaxed">
              Los enlaces para papá o familiares tienen una validez de <strong>15 minutos</strong> desde su creación para conectarse. Al no haberse conectado a tiempo, el enlace se invalidó automáticamente por seguridad.
            </p>

            <div className="w-full p-3.5 rounded-2xl bg-surface-container/60 text-xs font-body text-on-surface-variant text-left mb-5 border border-outline-variant/30 flex gap-2.5 items-start">
              <span className="text-base shrink-0">💡</span>
              <p>
                Pídele a mamá que abra la sección <strong>Papá y Lazos Familiares</strong> en su aplicación y te genere un nuevo código QR o enlace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsExpired(false);
                setInfoError('');
                setInviteInfo(null);
                setCode('');
              }}
              className="btn-primary w-full !py-3 font-semibold text-xs shadow-cloud"
            >
              Ingresar otro código
            </button>
          </div>
        ) : inviteInfo ? (
          /* Pantalla de confirmación de invitación */
          <form onSubmit={handleRedeem} className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-secondary-container/30 border border-secondary/20 flex flex-col items-center text-center">
              <span className="text-xs uppercase font-bold text-secondary tracking-wider">
                Invitación Confirmada
              </span>
              <h2 className="font-display text-lg font-bold text-on-surface mt-1">
                Embarazo de {inviteInfo.motherName} 🌸
              </h2>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                Esperando a: <strong>{inviteInfo.babyName}</strong>
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white shadow-sm border border-outline-variant/30">
                  <span>{inviteInfo.role === 'papa' ? '🧑' : '👁️'}</span>
                  <span>
                    {inviteInfo.role === 'papa'
                      ? 'Rol: Papá (Colaborativo)'
                      : 'Rol: Familiar (Solo Lectura)'}
                  </span>
                </div>

                {remainingSecs > 0 && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-900 shadow-sm animate-pulse">
                    <span>⏱️</span>
                    <span>Vence en: {formatTimer(remainingSecs)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción de permisos */}
            <div className="p-3.5 rounded-2xl bg-surface-container/60 text-xs font-body text-on-surface-variant flex gap-2.5 items-start">
              <span className="text-base shrink-0">✨</span>
              <p>
                {inviteInfo.role === 'papa'
                  ? 'Como papá tendrás acceso a guardar y ver fotos en el Álbum, redactar recuerdos en el Diario íntimo y seguir el Desarrollo semanal del bebé.'
                  : 'Como familiar tendrás acceso de solo lectura para disfrutar de las fotos familiares, la cuenta regresiva y el crecimiento semana a semana.'}
              </p>
            </div>

            {/* Nombre del participante */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                ¿Cómo te llamas o cómo te identificará mamá?
              </label>
              <input
                type="text"
                required
                className="input-field w-full text-center font-medium"
                placeholder={inviteInfo.role === 'papa' ? 'Ej: Papá Andrés' : 'Ej: Abuela Rosa'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {redeemError && (
              <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold text-center">
                {redeemError}
              </div>
            )}

            <button
              type="submit"
              disabled={redeeming}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 shadow-cloud font-semibold text-sm"
            >
              <span>{redeeming ? 'Conectando...' : '¡Aceptar y Conectar!'}</span>
              <span>💖</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInviteInfo(null);
                setCode('');
              }}
              className="text-center font-body text-xs text-on-surface-variant hover:text-primary transition-colors mt-1"
            >
              Usar otro código
            </button>
          </form>
        ) : (
          /* Formulario para ingresar código manualmente */
          <form onSubmit={handleManualSearch} className="flex flex-col gap-4">
            <p className="font-body text-xs text-on-surface-variant text-center">
              Ingresa el código que te compartió la mamá o escanea su código QR con tu celular.
            </p>

            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Código de Invitación (Ej: MB-XXXXXX)
              </label>
              <input
                type="text"
                required
                className="input-field w-full text-center font-mono font-bold uppercase tracking-widest text-base"
                placeholder="MB-XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>

            {infoError && (
              <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold text-center">
                {infoError}
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim()}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 shadow-cloud text-sm font-semibold"
            >
              <span>Verificar Código</span>
              <span>🔍</span>
            </button>

            <div className="text-center pt-3 border-t border-outline-variant/30">
              <Link
                to="/iniciar-sesion"
                className="font-body text-xs font-semibold text-primary hover:underline"
              >
                ¿Eres la mamá? Inicia sesión aquí
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
