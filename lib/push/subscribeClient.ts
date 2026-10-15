// Alta de push desde el navegador. Se llama dentro del gesto del usuario
// (ej. al enviar el formulario de registro) para que el navegador acepte
// el pedido de permiso. Devuelve true si quedó suscripto.
export async function subscribePush(cardToken: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const pubkey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!pubkey) return false;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pubkey),
    });
    const keys = sub.toJSON().keys;
    if (!keys?.p256dh || !keys?.auth) return false;
    const res = await fetch("/api/loyalty/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        card_token: cardToken,
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
