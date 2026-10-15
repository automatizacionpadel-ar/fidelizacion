import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function getMyBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, business: null };
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return { supabase, user, business };
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

// Base real del request (host + protocolo). Así el QR y los enlaces copiados
// siempre apuntan al servidor que estás usando (puerto local, ngrok, deploy...),
// en vez de un localhost:3000 hardcodeado que puede no existir.
export async function requestBaseUrl() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // fuera de un request (tests, scripts)
  }
  return appUrl();
}

export function enrollUrl(slug: string, base?: string) {
  return `${base ?? appUrl()}/f/${slug}`;
}

export function cardUrl(token: string, base?: string) {
  return `${base ?? appUrl()}/t/${token}`;
}
