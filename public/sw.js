// Service Worker para "Mi Bebé" — Notificaciones Push y en Segundo Plano
// Diseñado para compatibilidad universal: Android (Chrome, Samsung, Edge), iOS (Safari PWA), macOS, Windows y Linux.

const CACHE_NAME = 'mibebe-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escucha de Notificaciones Push entrantes del servidor (incluso si la app o navegador están cerrados)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🔔 Recordatorio — Mi Bebé', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Recordatorio — Mi Bebé';
  const targetUrl = data.url || '/recordatorios';

  // Configuración de notificación compatible con todos los navegadores y plataformas móviles
  const options = {
    body: data.body || 'Tienes un recordatorio o medicamento programado.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'mibebe_alarm_' + Date.now(),
    renotify: true, // Vuelve a alertar y vibrar si coincide con una alarma previa
    requireInteraction: true, // Se mantiene visible en el sistema operativo hasta que la usuaria interactúe
    silent: false,
    vibrate: [300, 150, 300, 150, 450],
    data: {
      url: targetUrl,
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Ver en la App' },
      { action: 'close', title: 'Entendido' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Al pulsar sobre la notificación nativa del sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/recordatorios';
  const fullUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si ya existe una ventana/pestaña abierta de la app, le damos foco y navegamos
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(fullUrl);
            }
          });
        }
      }
      // 2. Si la app o navegador estaban cerrados, abrimos una nueva ventana directamente en la ruta
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});

// Al cerrar o descartar la notificación
self.addEventListener('notificationclose', (event) => {
  // Manejo de descarte silencioso
});
