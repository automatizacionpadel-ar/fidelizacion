import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enrollUrl, requestBaseUrl } from "@/lib/loyalty/business";
import { QrView } from "@/components/loyalty/QrView";

export const dynamic = "force-dynamic";

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id,name").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");
  const { data: program } = await supabase.from("loyalty_programs").select("slug,card_title,card_type,goal,earn_unit,reward_description,logo_url").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!program) notFound();
  const base = await requestBaseUrl();
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>QR de {program.card_title}</h1>
      <QrView
        url={enrollUrl(program.slug, base)}
        title={program.card_title}
        logoUrl={program.logo_url}
        businessName={business.name ?? ""}
        rewardDescription={program.reward_description ?? ""}
        goal={program.goal}
        cardType={program.card_type}
        earnUnit={program.earn_unit}
      />
    </div>
  );
}
