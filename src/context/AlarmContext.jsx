import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import {
  TONES,
  startAlarmLoop,
  stopAlarmLoop,
  testAlarmSound,
  playMelody,
  unlockAudio,
} from '../utils/soundAlarm';

const STORAGE_PREFS_KEY = 'mibebe_alarm_prefs';
const STORAGE_ACK_KEY = 'mibebe_alarm_acknowledged';

const DEFAULT_PREFS = {
  soundEnabled: true,
  selectedTone: 'chime_suave',
  volume: 0.8,
  advanceNoticeMinutes: 15, // 0 = solo al momento, 5, 15, 30
};

const AlarmContext = createContext(null);

export function AlarmProvider({ children }) {
  const { user } = useAuth();

  // Preferencias guardadas
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  // Estado de la alarma actualmente sonando
  const [activeAlarm, setActiveAlarm] = useState(null);

  // Lista consolidada de eventos próximos para el panel
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Permiso de notificaciones del sistema
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Registro de alarmas reconocidas/pospuestas en memoria y localStorage
  const acknowledgedRef = useRef(new Map());
  const checkTimerRef = useRef(null);

  // Guardar cambios de preferencias
  const updatePrefs = useCallback((newPrefs) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving alarm prefs', e);
      }
      return updated;
    });
  }, []);

  // Cargar registro de reconocidos desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const map = new Map();
        const now = Date.now();
        // Limpiar elementos de más de 24 horas
        Object.entries(parsed).forEach(([k, timestamp]) => {
          if (now - timestamp < 24 * 60 * 60 * 1000) {
            map.set(k, timestamp);
          }
        });
        acknowledgedRef.current = map;
      }
    } catch {
      acknowledgedRef.current = new Map();
    }
  }, []);

  const saveAcknowledged = (key, timestamp = Date.now()) => {
    acknowledgedRef.current.set(key, timestamp);
    try {
      const obj = Object.fromEntries(acknowledgedRef.current);
      localStorage.setItem(STORAGE_ACK_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error(e);
    }
  };

  // Solicitar permiso de notificaciones del navegador
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      setHasNotificationPermission(granted);
      return granted;
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  };

  // Enviar notificación del sistema (escritorio / móvil)
  const sendSystemNotification = useCallback((title, options = {}) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.error('Error sending system notification', e);
      }
    }
  }, []);

  // Disparar alarma sonora y modal
  const triggerAlarm = useCallback((alarmData) => {
    setActiveAlarm(alarmData);

    // Reproducir bucle sonoro si está habilitado
    if (prefs.soundEnabled) {
      startAlarmLoop(prefs.selectedTone, prefs.volume);
    }

    // Notificación del sistema
    const tag = `alarm_${alarmData.id}_${alarmData.type}`;
    sendSystemNotification(alarmData.title, {
      body: alarmData.subtitle || `Alarma programada a las ${alarmData.time || 'hoy'}`,
      tag,
      requireInteraction: true,
    });
  }, [prefs.soundEnabled, prefs.selectedTone, prefs.volume, sendSystemNotification]);

  // Silenciar y descartar alarma activa
  const dismissAlarm = useCallback(() => {
    stopAlarmLoop();
    if (activeAlarm) {
      const ackKey = `ack_${activeAlarm.type}_${activeAlarm.id}_${activeAlarm.date}_${activeAlarm.time || 'allday'}`;
      saveAcknowledged(ackKey, Date.now());
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  // Posponer alarma por X minutos (por defecto 5 minutos)
  const snoozeAlarm = useCallback((minutes = 5) => {
    stopAlarmLoop();
    if (activeAlarm) {
      const snoozeKey = `snooze_${activeAlarm.type}_${activeAlarm.id}`;
      const wakeTime = Date.now() + minutes * 60 * 1000;
      saveAcknowledged(snoozeKey, wakeTime);
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  // Completar acción asociada (ej. marcar medicamento como tomado o recordatorio completado)
  const completeAlarmAction = useCallback(async (alarm) => {
    stopAlarmLoop();
    const target = alarm || activeAlarm;
    if (!target) return;

    try {
      if (target.type === 'recordatorio') {
        await api.completeReminder(target.id);
      } else if (target.type === 'medicamento') {
        await api.markMedicationTaken(target.id);
      }
    } catch (err) {
      console.error('Error completing alarm item', err);
    }

    const ackKey = `ack_${target.type}_${target.id}_${target.date}_${target.time || 'allday'}`;
    saveAcknowledged(ackKey, Date.now());
    setActiveAlarm(null);
  }, [activeAlarm]);

  // Función para probar la alarma de inmediato (para testing del usuario)
  const testAlarm = useCallback(() => {
    unlockAudio();
    const mockAlarm = {
      id: 'test_demo_' + Date.now(),
      type: 'recordatorio',
      icon: '⏰',
      title: '¡Prueba de Alarma Sonora!',
      subtitle: 'Así sonarán tus recordatorios y eventos cuando se cumplan.',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      isDueNow: true,
      categoryLabel: 'Prueba de Sistema',
    };
    triggerAlarm(mockAlarm);
  }, [triggerAlarm]);

  // Chequeo de alarmas y sincronización de eventos próximos
  const checkAlarms = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Obtener datos en paralelo
      const [remindersRes, medsRes, controlsRes] = await Promise.allSettled([
        api.listReminders(),
        api.listMedications(),
        api.listControls(),
      ]);

      const reminders = remindersRes.status === 'fulfilled' ? remindersRes.value.items || [] : [];
      const medications = medsRes.status === 'fulfilled' ? medsRes.value.items || [] : [];
      const controls = controlsRes.status === 'fulfilled' ? controlsRes.value.items || [] : [];

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMins = currentHours * 60 + currentMinutes;

      const upcoming = [];
      let alarmToTrigger = null;

      // Evaluar Recordatorios
      reminders.forEach((r) => {
        if (r.completed) return;

        const isToday = r.date === todayStr;
        let eventTotalMins = null;
        if (r.time) {
          const [h, m] = r.time.split(':').map(Number);
          eventTotalMins = h * 60 + m;
        }

        const ackKey = `ack_recordatorio_${r.id}_${r.date}_${r.time || 'allday'}`;
        const snoozeKey = `snooze_recordatorio_${r.id}`;
        const snoozedUntil = acknowledgedRef.current.get(snoozeKey);
        const isAcknowledged = acknowledgedRef.current.has(ackKey);

        const eventItem = {
          id: r.id,
          type: 'recordatorio',
          icon: '⏰',
          title: r.title,
          subtitle: r.notes || 'Recordatorio pendiente',
          date: r.date,
          time: r.time,
          categoryLabel: 'Recordatorio',
          isToday,
          rawItem: r,
        };

        if (isToday) {
          upcoming.push(eventItem);
        }

        // Revisar si está pospuesto y llegó el momento
        if (snoozedUntil && Date.now() >= snoozedUntil && !activeAlarm) {
          acknowledgedRef.current.delete(snoozeKey);
          alarmToTrigger = { ...eventItem, isDueNow: true, subtitle: `(Pospuesto) ${eventItem.subtitle}` };
          return;
        }

        if (isToday && !isAcknowledged && (!snoozedUntil || Date.now() >= snoozedUntil)) {
          if (eventTotalMins !== null) {
            const diffMins = eventTotalMins - currentTotalMins;

            // Alarma al cumplirse (entre 0 y 15 minutos pasados)
            if (diffMins <= 0 && diffMins >= -15 && !activeAlarm && !alarmToTrigger) {
              alarmToTrigger = { ...eventItem, isDueNow: true };
            }
            // Aviso anticipado si configurado (ej. 15 minutos antes)
            else if (
              prefs.advanceNoticeMinutes > 0 &&
              diffMins > 0 &&
              diffMins <= prefs.advanceNoticeMinutes
            ) {
              const advanceAckKey = `ack_advance_recordatorio_${r.id}_${r.date}_${r.time}`;
              if (!acknowledgedRef.current.has(advanceAckKey) && !activeAlarm && !alarmToTrigger) {
                saveAcknowledged(advanceAckKey);
                alarmToTrigger = {
                  ...eventItem,
                  isUpcoming: true,
                  minutesLeft: diffMins,
                  subtitle: `Próximo en ${diffMins} min · ${r.notes || ''}`,
                };
              }
            }
          }
        }
      });

      // Evaluar Medicamentos
      medications.forEach((m) => {
        if (!m.time) return;

        // Comprobar rango de fechas
        const start = m.startDate ? new Date(`${m.startDate}T00:00:00`) : null;
        const end = m.endDate ? new Date(`${m.endDate}T23:59:59`) : null;
        if (start && now < start) return;
        if (end && now > end) return;

        const [h, min] = m.time.split(':').map(Number);
        const eventTotalMins = h * 60 + min;

        const ackKey = `ack_medicamento_${m.id}_${todayStr}_${m.time}`;
        const snoozeKey = `snooze_medicamento_${m.id}`;
        const snoozedUntil = acknowledgedRef.current.get(snoozeKey);
        const isAcknowledged = acknowledgedRef.current.has(ackKey);

        const medItem = {
          id: m.id,
          type: 'medicamento',
          icon: '💊',
          title: `Tomar ${m.name}`,
          subtitle: `${m.dose || ''} ${m.frequency ? `· ${m.frequency}` : ''}`.trim(),
          date: todayStr,
          time: m.time,
          categoryLabel: 'Medicamento / Vitamina',
          isToday: true,
          rawItem: m,
        };

        upcoming.push(medItem);

        if (snoozedUntil && Date.now() >= snoozedUntil && !activeAlarm) {
          acknowledgedRef.current.delete(snoozeKey);
          alarmToTrigger = { ...medItem, isDueNow: true, subtitle: `(Pospuesto) ${medItem.subtitle}` };
          return;
        }

        if (!isAcknowledged && (!snoozedUntil || Date.now() >= snoozedUntil)) {
          const diffMins = eventTotalMins - currentTotalMins;

          if (diffMins <= 0 && diffMins >= -20 && !activeAlarm && !alarmToTrigger) {
            alarmToTrigger = { ...medItem, isDueNow: true };
          } else if (
            prefs.advanceNoticeMinutes > 0 &&
            diffMins > 0 &&
            diffMins <= prefs.advanceNoticeMinutes
          ) {
            const advanceAckKey = `ack_advance_medicamento_${m.id}_${todayStr}_${m.time}`;
            if (!acknowledgedRef.current.has(advanceAckKey) && !activeAlarm && !alarmToTrigger) {
              saveAcknowledged(advanceAckKey);
              alarmToTrigger = {
                ...medItem,
                isUpcoming: true,
                minutesLeft: diffMins,
                subtitle: `En ${diffMins} min · ${medItem.subtitle}`,
              };
            }
          }
        }
      });

      // Evaluar Controles Médicos próximos
      controls.forEach((c) => {
        const appointmentDate = c.nextAppointment || c.date;
        if (!appointmentDate) return;

        const isToday = appointmentDate === todayStr;
        const controlItem = {
          id: c.id,
          type: 'control',
          icon: '🩺',
          title: 'Control Médico Prenatal',
          subtitle: `${c.doctorName ? `Con ${c.doctorName}` : ''} ${c.place ? `en ${c.place}` : ''}`.trim(),
          date: appointmentDate,
          time: c.time || '09:00',
          categoryLabel: 'Control médico',
          isToday,
          rawItem: c,
        };

        if (isToday) {
          upcoming.push(controlItem);
        }

        if (isToday) {
          const [h, min] = (c.time || '09:00').split(':').map(Number);
          const eventTotalMins = h * 60 + min;
          const diffMins = eventTotalMins - currentTotalMins;

          const ackKey = `ack_control_${c.id}_${appointmentDate}_${c.time || 'allday'}`;
          const isAcknowledged = acknowledgedRef.current.has(ackKey);

          if (!isAcknowledged) {
            if (diffMins <= 0 && diffMins >= -30 && !activeAlarm && !alarmToTrigger) {
              alarmToTrigger = { ...controlItem, isDueNow: true };
            } else if (
              prefs.advanceNoticeMinutes > 0 &&
              diffMins > 0 &&
              diffMins <= prefs.advanceNoticeMinutes
            ) {
              const advanceAckKey = `ack_advance_control_${c.id}_${appointmentDate}`;
              if (!acknowledgedRef.current.has(advanceAckKey) && !activeAlarm && !alarmToTrigger) {
                saveAcknowledged(advanceAckKey);
                alarmToTrigger = {
                  ...controlItem,
                  isUpcoming: true,
                  minutesLeft: diffMins,
                  subtitle: `En ${diffMins} min · ${controlItem.subtitle}`,
                };
              }
            }
          }
        }
      });

      // Ordenar próximos eventos por hora
      upcoming.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
      setUpcomingEvents(upcoming);

      // Si se detectó una alarma que debe sonar y no hay ninguna sonando actualmente
      if (alarmToTrigger && !activeAlarm) {
        triggerAlarm(alarmToTrigger);
      }
    } catch (err) {
      console.error('Error running alarm check', err);
    }
  }, [user, activeAlarm, prefs.advanceNoticeMinutes, triggerAlarm]);

  // Inicializar verificación periódica cada 20 segundos
  useEffect(() => {
    if (!user) return;

    checkAlarms();

    const intervalId = setInterval(() => {
      checkAlarms();
    }, 20000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        unlockAudio();
        checkAlarms();
      }
    };

    const onUserInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('click', onUserInteraction, { once: true });
    window.addEventListener('keydown', onUserInteraction, { once: true });

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
  }, [user, checkAlarms]);

  return (
    <AlarmContext.Provider
      value={{
        prefs,
        updatePrefs,
        tones: TONES,
        activeAlarm,
        upcomingEvents,
        dismissAlarm,
        snoozeAlarm,
        completeAlarmAction,
        testAlarm,
        testSound: (toneId) => testAlarmSound(toneId || prefs.selectedTone, prefs.volume),
        hasNotificationPermission,
        requestNotificationPermission,
        refreshAlarms: checkAlarms,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm debe usarse dentro de un AlarmProvider');
  }
  return context;
}
