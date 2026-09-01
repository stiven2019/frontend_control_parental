import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAlarm } from '../context/AlarmContext';

export default function NotificationBell() {
  const {
    prefs,
    updatePrefs,
    tones,
    upcomingEvents,
    testSound,
    testAlarm,
    hasNotificationPermission,
    requestNotificationPermission,
  } = useAlarm();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'sound'
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const badgeCount = upcomingEvents.length;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón de la campana */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Alarmas y notificaciones"
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-primary text-on-primary shadow-cloud'
            : 'bg-surface-container hover:bg-surface-high text-on-surface-variant'
        }`}
      >
        <span className="text-lg">🔔</span>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-on-primary text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {badgeCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-outline-variant/50 p-4 z-50 text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h3 className="font-display font-semibold text-base text-on-surface">Alarmas y Avisos</h3>
            </div>
            <button
              onClick={testAlarm}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container hover:opacity-80 transition-opacity flex items-center gap-1"
              title="Probar sonido y modal de alarma"
            >
              <span>🔊</span> Probar
            </button>
          </div>

          {/* Selector de pestañas */}
          <div className="flex rounded-xl bg-surface-container p-1 mb-3">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'events' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Hoy ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('sound')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'sound' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Ajustes de Sonido
            </button>
          </div>

          {/* Pestaña: Eventos de Hoy */}
          {activeTab === 'events' && (
            <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant">
                  <span className="text-3xl block mb-2">✨</span>
                  <p className="text-xs font-medium">No tienes alarmas ni recordatorios pendientes para hoy.</p>
                </div>
              ) : (
                upcomingEvents.map((item) => (
                  <div
                    key={`${item.type}_${item.id}_${item.time}`}
                    className="p-3 rounded-xl bg-surface-low border border-surface-container flex items-start gap-3 hover:bg-surface-container transition-colors"
                  >
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-body text-xs font-semibold text-on-surface truncate">{item.title}</p>
                        {item.time && (
                          <span className="font-body text-[11px] font-bold text-primary shrink-0 ml-2">
                            {item.time}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="font-body text-[11px] text-on-surface-variant truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                      <span className="inline-block font-body text-[10px] text-outline mt-1">
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2 mt-2 border-t border-surface-container flex justify-between items-center text-xs">
                <Link
                  to="/recordatorios"
                  onClick={() => setIsOpen(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Ver recordatorios
                </Link>
                <Link
                  to="/calendario"
                  onClick={() => setIsOpen(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Ir al calendario →
                </Link>
              </div>
            </div>
          )}

          {/* Pestaña: Ajustes de Sonido */}
          {activeTab === 'sound' && (
            <div className="flex flex-col gap-3 py-1 text-xs">
              {/* Interruptor Sonido */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container cursor-pointer">
                <div>
                  <span className="font-semibold text-on-surface block">Alarma Sonora</span>
                  <span className="text-[11px] text-on-surface-variant">Reproducir tono al cumplirse</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={(e) => updatePrefs({ soundEnabled: e.target.checked })}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              {/* Selector de Tono */}
              <div>
                <label className="font-semibold text-on-surface block mb-1.5">Tono de Alarma</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {tones.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        updatePrefs({ selectedTone: t.id });
                        testSound(t.id);
                      }}
                      className={`p-2 rounded-lg text-left transition-all border text-xs ${
                        prefs.selectedTone === t.id
                          ? 'border-primary bg-primary-container/40 font-semibold text-on-surface'
                          : 'border-surface-container bg-surface-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{t.name}</span>
                        {prefs.selectedTone === t.id && <span className="text-primary text-[10px]">🔊</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Control de Volumen */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-on-surface">Volumen</span>
                  <span className="text-outline font-semibold">{Math.round(prefs.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={prefs.volume}
                  onChange={(e) => updatePrefs({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Anticipación */}
              <div>
                <label className="font-semibold text-on-surface block mb-1">Avisar con anticipación</label>
                <select
                  value={prefs.advanceNoticeMinutes}
                  onChange={(e) => updatePrefs({ advanceNoticeMinutes: parseInt(e.target.value, 10) })}
                  className="w-full bg-surface-container rounded-lg p-2 text-on-surface outline-none border border-outline-variant/40"
                >
                  <option value={0}>Solo al momento exacto</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes (Recomendado)</option>
                  <option value={30}>30 minutos antes</option>
                </select>
              </div>

              {/* Notificaciones de Sistema */}
              <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-on-surface block">Notificaciones del Navegador</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {hasNotificationPermission ? 'Permiso concedido ✓' : 'Permiso no otorgado'}
                  </span>
                </div>
                {!hasNotificationPermission ? (
                  <button
                    onClick={requestNotificationPermission}
                    className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-semibold hover:opacity-90"
                  >
                    Activar
                  </button>
                ) : (
                  <span className="text-secondary font-bold text-sm">✓</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
