import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/loyalty/ProgramForm";

export const dynamic = "force-dynamic";

export default async function NuevoProgramaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id,name").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");
  const { data: branches } = await supabase.from("branches").select("id,name").eq("business_id", business.id).order("created_at");

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Crear tarjeta</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 20 }}>Completá los pasos y publicá cuando esté lista.</p>
      <ProgramForm businessName={business.name} branches={branches ?? []} />
    </div>
  );
}
