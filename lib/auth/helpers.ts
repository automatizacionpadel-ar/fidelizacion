import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { supabase, user, business };
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "negocio"
  );
}

export function normalizePhoneAR(raw: string) {
  // Normalización simple AR: solo dígitos, sin espacios/guiones.
  // Acepta 10-13 dígitos (con o sin 54/9/0).
  const digits = raw.replace(/\D/g, "");
  return digits;
}
