import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  // Analizar y calcular tiempo de expiración (15 minutos desde emisión)
  useEffect(() => {
    if (!token) {
      setError('No se proporcionó ningún token de recuperación.');
      return;
    }

    try {
      // Si el token es un JWT, decodificamos su payload para obtener la fecha de expiración
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp) {
          const expMs = payload.exp * 1000;
          const initialRemaining = Math.floor((expMs - Date.now()) / 1000);

          if (initialRemaining <= 0) {
            setIsExpired(true);
            setSecondsRemaining(0);
            return;
          }

          setSecondsRemaining(initialRemaining);
          const interval = setInterval(() => {
            const current = Math.floor((expMs - Date.now()) / 1000);
            if (current <= 0) {
              setIsExpired(true);
              setSecondsRemaining(0);
              clearInterval(interval);
            } else {
              setSecondsRemaining(current);
            }
          }, 1000);

          return () => clearInterval(interval);
        }
      }
    } catch (e) {
      // Si no es JWT estándar o falla el parseo, dejamos un temporizador de 15 min de referencia
      setSecondsRemaining(15 * 60);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isExpired || (secondsRemaining !== null && secondsRemaining <= 0)) {
      setError('Este enlace ha caducado. Tiene un tiempo de validez estricto de 15 minutos. Por favor solicita uno nuevo.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate('/iniciar-sesion');
      }, 3500);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('caducad')) {
        setIsExpired(true);
      }
      setError(err.message || 'No pudimos restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-container/60 mx-auto flex items-center justify-center text-3xl mb-3 shadow-cloud-sm">
            🔑
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            Restablecer Contraseña
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1.5">
            Crea una nueva clave segura para acceder al seguimiento de tu bebé.
          </p>
        </div>

        {/* Alerta de caducidad estricta de 15 minutos */}
        {secondsRemaining !== null && !isExpired && (
          <div className="mb-4 p-3 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-between text-xs font-body text-on-surface">
            <div className="flex items-center gap-2">
              <span className="text-base animate-pulse">⏱️</span>
              <span>Enlace válido por <strong>15 minutos</strong>:</span>
            </div>
            <span className="font-mono font-bold bg-secondary text-white px-2 py-0.5 rounded text-xs">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        )}

        {isExpired ? (
          <div className="card p-6 text-center border-2 border-error/30 shadow-cloud bg-white">
            <span className="text-4xl block mb-2">⌛</span>
            <h2 className="font-display text-lg font-bold text-error mb-2">
              El enlace de recuperación ha caducado
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-5 leading-relaxed">
              Por motivos de seguridad y confidencialidad médica, los enlaces enviados por WhatsApp tienen una validez máxima de <strong>15 minutos</strong>.
            </p>
            <Link
              to="/recuperar-contrasena"
              className="btn-primary w-full block text-center !py-2.5 text-xs font-semibold"
            >
              Generar un nuevo enlace por WhatsApp
            </Link>
          </div>
        ) : success ? (
          <div className="card p-6 text-center border-2 border-secondary/30 shadow-cloud bg-white animate-fadeIn">
            <span className="text-5xl block mb-3">🎉</span>
            <h2 className="font-display text-xl font-bold text-secondary mb-2">
              ¡Contraseña restablecida con éxito!
            </h2>
            <p className="font-body text-xs sm:text-sm text-on-surface-variant mb-4 leading-relaxed">
              Tu clave ha sido actualizada. Te redirigiremos automáticamente a la pantalla de inicio de sesión en unos segundos...
            </p>
            <Link to="/iniciar-sesion" className="btn-primary w-full block text-center !py-2.5 text-xs font-semibold">
              Iniciar sesión ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card flex flex-col gap-4 shadow-cloud">
            <div>
              <label className="field-label flex items-center justify-between">
                <span>Nueva contraseña</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="input-field"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Confirmar nueva contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="input-field"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 flex items-start gap-2">
                <span className="text-error text-sm shrink-0 mt-0.5">⚠️</span>
                <p className="text-xs text-error font-body leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="btn-primary mt-2"
            >
              {loading ? 'Guardando nueva contraseña...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            to="/iniciar-sesion"
            className="font-body text-xs sm:text-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1"
          >
            <span>←</span>
            <span>Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
