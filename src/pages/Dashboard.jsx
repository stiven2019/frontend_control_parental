import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProgressRing from '../components/ProgressRing';
import ModuleIcon from '../components/ModuleIcons';
import { LoadingState, ErrorState } from '../components/States';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasModuleAccess } from '../components/SubscriptionGuard';
import SubscriptionModal from '../components/SubscriptionModal';

// Cada accion usa un icono de linea y un par de colores pastel (tile + texto)
const T = {
  pink: 'bg-primary-container text-on-primary-container',
  mint: 'bg-secondary-container text-on-secondary-container',
  blue: 'bg-tertiary-container text-on-tertiary-container',
  peach: 'bg-peach-container text-on-peach-container',
  lilac: 'bg-lilac-container text-on-lilac-container',
};

const OWNER_QUICK_ACTIONS = [
  { to: '/ejercicios', label: 'Ejercicios del parto', icon: 'play', bg: T.blue, moduleKey: 'ejercicios' },
  { to: '/cuentos', label: 'Cuentos para soñar', icon: 'storybook', bg: T.lilac, moduleKey: 'cuentos' },
  { to: '/recuerdo', label: 'Libro de recuerdos', icon: 'heart', bg: T.pink, moduleKey: 'recuerdo' },
  { to: '/papa', label: 'Papá y Familia', icon: 'family', bg: T.lilac, moduleKey: 'papa' },
  { to: '/album', label: 'Álbum de Fotos', icon: 'camera', bg: T.mint, moduleKey: 'album' },
  { to: '/controles-bebe', label: 'Control del Bebé', icon: 'baby', bg: T.peach, moduleKey: 'control_medico' },
  { to: '/controles', label: 'Control prenatal (Mamá)', icon: 'steth', bg: T.blue, moduleKey: 'control_medico' },
  { to: '/carnet-bebe', label: 'Carnet Bebé Nacido', icon: 'carnet', bg: T.mint, moduleKey: 'carnet_bebe' },
  { to: '/bienestar-emocional', label: 'Test Emocional', icon: 'mind', bg: T.pink, moduleKey: 'test_emocional' },
  { to: '/medicamentos', label: 'Medicamentos (Gratis)', icon: 'pill', bg: T.lilac },
  { to: '/recordatorios', label: 'Recordatorios', icon: 'bell', bg: T.peach, moduleKey: 'recordatorios' },
  { to: '/documentos', label: 'Documentos', icon: 'folder', bg: T.blue, moduleKey: 'documentos' },
  { to: '/diario', label: 'Diario', icon: 'book', bg: T.pink, moduleKey: 'diario' },
  { to: '/sintomas', label: 'Síntomas (Gratis)', icon: 'pulse', bg: T.mint },
  { to: '/guia-desarrollo', label: 'Guía desarrollo (Gratis)', icon: 'sprout', bg: T.peach },
];

const FAMILIA_QUICK_ACTIONS = [
  { to: '/album', label: 'Álbum (Fotos)', icon: 'camera', bg: T.mint },
  { to: '/guia-desarrollo', label: 'Desarrollo Fetal', icon: 'sprout', bg: T.peach },
  { to: '/cuenta-regresiva', label: 'Cuenta Regresiva', icon: 'hourglass', bg: T.pink },
];

const PAPA_QUICK_ACTIONS = [
  { to: '/ejercicios', label: 'Ejercicios para papá', icon: 'play', bg: T.blue, moduleKey: 'ejercicios' },
  { to: '/cuentos', label: 'Cuentos para soñar', icon: 'storybook', bg: T.lilac, moduleKey: 'cuentos' },
  { to: '/album', label: 'Álbum (Fotos)', icon: 'camera', bg: T.mint },
  { to: '/diario', label: 'Diario de Recuerdos', icon: 'book', bg: T.pink },
  { to: '/guia-desarrollo', label: 'Desarrollo Fetal', icon: 'sprout', bg: T.peach },
  { to: '/cuenta-regresiva', label: 'Cuenta Regresiva', icon: 'hourglass', bg: T.lilac },
  { to: '/papa', label: 'Perfil de Papá', icon: 'user', bg: T.pink },
];

export default function Dashboard() {
  const { user, isFamilyLink, isFamilyMember, isPartnerLink } = useAuth();
  const quickActions = isFamilyMember 
    ? FAMILIA_QUICK_ACTIONS 
    : isPartnerLink 
    ? PAPA_QUICK_ACTIONS 
    : OWNER_QUICK_ACTIONS;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedLockedModule, setSelectedLockedModule] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      if (err.needsSetup) {
        navigate('/configuracion-inicial');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActionClick = (e, action) => {
    if (action.moduleKey && !hasModuleAccess(user, action.moduleKey)) {
      e.preventDefault();
      setSelectedLockedModule(action.moduleKey);
      setSubModalOpen(true);
    }
  };

  const isModuleLocked = (moduleKey) => {
    if (!moduleKey) return false;
    return !hasModuleAccess(user, moduleKey);
  };

  if (loading) return <AppLayout><LoadingState label="Cargando tu embarazo..." /></AppLayout>;
  if (error) return <AppLayout><ErrorState message={error} onRetry={load} /></AppLayout>;
  if (!data) return null;

  const { status, weeklyDevelopment, upcomingReminders, nextControl } = data;
  const fpp = new Date(data.pregnancy.probableDeliveryDate).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const isTestEmocionalLocked = isModuleLocked('test_emocional');
  const isFreePlan = (user?.plan === 'free' || !user?.plan) && !user?.isVip;
  const isExpiringSoon = !user?.isVip && user?.subscriptionExpiresAt && (() => {
    const diff = Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 7;
  })();
  const isSubExpired = !user?.isVip && user?.subscriptionExpiresAt && (new Date(user.subscriptionExpiresAt).getTime() < Date.now());
  const daysLeft = user?.subscriptionExpiresAt ? Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <AppLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Hola, {user?.firstName}</h1>
          <p className="font-body text-on-surface-variant mt-1">
            {isFamilyMember
              ? 'Acompañando a la familia en este hermoso camino (Solo Lectura).'
              : isPartnerLink
              ? 'Acompañando a mamá y al bebé en cada etapa.'
              : 'Tu bebé está creciendo cada día.'}
          </p>
        </div>

        {!isFamilyLink && (
          <button
            type="button"
            onClick={() => {
              setSelectedLockedModule(null);
              setSubModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-lilac-container text-on-lilac-container font-body text-xs font-bold shadow-cloud-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
          >
            <ModuleIcon name="gem" className="w-4 h-4" />
            <span>{isFreePlan ? 'Planes Mensuales' : 'Gestionar Plan'}</span>
          </button>
        )}
      </header>

      {/* Alerta Preventiva: Vencimiento en 1 semana (7 días) */}
      {isExpiringSoon && !isFamilyLink && (
        <div className="mb-6 p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-body flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-cloud-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><ModuleIcon name="alert" className="w-5 h-5" /></span>
            <div>
              <strong className="font-display text-sm font-bold text-amber-950 block">
                Tu suscripción a Mi Bebé vence en {daysLeft} días
              </strong>
              <p className="text-[11.5px] text-amber-800 mt-0.5">
                Te enviamos un aviso preventivo a tu correo ({user?.email}). Renueva para mantener tu acceso continuo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedLockedModule(null);
              setSubModalOpen(true);
            }}
            className="btn-primary !py-2 !px-4 text-xs font-semibold shrink-0"
          >
            Renovar ahora
          </button>
        </div>
      )}

      {/* Alerta de Suscripción Vencida */}
      {isSubExpired && !isFamilyLink && (
        <div className="mb-6 p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-body flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-cloud-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0"><ModuleIcon name="hourglass" className="w-5 h-5" /></span>
            <div>
              <strong className="font-display text-sm font-bold text-rose-950 block">
                Tu suscripción mensual a Mi Bebé ha vencido
              </strong>
              <p className="text-[11.5px] text-rose-800 mt-0.5">
                Tus ecografías y datos médicos continúan guardados de forma segura. Renueva tu plan para reactivar todos tus módulos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedLockedModule(null);
              setSubModalOpen(true);
            }}
            className="btn-primary !py-2 !px-4 text-xs font-semibold shrink-0"
          >
            Reactivar plan
          </button>
        </div>
      )}

      {/* Tarjeta principal del embarazo */}
      <section className="hero-card flex flex-col items-center text-center mb-6">
        <ProgressRing percent={status.progressPercent} size={150} stroke={12} track="rgba(255,255,255,0.75)">
          <div className="flex flex-col items-center">
            <span className="font-body text-[11px] font-bold tracking-wide uppercase">Semana</span>
            <span className="font-display text-4xl font-semibold leading-none text-primary">{status.week}</span>
            <span className="font-body text-xs bg-white/70 rounded-full px-2 py-0.5 mt-1.5">
              + {status.dayOfWeek} días
            </span>
          </div>
        </ProgressRing>

        <h2 className="font-display text-xl font-semibold mt-4">{status.trimesterLabel}</h2>

        <div className="flex gap-3 mt-5 w-full">
          <div className="flex-1 bg-white/75 rounded-3xl py-3.5 flex flex-col items-center">
            <ModuleIcon name="hourglass" className="w-5 h-5 text-primary" />
            <span className="font-body text-xs mt-1">Faltan</span>
            <span className="font-body text-sm font-bold">{status.daysRemaining} días</span>
          </div>
          <div className="flex-1 bg-white/75 rounded-3xl py-3.5 flex flex-col items-center">
            <ModuleIcon name="calendar" className="w-5 h-5 text-primary" />
            <span className="font-body text-xs mt-1">FPP</span>
            <span className="font-body text-sm font-bold">{fpp}</span>
          </div>
        </div>
      </section>

      {/* Desarrollo semanal */}
      <section className="card mb-6 !bg-peach-container/60">
        <span className="font-body text-xs font-bold tracking-wide uppercase text-on-peach-container">
          Desarrollo semanal
        </span>
        <p className="font-body text-base mt-2 mb-4">
          Esta semana tu bebé tiene aproximadamente el tamaño de{' '}
          <strong>{weeklyDevelopment.size}</strong>.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/80 rounded-3xl py-3 text-center">
            <p className="text-xs text-on-surface-variant">Longitud aprox.</p>
            <p className="font-semibold">{weeklyDevelopment.lengthCm} cm</p>
          </div>
          <div className="bg-white/80 rounded-3xl py-3 text-center">
            <p className="text-xs text-on-surface-variant">Peso aprox.</p>
            <p className="font-semibold">{weeklyDevelopment.weightG} g</p>
          </div>
        </div>
        <p className="font-body text-sm text-on-surface-variant mb-4">{weeklyDevelopment.note}</p>
        <Link
          to="/mi-embarazo"
          onClick={(e) => handleActionClick(e, { moduleKey: 'embarazo_timeline' })}
          className="btn-secondary block text-center flex items-center justify-center gap-2"
        >
          <span>Ver desarrollo completo</span>
          {isModuleLocked('embarazo_timeline') && <span title="Requiere suscripción"><ModuleIcon name="lock" className="w-4 h-4" /></span>}
        </Link>
      </section>

      {/* Bienestar Emocional Materno (Solo visible para Mamá) */}
      {!isFamilyLink && (
        <section className="card mb-6 !bg-lilac-container/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <span className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-cloud-sm">
              <ModuleIcon name="mind" className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-display text-base font-bold text-on-surface">
                  ¿Cómo te sientes hoy, mamá?
                </h3>
                {isTestEmocionalLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    <ModuleIcon name="lock" className="w-3 h-3" /> Suscripción
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Evalúa tu estado emocional en 2 minutos y accede a tips asertivos para soltar culpas y cultivar calma.
              </p>
            </div>
          </div>
          {isTestEmocionalLocked ? (
            <button
              type="button"
              onClick={() => {
                setSelectedLockedModule('test_emocional');
                setSubModalOpen(true);
              }}
              className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 text-xs font-semibold shrink-0 shadow-cloud-sm flex items-center justify-center gap-1.5"
            >
              <ModuleIcon name="lock" className="w-4 h-4" />
              <span>Desbloquear Test</span>
            </button>
          ) : (
            <Link
              to="/bienestar-emocional"
              className="btn-primary !w-full sm:!w-auto !py-2.5 !px-5 text-xs font-semibold shrink-0 shadow-cloud-sm"
            >
              Hacer Test Emocional
            </Link>
          )}
        </section>
      )}

      {/* Próximos eventos */}
      {(nextControl || upcomingReminders?.length > 0) && (
        <section className="mb-6">
          <h3 className="section-title mb-3">Próximamente</h3>
          <div className="flex flex-col gap-3">
            {nextControl?.nextAppointment && (
              <EventRow icon="steth" tint={T.blue} title="Próximo control médico" subtitle={nextControl.doctorName} date={nextControl.nextAppointment} />
            )}
            {upcomingReminders?.map((r) => (
              <EventRow key={r.id} icon="bell" tint={T.peach} title={r.title} subtitle={r.notes} date={r.date} />
            ))}
          </div>
        </section>
      )}

      {/* Acciones rápidas */}
      <section>
        <h3 className="section-title mb-3">Acciones rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((a) => {
            const isSubLocked = isModuleLocked(a.moduleKey);
            const isGestationLocked = a.to === '/carnet-bebe' && (!Boolean(data?.baby?.isBorn || (data?.status?.week && Number(data.status.week) >= 40)) || Boolean(data?.baby?.carnetLockedByAdmin));
            const locked = isSubLocked || isGestationLocked;

            return (
              <Link
                key={a.to}
                to={a.to}
                onClick={(e) => {
                  if (isSubLocked) {
                    handleActionClick(e, a);
                  }
                  // Si solo es bloqueo gestacional, permite navegar para ver la pantalla de estado y activación
                }}
                className="relative card flex flex-col items-center gap-2 !p-5 hover:shadow-cloud transition-all group hover:scale-[1.02]"
              >
                {locked && (
                  <span
                    className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center ${
                      isGestationLocked ? 'bg-amber-500/15 text-amber-700' : 'bg-primary/10 text-primary'
                    }`}
                    title={isGestationLocked ? 'Se habilita en semana 40 o nacimiento' : 'Plan requerido'}
                  >
                    <ModuleIcon name="lock" className="w-3 h-3" />
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl ${a.bg} flex items-center justify-center`}>
                  <ModuleIcon name={a.icon} className="w-6 h-6" />
                </div>
                <span className="font-body text-sm font-bold text-center leading-snug">
                  {a.label}
                </span>
                {isGestationLocked ? (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    Sem. 40 o nacido
                  </span>
                ) : locked ? (
                  <span className="text-[10px] text-primary font-semibold">
                    Plan requerido
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Modal de planes de suscripción */}
      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        requestedModule={selectedLockedModule}
      />
    </AppLayout>
  );
}

function EventRow({ icon, tint, title, subtitle, date }) {
  const formatted = new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return (
    <div className="card !p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl ${tint} flex items-center justify-center shrink-0`}>
        <ModuleIcon name={icon} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-bold truncate">{title}</p>
        {subtitle && <p className="font-body text-xs text-on-surface-variant truncate">{subtitle}</p>}
      </div>
      <span className="font-body text-xs font-bold text-primary shrink-0">{formatted}</span>
    </div>
  );
}
