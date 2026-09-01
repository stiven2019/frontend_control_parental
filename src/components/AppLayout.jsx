import AppNav from './AppNav';
import NotificationBell from './NotificationBell';
import ActiveAlarmModal from './ActiveAlarmModal';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface md:flex">
      <AppNav />
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior con campana de notificaciones y alarmas */}
        <header className="w-full px-5 md:px-10 pt-4 pb-2 flex items-center justify-between max-w-[1120px] mx-auto">
          <div className="md:hidden flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <span className="font-display text-lg font-semibold text-primary">Mi Bebé</span>
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

