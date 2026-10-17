import type { MetadataRoute } from "next";

// Manifest PWA: al instalarse en Android, Chrome crea un WebAPK (app real).
// Así las notificaciones push se entregan de forma confiable en segundo plano,
// sin depender de que el navegador esté abierto.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fidelización",
    short_name: "Fidelización",
    description: "Tus tarjetas de sellos y puntos, con premios y avisos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#20201F",
    theme_color: "#20201F",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
