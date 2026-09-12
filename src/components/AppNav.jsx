import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasModuleAccess } from './SubscriptionGuard';
import SubscriptionModal from './SubscriptionModal';

const MOBILE_NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/mi-bebe', label: 'Gestación', icon: GestationIcon, moduleKey: 'gestacion' },
  { to: '/carnet-bebe', label: 'Carnet Bebé', icon: CarnetIcon, moduleKey: 'carnet_bebe' },
  { to: '/album', label: 'Álbum', icon: AlbumIcon, moduleKey: 'album' },
  { to: '/perfil', label: 'Perfil', icon: ProfileIcon },
];

const DESKTOP_NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/calendario', label: 'Calendario', icon: CalendarIcon, moduleKey: 'calendario' },
  { to: '/mi-bebe', label: 'Mi Bebé (Gestación)', icon: GestationIcon, moduleKey: 'gestacion' },
  { to: '/carnet-bebe', label: 'Carnet Infantil (Nacido)', icon: CarnetIcon, moduleKey: 'carnet_bebe' },
  { to: '/album', label: 'Álbum de Fotos', icon: AlbumIcon, moduleKey: 'album' },
  { to: '/perfil', label: 'Mi Perfil', icon: ProfileIcon },
];

export default function AppNav() {
  const { user } = useAuth();
  const [subModalOpen, setSubModalOpen] = useState(false);

  const handleNavClick = (e, item) => {
    if (item.moduleKey && !hasModuleAccess(user, item.moduleKey)) {
      e.preventDefault();
      setSubModalOpen(true);
    }
  };

  return (
    <>
      {/* Móvil: barra inferior flotante con glassmorphism */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1">
        <div className="mx-auto max-w-md flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-full shadow-cloud px-2 py-1.5 border border-white/60">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isLocked = item.moduleKey && !hasModuleAccess(user, item.moduleKey);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item)}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'text-primary' : 'text-outline'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon filled={isActive} className="w-5 h-5" />
                      {isLocked && (
                        <span className="absolute -top-1 -right-1.5 text-[10px]">
                          🔒
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop / tablet: sidebar lateral */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-outline-variant/40 px-6 py-8 bg-surface-low">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="text-2xl">👶</span>
          <span className="font-display text-xl font-semibold text-primary">Mi Bebé</span>
        </div>
        <nav className="flex flex-col gap-1.5">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isLocked = item.moduleKey && !hasModuleAccess(user, item.moduleKey);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-full font-body font-medium text-sm transition-colors ${
                    isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon filled={isActive} className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {isLocked && (
                      <span className="text-xs" title="Requiere suscripción">
                        🔒
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Modal de suscripción al intentar entrar a Álbum si está bloqueado */}
      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        requestedModule="album"
      />
    </>
  );
}

function HomeIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  );
}
function CalendarIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
function GestationIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M7 21a5 5 0 0 1 5-5c3.5 0 6 2 6 5" />
      <path d="M12 11c2.5 0 4.5 1.8 4.5 4" />
    </svg>
  );
}
function CarnetIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M8 8h8M8 12h8M8 16h4" />
      <circle cx="15.5" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
function AlbumIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 17l4.5-4.5a2 2 0 0 1 2.8 0L18 18" />
    </svg>
  );
}
function ProfileIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}
