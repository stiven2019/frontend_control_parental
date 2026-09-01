import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-container/40 via-surface to-surface flex flex-col items-center justify-between px-6 py-10">
      <div />
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-64 h-80 rounded-lg bg-white shadow-cloud p-3 mb-8 rotate-[-1.5deg]">
          <div className="w-full h-full rounded-md bg-gradient-to-b from-secondary-container/60 to-primary-container/60 flex items-center justify-center overflow-hidden">
            <span className="text-7xl">🤰</span>
          </div>
        </div>

        <h1 className="font-display text-4xl font-semibold text-primary mb-3">
          Mi Bebé <span className="align-middle">❤️</span>
        </h1>
        <p className="font-body text-base text-on-surface-variant mb-10 max-w-xs">
          Cada semana es una nueva historia de amor.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate('/iniciar-sesion')}>
            Iniciar sesión
          </button>
          <button className="btn-secondary" onClick={() => navigate('/crear-cuenta')}>
            Crear mi cuenta
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              continueAsGuest();
              navigate('/explorar');
            }}
          >
            Continuar sin cuenta
          </button>
        </div>
      </div>
      <p className="font-body text-xs text-outline text-center max-w-xs">
        Para guardar y consultar tu información personal, deberás crear una cuenta.
      </p>
    </div>
  );
}
