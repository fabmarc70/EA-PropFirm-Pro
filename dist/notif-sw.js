// ══════════════════════════════════════════════════════════════════
// Handler PUSH — reçoit les notifications envoyées par le serveur
// (api/check-alerts.js, déclenché par un cron Vercel) même quand
// l'app est complètement fermée. C'est ce qui manquait : l'ancien
// système (fireNotification côté client) ne fonctionnait que si
// l'app était ouverte au moment du contrôle.
// ══════════════════════════════════════════════════════════════════
self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: 'EA PropFirm Pro', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'EA PropFirm Pro';
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'price-alert',
    renotify: true,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handler de clic sur notification — focus/ouvre l'app (route vers l'écran
// Journal si l'URL le précise, sinon vers la racine)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
