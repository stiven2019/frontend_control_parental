import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminRegister() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Verificar en vivo si ya existe un administrador configurado
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await api.getAdminSetupStatus();
        if (isMounted) {
          setAdminExists(Boolean(res.adminExists));
        }
      } catch (err) {
        console.error('Error al consultar estado de admin:', err);
      } finally {
        if (isMounted) setChecking(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña de administrador debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.adminRegister({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
      });

      if (!res.token || !res.user) {
        throw new Error('Respuesta inválida del servidor al crear el administrador.');
      }

      setSuccess(true);

      // Guardar token y establecer sesión administrativa
      setToken(res.token);
      localStorage.setItem('mibebe_user', JSON.stringify(res.user));
      setUser(res.user);

      // Redirigir al panel administrativo tras breve animación de éxito
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 900);
    } catch (err) {
      setError(
        err.message ||
        'No se pudo registrar el administrador maestro. Verifica los datos e intenta nuevamente.'
      );
      if (err.message && err.message.toLowerCase().includes('ya ha sido configurado')) {
        setAdminExists(true);
      }
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
          to="/admin/login"
          className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Iniciar Sesión Admin</span>
        </Link>
      </header>

      {/* Contenido Central */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-8">
        {checking ? (
          /* Estado de Carga */
          <div className="bg-[#1c171c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-xs text-white/70 font-mono tracking-wide">
              Comprobando estado de inicialización del sistema...
            </p>
          </div>
        ) : adminExists ? (
          /* Estado Bloqueado: Ya existe un administrador registrado */
          <div className="bg-[#1c171c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/60 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mb-5 shadow-lg">
              🔒
            </div>

            <div className="inline-block bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[11px] font-mono text-amber-300 mb-3 uppercase tracking-wider">
              Registro Único Completado
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-3">
              Administrador Maestro Configurado
            </h1>

            <p className="text-xs text-white/70 leading-relaxed max-w-md mx-auto mb-6">
              El sistema <strong className="text-white">Mi Bebé</strong> ya cuenta con un Administrador registrado. Por políticas estrictas de seguridad y control, <span className="text-amber-300 font-semibold">solo se admite un único administrador global</span> en esta aplicación.
            </p>

            <div className="p-4 rounded-2xl bg-[#272027]/70 border border-white/10 text-left mb-6">
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0">🛡️</span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  El formulario de registro ha quedado <strong className="text-white">deshabilitado permanentemente</strong>. Si eres el administrador del sistema, por favor inicia sesión con tus credenciales.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link
                to="/admin/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#a47287] hover:opacity-95 text-white font-semibold text-xs tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>🔑</span>
                <span>Ir al Inicio de Sesión de Admin</span>
              </Link>

              <Link
                to="/"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs border border-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>←</span>
                <span>Volver a la App</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Formulario de Registro del Administrador Maestro */
          <div className="bg-[#1c171c]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/60 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-amber-600/40 border border-white/10 flex items-center justify-center text-3xl mb-4 shadow-lg">
                🛡️
              </div>

              <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-mono text-amber-300 font-semibold mb-2 uppercase tracking-wider">
                ⭐ Primer Inicio • Administrador Único
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                Registrar Administrador Maestro
              </h1>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Esta será la <strong>única cuenta administrativa</strong> con privilegios globales. Una vez creada, este formulario desaparecerá permanentemente.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-3 animate-shake">
                <span className="text-base shrink-0">⚠️</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-start gap-3">
                <span className="text-base shrink-0">✓</span>
                <span className="leading-relaxed">¡Administrador Maestro creado con éxito! Ingresando al panel...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Carlos"
                    className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Mendoza"
                    className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Correo Electrónico Administrativo
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mibebe.app"
                  className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Teléfono Celular <span className="text-[10px] text-white/40 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 3123456789"
                  className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Contraseña Maestra (mínimo 8 caracteres)
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
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Confirmar Contraseña Maestra
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#272027] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-[#a47287] hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Configurando Administrador...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrar Administrador Maestro y Entrar</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <span className="text-[11px] text-white/40 block">
                🔒 Al completar este registro, no será posible crear más administradores.
              </span>
            </div>
          </div>
        )}
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
