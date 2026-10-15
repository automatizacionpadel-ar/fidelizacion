import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneAR } from "@/lib/auth/helpers";

// Dice si un teléfono ya está registrado en el negocio del programa,
// para ofrecer el alta sin reingresar datos. No devuelve datos personales.
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  h.count += 1;
  return h.count > 30;
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Demasiados intentos. Esperá un minuto." }, { status: 429 });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  const phone = normalizePhoneAR(url.searchParams.get("phone") ?? "");
  if (!slug || phone.length < 8) return NextResponse.json({ registered: false });

  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("business_id,status")
    .eq("slug", slug)
    .maybeSingle();
  if (!program || program.status !== "active") return NextResponse.json({ registered: false });

  const { data: member } = await admin
    .from("loyalty_members")
    .select("id")
    .eq("business_id", program.business_id)
    .eq("phone", phone)
    .maybeSingle();

  return NextResponse.json({ registered: !!member });
}
