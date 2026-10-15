import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushConfigured } from "@/lib/push/sender";

// Diagnóstico push para el panel: ¿claves VAPID cargadas? ¿cuántas
// suscripciones hay y de qué navegador vienen? (por el dominio del endpoint:
// FCM = Chrome/Android, Mozilla = Firefox, Apple = Safari).
export async function GET(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const programId = new URL(req.url).searchParams.get("program_id");
  const admin = createAdminClient();
  let query = admin
    .from("push_subscriptions")
    .select("endpoint,created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (programId) query = query.eq("program_id", programId);
  const { data: subs } = await query;
  const domainOf = (endpoint: string) => {
    try {
      const host = new URL(endpoint).hostname;
      if (host.includes("fcm.googleapis.com") || host.includes("googleapis.com")) return "Chrome/Android (FCM)";
      if (host.includes("mozilla.com")) return "Firefox";
      if (host.includes("apple.com")) return "Safari/Apple";
      return host;
    } catch {
      return "?";
    }
  };
  return NextResponse.json({
    configured: pushConfigured(),
    count: subs?.length ?? 0,
    subs: (subs ?? []).map((s) => ({ browser: domainOf(s.endpoint), created_at: s.created_at })),
  });
}
