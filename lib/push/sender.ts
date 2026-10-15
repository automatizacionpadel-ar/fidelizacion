import webpush from "web-push";

let configured = false;

export function pushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_EMAIL
  );
}

function ensure() {
  if (configured) return;
  if (!pushConfigured()) throw new Error("Push no configurado (faltan claves VAPID).");
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  title: string,
  body: string,
  url?: string,
  icon?: string | null,
  badge?: string | null
) {
  ensure();
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title, body, url, icon: icon ?? undefined, badge: badge ?? undefined }),
    // Alta prioridad: si no se pone, FCM la trata como "normal" y en un
    // celu en reposo puede demorar minutos (llega al abrir Chrome).
    { urgency: "high", TTL: 3600 }
  );
}
