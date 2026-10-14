import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [adminExists, setAdminExists] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getAdminSetupStatus()
      .then((res) => {
        if (isMounted) {
          setAdminExists(Boolean(res.adminExists));
        }
      })
      .catch((err) => {
        console.error('Error al comprobar setup de admin:', err);
      })
      .finally(() => {
        if (isMounted) setCheckingSetup(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.adminLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.token || !res.user) {
        throw new Error('Respuesta del servidor no válida.');
      }

      // Guardar token y sincronizar sesión
      setToken(res.token);
      localStorage.setItem('mibebe_user', JSON.stringify(res.user));
      setUser(res.user);

      // Redirigir al Panel Administrativo
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales administrativas inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#110e11] text-white flex flex-col justify-between p-5 md:p-8 font-body relative overflow-hidden">
      {/* Luces y gradientes de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Superior */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🛡️</span>
          <div>
            <span className="font-display font-bold text-lg tracking-tight text-white">Mi Bebé</span>
            <span className="text-[10px] ml-2 font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-amber-300 font-semibold border border-white/10">
              Admin Gateway
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Volver a la App</span>
        </Link>
      </header>

      {/* Formulario Central */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-10">
        <div className="bg-[#1c171c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/60">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-amber-600/40 border border-white/10 flex items-center justify-center text-3xl mb-4 shadow-lg">
              🛡️
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Control Maestro
            </h1>
            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
              Portal exclusivo para administradores del sistema. Autenticación restringida y auditoría de seguridad activa.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-3 animate-shake">
              <span className="text-base shrink-0">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {!checkingSetup && !adminExists && (
            <div className="mb-6 p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2.5 animate-fade-in shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-base">⭐</span>
                <span className="font-semibold text-amber-300">Configuración Inicial Requerida</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                No se ha detectado ningún Administrador registrado. Como es la primera vez, debes configurar al <strong className="text-white">único Administrador Maestro</strong> del sistema.
              </p>
              <Link
                to="/admin/registro"
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md active:scale-95 text-center mt-1"
              >
                <span>🛡️</span>
                <span>Registrar Administrador Maestro Aquí</span>
                <span>→</span>
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                Correo Administrativo
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mibebe.app"
                className="w-full bg-[#272027] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                  Contraseña de Administrador
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#272027] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-[#a47287] hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel de Control</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <span className="text-[11px] text-white/40 block">
              Acceso restringido • Todos los accesos no autorizados son monitoreados
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-md w-full mx-auto text-center py-4">
        <p className="text-[11px] text-white/30">
          © {new Date().getFullYear()} Mi Bebé • Master Administration Terminal
        </p>
      </footer>
    </div>
  );
}
