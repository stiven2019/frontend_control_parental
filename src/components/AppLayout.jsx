import { useLocation, useNavigate } from 'react-router-dom';
import AppNav from './AppNav';
import NotificationBell from './NotificationBell';
import ActiveAlarmModal from './ActiveAlarmModal';

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function BrandHeart() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.6 4.5 6.1 4.5c2 0 3.4 1.1 4.2 2.4.3.5 1.1.5 1.4 0 .8-1.3 2.2-2.4 4.2-2.4 3.5 0 5.2 3.7 3.7 7.2C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/inicio';

  const goBack = () => {
    // Si no hay historial previo (entrada directa), volver al inicio
    if (window.history.length > 1 && location.key !== 'default') navigate(-1);
    else navigate('/inicio');
  };

  return (
    <div className="relative min-h-screen bg-surface md:flex overflow-x-clip">
      {/* Circulos decorativos suaves (Nube suave) */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full bg-primary-container opacity-60 md:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute top-[38%] -left-28 w-64 h-64 rounded-full bg-lilac-container opacity-40 md:hidden" />

      <AppNav />
      <main className="relative flex-1 min-w-0 flex flex-col">
        {/* Barra superior: volver (solo movil, fuera del inicio) y campana */}
        <header className="w-full px-5 md:px-10 pt-4 pb-2 flex items-center justify-between max-w-[1120px] mx-auto">
          <div className="md:hidden flex items-center gap-2.5">
            {isHome ? (
              <>
                <span className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-cloud-sm">
                  <BrandHeart />
                </span>
                <span className="font-display text-lg font-semibold text-primary">Mi Bebé</span>
              </>
            ) : (
              <button type="button" onClick={goBack} aria-label="Volver" className="icon-btn">
                <ChevronLeft />
              </button>
            )}
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <div className="max-w-[1120px] w-full mx-auto px-5 md:px-10 pt-2 pb-32 md:pb-16 flex-1">
          {children}
        </div>
      </main>

      {/* Modal de alarma sonora activa */}
      <ActiveAlarmModal />
    </div>
  );
}
