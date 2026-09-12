import { api } from '../api/client';

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('No se pudo registrar el Service Worker:', err);
    return null;
  }
}

export async function getExistingPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    console.warn('Notificaciones Push no soportadas en este navegador o entorno.');
    return null;
  }

  try {
    // 1. Solicitar permiso de notificaciones
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // 2. Registrar o esperar al Service Worker
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    // 3. Obtener llave pública VAPID
    let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      const res = await api.getVapidPublicKey();
      publicKey = res.publicKey;
    }

    if (!publicKey) {
      console.warn('No se encontró la llave pública VAPID.');
      return null;
    }

    // 4. Verificar suscripción existente
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Enviar la suscripción al backend
    const subJson = subscription.toJSON();
    if (subJson.endpoint && subJson.keys) {
      await api.subscribePush({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });
      console.log('✅ Suscripción Web Push registrada en el servidor.');
    }

    return subscription;
  } catch (err) {
    console.error('Error suscribiendo a notificaciones Web Push:', err);
    return null;
  }
}

export async function triggerServerPushTest(delaySeconds = 3) {
  try {
    return await api.testPush({ delay: delaySeconds });
  } catch (err) {
    console.error('Error al solicitar prueba de notificación push al servidor:', err);
    throw err;
  }
}
