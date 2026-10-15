import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgramForm } from "@/components/loyalty/ProgramForm";

export const dynamic = "force-dynamic";

export default async function EditarProgramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id,name").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");
  const { data: program } = await supabase.from("loyalty_programs").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!program) notFound();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Editar: {program.card_title}</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 20 }}>Estado: {program.status}</p>
      <ProgramForm initial={program} isActive={program.status === "active"} businessName={business.name} />
    </div>
  );
}
