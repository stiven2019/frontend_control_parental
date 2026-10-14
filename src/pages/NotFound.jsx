import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 sm:p-8 font-body text-on-surface">
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-outline-variant/30">
        <Link to={user ? "/inicio" : "/"} className="flex items-center gap-2.5">
          <span className="text-3xl">🌸</span>
          <div>
            <span className="font-display font-bold text-lg text-primary tracking-tight">Mi Bebé</span>
            <span className="text-[10px] ml-2 font-mono uppercase bg-primary-container text-primary font-semibold px-2 py-0.5 rounded-full">
              Salud & Maternidad
            </span>
          </div>
        </Link>

        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Regresar</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="card text-center p-6 sm:p-10 shadow-cloud bg-white rounded-3xl border border-outline-variant/40 animate-fade-in relative overflow-hidden">
          {/* Resplandor decorativo */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-4xl mb-5 shadow-cloud-sm border border-amber-500/20">
            🧭
          </div>

          <div className="inline-block bg-amber-500/10 text-amber-700 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            Error 404 • Módulo No Encontrado
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-3 tracking-tight">
            La página o módulo que buscas no está disponible
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-6">
            Es posible que el enlace haya cambiado, que el módulo haya sido reubicado o que hayas escrito una dirección incorrecta.
          </p>

          {/* Tarjetas de acceso rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6">
            <Link
              to={user ? "/inicio" : "/"}
              className="p-3.5 rounded-2xl bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant/30 transition-all flex items-center gap-3 group active:scale-95"
            >
              <span className="text-2xl p-2 rounded-xl bg-white shadow-sm shrink-0">🏠</span>
              <div>
                <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                  {user ? 'Panel Principal (Inicio)' : 'Página de Inicio'}
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  {user ? 'Resumen de embarazo y alertas' : 'Bienvenida a Mi Bebé'}
                </span>
              </div>
            </Link>

            <Link
              to="/mi-bebe"
              className="p-3.5 rounded-2xl bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant/30 transition-all flex items-center gap-3 group active:scale-95"
            >
              <span className="text-2xl p-2 rounded-xl bg-white shadow-sm shrink-0">🤰</span>
              <div>
                <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                  Mi Bebé en Gestación
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Desarrollo intrauterino y pataditas
                </span>
              </div>
            </Link>

            <Link
              to="/carnet-bebe"
              className="p-3.5 rounded-2xl bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant/30 transition-all flex items-center gap-3 group active:scale-95"
            >
              <span className="text-2xl p-2 rounded-xl bg-white shadow-sm shrink-0">🚼</span>
              <div>
                <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                  Carnet del Bebé Nacido
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Curvas OMS, vacunas PAI y pediatría
                </span>
              </div>
            </Link>

            <Link
              to="/medicamentos"
              className="p-3.5 rounded-2xl bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant/30 transition-all flex items-center gap-3 group active:scale-95"
            >
              <span className="text-2xl p-2 rounded-xl bg-white shadow-sm shrink-0">💊</span>
              <div>
                <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                  Medicamentos & Alarmas
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  Dosis y recordatorios médicos
                </span>
              </div>
            </Link>
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="btn-primary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-cloud rounded-full active:scale-95"
            >
              <span>←</span>
              <span>Volver a la Pantalla Anterior</span>
            </button>

            <Link
              to={user ? "/inicio" : "/iniciar-sesion"}
              className="btn-secondary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-full active:scale-95 border border-outline-variant/30"
            >
              <span>{user ? 'Ir al Dashboard' : 'Iniciar Sesión'}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-6 border-t border-outline-variant/20 text-xs text-on-surface-variant">
        <p>© {new Date().getFullYear()} Mi Bebé • Control Prenatal y Salud Infantil</p>
      </footer>
    </div>
  );
}
