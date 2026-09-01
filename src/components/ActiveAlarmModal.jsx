import { useEffect } from 'react';
import { useAlarm } from '../context/AlarmContext';

export default function ActiveAlarmModal() {
  const { activeAlarm, dismissAlarm, snoozeAlarm, completeAlarmAction, prefs } = useAlarm();

  // Asegurar que la tecla Escape o Espacio también pueda silenciar si el usuario lo desea
  useEffect(() => {
    if (!activeAlarm) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dismissAlarm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlarm, dismissAlarm]);

  if (!activeAlarm) return null;

  const isDue = activeAlarm.isDueNow || !activeAlarm.isUpcoming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-primary/20 text-center relative overflow-hidden">
        {/* Barra decorativa superior pulsante */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary-container to-secondary animate-pulse" />

        {/* Efecto visual de ondas de sonido y campana */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping opacity-75" />
          <div className="absolute w-20 h-20 rounded-full bg-primary-container animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-3xl shadow-lg transform transition-transform hover:scale-105">
            {activeAlarm.icon || '🔔'}
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-primary-container text-on-primary-container mb-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          {isDue ? '¡Alarma Cumplida!' : `Aviso: En ${activeAlarm.minutesLeft || 15} minutos`}
        </div>

        {/* Información del evento */}
        <h2 className="font-display text-2xl font-bold text-on-surface mb-1">
          {activeAlarm.title}
        </h2>

        {activeAlarm.subtitle && (
          <p className="font-body text-base text-on-surface-variant font-medium mb-3">
            {activeAlarm.subtitle}
          </p>
        )}

        <div className="bg-surface-container rounded-xl p-3 mb-6 inline-flex items-center gap-4 text-sm font-semibold text-on-surface-variant">
          <span>📅 {activeAlarm.date}</span>
          {activeAlarm.time && <span>⏰ {activeAlarm.time}</span>}
          {prefs.soundEnabled && <span className="text-primary">🔊 Sonando</span>}
        </div>

        {/* Acciones interactivas */}
        <div className="flex flex-col gap-2.5">
          {(activeAlarm.type === 'recordatorio' || activeAlarm.type === 'medicamento') && (
            <button
              onClick={() => completeAlarmAction(activeAlarm)}
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-body font-semibold text-base shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span>✓</span>
              {activeAlarm.type === 'medicamento' ? 'Marcar como tomado' : 'Marcar como completado'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => snoozeAlarm(5)}
              className="py-3 px-4 rounded-xl bg-secondary-container text-on-secondary-container font-body font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              <span>⏱️</span> Posponer 5 min
            </button>
            <button
              onClick={dismissAlarm}
              className="py-3 px-4 rounded-xl bg-surface-container text-on-surface-variant font-body font-semibold text-sm hover:bg-surface-high transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔇</span> Silenciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
