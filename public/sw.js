// Service worker de push: muestra la notificación y abre la tarjeta al tocarla.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Fidelización";
  const options = {
    body: data.body || "",
    // Icono grande (derecha): logo del negocio (viene en el payload) o genérico.
    icon: data.icon || "/icon.png",
    // Insignia pequeña (izquierda): silueta monocromática. Android la pinta
    // en blanco sí o sí: ahí NO puede ir el logo a color (lo impone el SO).
    badge: data.badge || "/badge.png",
    // No se descarta sola: queda fija hasta que el cliente la toca o la cierra.
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("navigate" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
