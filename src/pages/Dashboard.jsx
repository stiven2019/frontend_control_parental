import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProgressRing from '../components/ProgressRing';
import { LoadingState, ErrorState } from '../components/States';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasModuleAccess } from '../components/SubscriptionGuard';
import SubscriptionModal from '../components/SubscriptionModal';

const QUICK_ACTIONS = [
  { to: '/carnet-bebe', label: 'Carnet Infantil (Nacido)', icon: '👶', bg: 'bg-secondary-container', moduleKey: 'carnet_bebe' },
  { to: '/bienestar-emocional', label: 'Test Emocional', icon: '🧠', bg: 'bg-primary-container', moduleKey: 'test_emocional' },
  { to: '/controles', label: 'Control prenatal', icon: '🩺', bg: 'bg-secondary-container', moduleKey: 'control_medico' },
  { to: '/medicamentos', label: 'Medicamentos (Gratis)', icon: '💊', bg: 'bg-primary-container' },
  { to: '/recordatorios', label: 'Recordatorios', icon: '⏰', bg: 'bg-tertiary-container', moduleKey: 'recordatorios' },
  { to: '/documentos', label: 'Documentos', icon: '📁', bg: 'bg-surface-highest', moduleKey: 'documentos' },
  { to: '/diario', label: 'Diario', icon: '📖', bg: 'bg-primary-container', moduleKey: 'diario' },
  { to: '/sintomas', label: 'Síntomas (Gratis)', icon: '📋', bg: 'bg-secondary-container' },
  { to: '/guia-desarrollo', label: 'Guía desarrollo (Gratis)', icon: '🌱', bg: 'bg-tertiary-container' },
];

export default function Dashboard() {
  const { user } = useAuth();
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

  return (
    <AppLayout>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">
            Hola, {user?.firstName} <span>👶</span>
          </h1>
          <p className="font-body text-on-surface-variant mt-1">Tu bebé está creciendo cada día.</p>
        </div>

        {isFreePlan && (
          <button
            type="button"
            onClick={() => {
              setSelectedLockedModule(null);
              setSubModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-body text-xs font-semibold shadow-cloud hover:opacity-95 transition-opacity self-start sm:self-auto"
          >
            <span>💎</span>
            <span>Planes Mensuales</span>
          </button>
        )}
      </header>

      {/* Tarjeta principal del embarazo */}
      <section className="card flex flex-col items-center text-center mb-6">
        <ProgressRing percent={status.progressPercent} size={180}>
          <div className="flex flex-col items-center">
            <span className="font-body text-xs font-semibold tracking-wide uppercase text-on-surface-variant">Semana</span>
            <span className="font-display text-4xl font-semibold text-primary">{status.week}</span>
            <span className="font-body text-xs text-on-surface-variant bg-surface-container rounded-full px-2 py-0.5 mt-1">
              + {status.dayOfWeek} días
            </span>
          </div>
        </ProgressRing>

        <h2 className="font-display text-xl font-semibold mt-4">{status.trimesterLabel}</h2>

        <div className="flex gap-4 mt-5 w-full">
          <div className="flex-1 bg-primary-container/60 rounded-md py-4 flex flex-col items-center">
            <span className="text-xl">⏳</span>
            <span className="font-body text-xs text-on-primary-container mt-1">Faltan</span>
            <span className="font-body text-sm font-semibold text-on-primary-container">{status.daysRemaining} días</span>
          </div>
          <div className="flex-1 bg-secondary-container/60 rounded-md py-4 flex flex-col items-center">
            <span className="text-xl">📅</span>
            <span className="font-body text-xs text-on-secondary-container mt-1">FPP</span>
            <span className="font-body text-sm font-semibold text-on-secondary-container">{fpp}</span>
          </div>
        </div>
      </section>

      {/* Desarrollo semanal */}
      <section className="card mb-6 bg-tertiary-container/30">
        <span className="font-body text-xs font-semibold tracking-wide uppercase text-on-tertiary-container">
          Desarrollo semanal
        </span>
        <p className="font-body text-base mt-2 mb-4">
          Esta semana tu bebé tiene aproximadamente el tamaño de{' '}
          <strong>{weeklyDevelopment.size}</strong>.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/70 rounded-md py-3 text-center">
            <p className="text-xs text-on-surface-variant">Longitud aprox.</p>
            <p className="font-semibold">{weeklyDevelopment.lengthCm} cm</p>
          </div>
          <div className="bg-white/70 rounded-md py-3 text-center">
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
          {isModuleLocked('embarazo_timeline') && <span title="Requiere suscripción">🔒</span>}
        </Link>
      </section>

      {/* Bienestar Emocional Materno */}
      <section className="card mb-6 bg-primary-container/25 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3 text-center sm:text-left">
          <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shrink-0 shadow-cloud-sm">
            🧠
          </span>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="font-display text-base font-bold text-on-surface">
                ¿Cómo te sientes hoy, mamá?
              </h3>
              {isTestEmocionalLocked && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                  🔒 Suscripción
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
            <span>🔒</span>
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

      {/* Próximos eventos */}
      {(nextControl || upcomingReminders?.length > 0) && (
        <section className="mb-6">
          <h3 className="font-display text-lg font-semibold mb-3">Próximamente</h3>
          <div className="flex flex-col gap-3">
            {nextControl?.nextAppointment && (
              <EventRow icon="🩺" title="Próximo control médico" subtitle={nextControl.doctorName} date={nextControl.nextAppointment} />
            )}
            {upcomingReminders?.map((r) => (
              <EventRow key={r.id} icon="⏰" title={r.title} subtitle={r.notes} date={r.date} />
            ))}
          </div>
        </section>
      )}

      {/* Acciones rápidas */}
      <section>
        <h3 className="font-display text-lg font-semibold mb-3">Acciones rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => {
            const locked = isModuleLocked(a.moduleKey);
            return (
              <Link
                key={a.to}
                to={a.to}
                onClick={(e) => handleActionClick(e, a)}
                className="relative card flex flex-col items-center gap-2 !p-5 hover:shadow-cloud transition-all group hover:scale-[1.02]"
              >
                {locked && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                    🔒
                  </span>
                )}
                <div className={`w-11 h-11 rounded-full ${a.bg} flex items-center justify-center text-xl`}>
                  {a.icon}
                </div>
                <span className="font-body text-sm font-medium text-center">
                  {a.label}
                </span>
                {locked && (
                  <span className="text-[10px] text-primary font-semibold">
                    Plan requerido
                  </span>
                )}
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

function EventRow({ icon, title, subtitle, date }) {
  const formatted = new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  return (
    <div className="card !p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold truncate">{title}</p>
        {subtitle && <p className="font-body text-xs text-on-surface-variant truncate">{subtitle}</p>}
      </div>
      <span className="font-body text-xs font-semibold text-primary shrink-0">{formatted}</span>
    </div>
  );
}
