import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api, getToken } from '../api/client';
import { useAuth } from '../context/AuthContext';

const BEAT_MS = 30 * 1000;
const IDLE_LIMIT_MS = 60 * 1000;

// Ruta -> modulo registrado (debe coincidir con los modulos permitidos por la API)
const MODULE_BY_PREFIX = [
  ['/inicio', 'inicio'],
  ['/configuracion-inicial', 'embarazo'],
  ['/mi-embarazo', 'embarazo'],
  ['/mi-bebe', 'gestacion'],
  ['/carnet-bebe', 'carnet_bebe'],
  ['/bebe-nacido', 'carnet_bebe'],
  ['/controles', 'control_medico'],
  ['/control-gestacional-bebe', 'control_medico'],
  ['/medicamentos', 'medicamentos'],
  ['/recordatorios', 'recordatorios'],
  ['/documentos', 'documentos'],
  ['/album', 'album'],
  ['/diario', 'diario'],
  ['/sintomas', 'sintomas'],
  ['/calendario', 'calendario'],
  ['/papa', 'familia'],
  ['/ejercicios', 'ejercicios'],
  ['/recuerdo', 'recuerdo'],
  ['/cuentos', 'cuentos'],
  ['/bienestar-emocional', 'bienestar_emocional'],
  ['/test-emocional', 'bienestar_emocional'],
  ['/cuenta-regresiva', 'cuenta_regresiva'],
  ['/guia-desarrollo', 'guia_desarrollo'],
  ['/cuidados-mama', 'cuidados'],
  ['/cuidados-bebe', 'cuidados'],
  ['/perfil', 'perfil'],
];

function moduleForPath(pathname) {
  const hit = MODULE_BY_PREFIX.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit ? hit[1] : 'otro';
}

function newSessionKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getSessionKey() {
  try {
    let key = sessionStorage.getItem('mibebe_usage_key');
    if (!key) {
      key = newSessionKey();
      sessionStorage.setItem('mibebe_usage_key', key);
    }
    return key;
  } catch {
    return newSessionKey();
  }
}

/**
 * Mide el tiempo real de uso: solo cuenta cuando la pestana esta visible y hubo
 * interaccion reciente. No envia contenido, solo la clave de sesion y el modulo.
 */
export default function useUsageHeartbeat() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  const lastInteraction = useRef(Date.now());
  const keyRef = useRef(null);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const userId = user?.id;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!userId || isAdmin) return undefined;
    if (!keyRef.current) keyRef.current = getSessionKey();

    const touch = () => { lastInteraction.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));

    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastInteraction.current > IDLE_LIMIT_MS) return;
      if (!getToken()) return;
      api.sendHeartbeat({ sessionKey: keyRef.current, module: moduleForPath(pathRef.current) }).catch(() => {});
    };

    beat();
    const timer = setInterval(beat, BEAT_MS);
    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, touch));
    };
  }, [userId, isAdmin]);
}
