import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasModuleAccess } from './SubscriptionGuard';
import SubscriptionModal from './SubscriptionModal';

const DEFAULT_MOBILE_NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/mi-bebe', label: 'Gestación', icon: GestationIcon, moduleKey: 'gestacion' },
  { to: '/carnet-bebe', label: 'Carnet Bebé', icon: CarnetIcon, moduleKey: 'carnet_bebe' },
  { to: '/album', label: 'Álbum', icon: AlbumIcon, moduleKey: 'album' },
  { to: '/perfil', label: 'Perfil', icon: ProfileIcon },
];

const DEFAULT_DESKTOP_NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/calendario', label: 'Calendario', icon: CalendarIcon, moduleKey: 'calendario' },
  { to: '/mi-bebe', label: 'Mi Bebé (Gestación)', icon: GestationIcon, moduleKey: 'gestacion' },
  { to: '/carnet-bebe', label: 'Carnet Infantil (Nacido)', icon: CarnetIcon, moduleKey: 'carnet_bebe' },
  { to: '/album', label: 'Álbum de Fotos', icon: AlbumIcon, moduleKey: 'album' },
  { to: '/papa', label: 'Papá y Familia', icon: FamilyIcon, moduleKey: 'papa' },
  { to: '/ejercicios', label: 'Ejercicios del parto', icon: ExerciseIcon, moduleKey: 'ejercicios' },
  { to: '/cuentos', label: 'Cuentos para soñar', icon: StoryIcon, moduleKey: 'cuentos' },
  { to: '/recuerdo', label: 'Libro de recuerdos', icon: BookIcon, moduleKey: 'recuerdo' },
  { to: '/perfil', label: 'Mi Perfil', icon: ProfileIcon },
];

// Rutas adaptadas para Familiar (Solo Lectura)
const FAMILIA_MOBILE_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/album', label: 'Álbum (Lectura)', icon: AlbumIcon },
  { to: '/guia-desarrollo', label: 'Desarrollo', icon: GestationIcon },
  { to: '/cuenta-regresiva', label: 'Cuenta Regresiva', icon: CalendarIcon },
  { to: '/perfil', label: 'Perfil', icon: ProfileIcon },
];

const FAMILIA_DESKTOP_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/album', label: 'Álbum de Fotos (Solo Lectura)', icon: AlbumIcon },
  { to: '/guia-desarrollo', label: 'Desarrollo Fetal', icon: GestationIcon },
  { to: '/cuenta-regresiva', label: 'Cuenta Regresiva al Parto', icon: CalendarIcon },
  { to: '/perfil', label: 'Mi Perfil', icon: ProfileIcon },
];

// Rutas adaptadas para Papá (Colaborativo: Álbum + Diario + Desarrollo)
const PAPA_MOBILE_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/album', label: 'Álbum', icon: AlbumIcon },
  { to: '/diario', label: 'Diario', icon: JournalIcon },
  { to: '/ejercicios', label: 'Ejercicios', icon: ExerciseIcon, moduleKey: 'ejercicios' },
  { to: '/perfil', label: 'Perfil', icon: ProfileIcon },
];

const PAPA_DESKTOP_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: HomeIcon },
  { to: '/album', label: 'Álbum de Fotos', icon: AlbumIcon },
  { to: '/diario', label: 'Diario de Recuerdos', icon: JournalIcon },
  { to: '/ejercicios', label: 'Ejercicios para papá', icon: ExerciseIcon, moduleKey: 'ejercicios' },
  { to: '/cuentos', label: 'Cuentos para soñar', icon: StoryIcon, moduleKey: 'cuentos' },
  { to: '/guia-desarrollo', label: 'Desarrollo Fetal', icon: GestationIcon },
  { to: '/cuenta-regresiva', label: 'Cuenta Regresiva', icon: CalendarIcon },
  { to: '/perfil', label: 'Mi Perfil', icon: ProfileIcon },
];

// Color del "pill" activo por posicion (Nube suave)
const ACTIVE_TINTS = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-peach-container text-on-peach-container',
  'bg-lilac-container text-on-lilac-container',
];

function LockGlyph({ className = 'w-3 h-3' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function BrandHeart({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.6 4.5 6.1 4.5c2 0 3.4 1.1 4.2 2.4.3.5 1.1.5 1.4 0 .8-1.3 2.2-2.4 4.2-2.4 3.5 0 5.2 3.7 3.7 7.2C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

export default function AppNav() {
  const { user, isFamilyLink, isFamilyMember, isPartnerLink } = useAuth();
  const [subModalOpen, setSubModalOpen] = useState(false);

  const mobileNavItems = isFamilyMember
    ? FAMILIA_MOBILE_ITEMS
    : isPartnerLink
    ? PAPA_MOBILE_ITEMS
    : DEFAULT_MOBILE_NAV_ITEMS;

  const desktopNavItems = isFamilyMember
    ? FAMILIA_DESKTOP_ITEMS
    : isPartnerLink
    ? PAPA_DESKTOP_ITEMS
    : DEFAULT_DESKTOP_NAV_ITEMS;

  const handleNavClick = (e, item) => {
    if (item.moduleKey && !hasModuleAccess(user, item.moduleKey)) {
      e.preventDefault();
      setSubModalOpen(true);
    }
  };

  return (
    <>
      {/* Movil: barra inferior flotante tipo pastilla (Nube suave) */}
      <nav aria-label="Principal" className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-1 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md flex items-center justify-between bg-white rounded-full shadow-float px-2 h-[68px]">
          {mobileNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isLocked = item.moduleKey && !hasModuleAccess(user, item.moduleKey);
            const tint = ACTIVE_TINTS[idx % ACTIVE_TINTS.length];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item)}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2.5 py-2 rounded-3xl transition-colors ${
                    isActive ? tint : 'text-on-surface-variant'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon filled={isActive} className="w-[22px] h-[22px]" />
                      {isLocked && (
                        <span className="absolute -top-1 -right-2 text-primary bg-white rounded-full p-px">
                          <LockGlyph className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] font-bold leading-none">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop / tablet: sidebar lateral */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 px-5 py-8 bg-surface-low overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <span className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center shadow-cloud-sm">
            <BrandHeart className="w-5 h-5" />
          </span>
          <span className="font-display text-xl font-semibold text-primary">Mi Bebé</span>
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1.5">
          {desktopNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isLocked = item.moduleKey && !hasModuleAccess(user, item.moduleKey);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-full font-body font-bold text-sm transition-colors ${
                    isActive ? ACTIVE_TINTS[idx % ACTIVE_TINTS.length] : 'text-on-surface-variant hover:bg-surface-container'
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
                      <span className="text-on-surface-variant" title="Requiere suscripción">
                        <LockGlyph className="w-3.5 h-3.5" />
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
function JournalIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M6 6h10M6 10h10M6 14h6" />
    </svg>
  );
}
function FamilyIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M3 18c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="11" r="2.5" />
      <path d="M14.5 20c.3-1.8 1.9-3.2 3.8-3.2 1.3 0 2.4.6 3.1 1.6" />
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

function ExerciseIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M10 8.5v7l5.5-3.5L10 8.5Z" />
    </svg>
  );
}

function BookIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.6 4.5 6.1 4.5c2 0 3.4 1.1 4.2 2.4.3.5 1.1.5 1.4 0 .8-1.3 2.2-2.4 4.2-2.4 3.5 0 5.2 3.7 3.7 7.2C19.5 16.4 12 21 12 21Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
    </svg>
  );
}

function StoryIcon({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
      <path d="M12 6.5V19.5" />
    </svg>
  );
}
