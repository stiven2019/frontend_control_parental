import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModuleIcon from '../components/ModuleIcons';

export default function Welcome() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  return (
    <div className="auth-shell min-h-screen bg-surface flex flex-col items-center justify-between px-6 py-10">
      <div />
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="relative w-56 h-56 mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-container to-lilac-container shadow-cloud" />
          <div className="absolute inset-6 rounded-full bg-white/70 flex items-center justify-center text-primary">
            <ModuleIcon name="heart" className="w-20 h-20" strokeWidth={1.6} />
          </div>
          <span className="absolute -top-1 right-4 w-10 h-10 rounded-full bg-peach-container" aria-hidden="true" />
          <span className="absolute bottom-3 -left-2 w-7 h-7 rounded-full bg-secondary-container" aria-hidden="true" />
        </div>

        <h1 className="font-display text-4xl font-semibold text-primary mb-3">
          Mi Bebé
        </h1>
        <p className="font-body text-base text-on-surface-variant mb-10 max-w-xs">
          Cada semana es una nueva historia de amor.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            className="btn-primary flex items-center justify-center text-center"
            onClick={() => navigate('/iniciar-sesion')}
          >
            Iniciar sesión
          </button>
          <button
            className="btn-secondary flex items-center justify-center text-center"
            onClick={() => navigate('/crear-cuenta')}
          >
            Crear mi cuenta
          </button>
          <button
            className="btn-ghost flex items-center justify-center text-center"
            onClick={() => {
              continueAsGuest();
              navigate('/explorar');
            }}
          >
            Continuar sin cuenta
          </button>
        </div>
      </div>
      <div className="text-center font-body text-xs text-on-surface-variant max-w-xs space-y-1">
        <p>Para guardar y consultar tu información personal, deberás crear una cuenta.</p>
        <p>
          <a href="/terminos-y-condiciones" className="text-primary hover:underline font-medium">
            Términos y Condiciones (Colombia)
          </a>
        </p>
      </div>
    </div>
  );
}
