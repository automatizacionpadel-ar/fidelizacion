// Service worker de push: muestra la notificación y abre la tarjeta al tocarla.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Fidelización";
  const options = {
    body: data.body || "",
    // Icono grande: logo del negocio (viene en el payload) o genérico.
    icon: data.icon || "/icon.png",
    // Insignia pequeña monocromática (esquina del aviso).
    badge: data.badge || "/badge.png",
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
