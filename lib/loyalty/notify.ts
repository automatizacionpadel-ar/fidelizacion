// Hook opcional hacia n8n. Si no hay URL configurada, no hace nada.
export async function notifyN8n(event: "earn" | "redeem" | "enroll" | "adjust", payload: Record<string, unknown>) {
  const url = process.env.N8N_LOYALTY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, at: new Date().toISOString(), ...payload }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // No bloquear la operación si n8n falla.
  }
}
