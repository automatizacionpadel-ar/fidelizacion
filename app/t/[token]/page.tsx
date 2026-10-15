import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { VirtualCard } from "@/components/loyalty/VirtualCard";
import { OtherCards } from "@/components/loyalty/OtherCards";
import { PushOptIn } from "@/components/loyalty/PushOptIn";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: card } = await admin.from("loyalty_cards").select("*").eq("token", token).maybeSingle();
  if (!card) notFound();
  const { data: program } = await admin.from("loyalty_programs").select("*").eq("id", card.program_id).single();
  const { data: member } = await admin.from("loyalty_members").select("name").eq("id", card.member_id).single();
  const { data: business } = await admin.from("businesses").select("name").eq("id", card.business_id).single();
  if (!program) notFound();

  return (
    <div style={{ background: "#20201F", minHeight: "100dvh", color: "#F0F0EE" }}>
      <div className="w-[92%] mx-auto" style={{ maxWidth: 480, paddingTop: "max(20px, env(safe-area-inset-top))", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
        <VirtualCard
          businessName={business?.name ?? ""}
          cardTitle={program.card_title}
          memberName={member?.name ?? ""}
          cardType={program.card_type}
          goal={program.goal}
          balance={card.balance}
          rewardsAvailable={card.rewards_available}
          rewardDescription={program.reward_description}
          backgroundColor={program.background_color}
          textColor={program.text_color}
          accentColor={program.accent_color}
          logoUrl={program.logo_url}
          token={token}
          stampIcon={program.stamp_icon}
          stampImageUrl={program.stamp_image_url}
          fontFamily={program.font_family}
          template={program.template ?? "moderno"}
        />
        <OtherCards token={token} />
        <p style={{ color: "#5C5C59", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Podés agregar esta página a tu pantalla de inicio.
        </p>
        <PushOptIn cardToken={token} />
      </div>
    </div>
  );
}
