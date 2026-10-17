"use client";

import { useEffect } from "react";

// Registra el service worker al cargar cualquier página. Es lo que habilita
// la instalación como PWA (Chrome crea un WebAPK en Android) y, con eso, que
// las notificaciones push lleguen aunque el navegador esté cerrado.
export function PwaSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
