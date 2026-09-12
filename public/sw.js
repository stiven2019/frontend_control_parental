// Service Worker para "Mi Bebé" — Notificaciones Push en segundo plano
const CACHE_NAME = 'mibebe-v1';

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
      data = { title: 'Recordatorio Mi Bebé', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 Recordatorio — Mi Bebé';
  const options = {
    body: data.body || 'Tienes una alarma o recordatorio pendiente.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'mibebe_alarm_' + Date.now(),
    data: {
      url: data.url || '/recordatorios',
    },
    requireInteraction: true, // Se mantiene visible en el sistema operativo hasta que la usuaria interactúe
    vibrate: [300, 150, 300, 150, 450],
    actions: [
      { action: 'open', title: 'Ver en la App' },
      { action: 'close', title: 'Cerrar' },
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

  const targetUrl = event.notification.data?.url || '/recordatorios';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana o pestaña abierta, le damos foco y navegamos
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Si el navegador o app estaba cerrado, abrimos una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
