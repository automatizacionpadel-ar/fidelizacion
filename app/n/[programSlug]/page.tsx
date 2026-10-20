import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnrollForm } from "@/components/loyalty/EnrollForm";
import { AccountSuspended } from "@/components/loyalty/AccountSuspended";
import { VirtualCard } from "@/components/loyalty/VirtualCard";
import { deviceCookieName } from "@/lib/loyalty/device";
import { syncCardWallet } from "@/lib/wallet/syncCard";
import { notifyN8n } from "@/lib/loyalty/notify";

export const dynamic = "force-dynamic";

type EarnResult = {
  ok?: boolean;
  error?: string;
  cooldown?: boolean;
  balance?: number;
  rewards_available?: number;
  earned?: number;
  won?: number;
  goal?: number;
};

// Una sola URL para QR y NFC: al cargarla resolvemos alta (cliente nuevo) o
// sellado automático (cliente ya registrado en este dispositivo), sin ningún
// paso manual del lado del negocio. El único freno es el cooldown por programa.
export default async function AutoPage({ params }: { params: Promise<{ programSlug: string }> }) {
  const { programSlug } = await params;
  const admin = createAdminClient();

  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id,slug,business_id,card_title,card_type,goal,reward_description,terms,logo_url,background_color,text_color,accent_color,stamp_icon,stamp_image_url,font_family,template,status,branch_id,branches(name),businesses(name,status)")
    .eq("slug", programSlug)
    .maybeSingle();
  if (!program || program.status !== "active") notFound();
  const branch = program.branches as unknown as { name: string } | null;
  const business = program.businesses as unknown as { name: string; status: string } | null;
  if (business?.status === "suspended") return <AccountSuspended businessName={business.name} />;

  // Cookie de dispositivo → tarjeta válida de ESTE programa.
  const cookieStore = await cookies();
  const token = cookieStore.get(deviceCookieName(program.id))?.value;
  let card: { id: string; token: string; balance: number; rewards_available: number; member_id: string } | null = null;
  if (token) {
    const { data } = await admin
      .from("loyalty_cards")
      .select("id,token,balance,rewards_available,member_id")
      .eq("token", token)
      .eq("program_id", program.id)
      .maybeSingle();
    card = data ?? null;
  }

  // ===== Rama de alta: mismo formulario/lógica que /f/[slug] =====
  // El alta NO suma sello. El endpoint de alta deja la cookie de dispositivo.
  if (!card) {
    return (
      <div style={{ background: program.background_color ?? "#20201F", minHeight: "100dvh", color: program.text_color ?? "#F0F0EE" }}>
        <div className="w-[92%] mx-auto" style={{ maxWidth: 480, paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
          <div style={{ textAlign: "center" }}>
            {program.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={program.logo_url} alt="logo" style={{ width: "80%", aspectRatio: "16/9", borderRadius: 18, objectFit: "contain", display: "block", margin: "0 auto" }} />
            ) : null}
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.2, textAlign: "center" }}>{program.card_title}</h1>
            {branch?.name ? (
              <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0", textAlign: "center" }}>📍 Válida solo en {branch.name}</p>
            ) : null}
          </div>
          <div style={{ marginTop: 16, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: 14, fontSize: 14 }}>
            🎁 Premio: <strong>{program.reward_description}</strong> · Meta: {program.goal} {program.card_type === "stamps" ? "sellos" : "puntos"}
          </div>
          <EnrollForm slug={programSlug} accent={program.accent_color ?? "#7AB619"} />
          {program.terms ? <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>{program.terms}</p> : null}
        </div>
      </div>
    );
  }

  // ===== Rama de sellado: el GET ejecuta la transacción (con cooldown) =====
  const { data: earned } = await admin.rpc("loyalty_earn_auto", { p_card_id: card.id, p_source: "auto_scan" });
  const result = (earned ?? {}) as EarnResult;
  const didEarn = result.ok === true;
  const won = didEarn ? result.won ?? 0 : 0;
  const balance = didEarn ? result.balance ?? card.balance : card.balance;
  const rewards = didEarn ? result.rewards_available ?? card.rewards_available : card.rewards_available;

  if (didEarn) {
    const cardId = card.id;
    const payload = { business_id: program.business_id, card_id: card.id, source: "auto_scan", ...result };
    after(async () => {
      await notifyN8n("earn", payload);
      await syncCardWallet(cardId);
    });
  }

  const { data: member } = await admin.from("loyalty_members").select("name").eq("id", card.member_id).single();
  const unit = program.card_type === "stamps" ? "sello" : "punto";

  return (
    <div style={{ background: program.background_color ?? "#20201F", minHeight: "100dvh", color: program.text_color ?? "#F0F0EE" }}>
      <div className="w-[92%] mx-auto" style={{ maxWidth: 480, paddingTop: "max(20px, env(safe-area-inset-top))", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
        {didEarn ? (
          <div style={{ background: program.accent_color ?? "#7AB619", color: "#20201F", borderRadius: 14, padding: "16px 18px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {won > 0 ? "🎉 ¡Ganaste un premio!" : `✅ Sumaste un ${unit}`}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 0", opacity: 0.85 }}>
              Progreso {balance}/{program.goal}
            </p>
          </div>
        ) : null}

        <VirtualCard
          businessName={business?.name ?? ""}
          cardTitle={program.card_title}
          memberName={member?.name ?? ""}
          cardType={program.card_type}
          goal={program.goal}
          balance={balance}
          rewardsAvailable={rewards}
          rewardDescription={program.reward_description}
          backgroundColor={program.background_color}
          textColor={program.text_color}
          accentColor={program.accent_color}
          logoUrl={program.logo_url}
          token={card.token}
          stampIcon={program.stamp_icon}
          stampImageUrl={program.stamp_image_url}
          fontFamily={program.font_family}
          template={program.template ?? "moderno"}
        />

        <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Tu tarjeta en Google Wallet se actualiza sola en unos segundos.
        </p>
      </div>
    </div>
  );
}
