import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnrollForm } from "@/components/loyalty/EnrollForm";

export const dynamic = "force-dynamic";

export default async function EnrollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id,slug,card_title,card_type,goal,reward_description,terms,logo_url,background_color,text_color,accent_color,status,business_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!program || program.status !== "active") notFound();

  return (
    <div style={{ background: program.background_color ?? "#20201F", minHeight: "100dvh", color: program.text_color ?? "#F0F0EE" }}>
      <div className="w-[92%] mx-auto" style={{ maxWidth: 480, paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>
        {/* Logo primero, en su propia línea · título centrado */}
        <div style={{ textAlign: "center" }}>
          {program.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={program.logo_url} alt="logo" style={{ width: "80%", aspectRatio: "16/9", borderRadius: 18, objectFit: "contain", display: "block", margin: "0 auto" }} />
          ) : null}
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 0", lineHeight: 1.2, textAlign: "center" }}>{program.card_title}</h1>
        </div>
        <div style={{ marginTop: 16, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: 14, fontSize: 14 }}>
          🎁 Premio: <strong>{program.reward_description}</strong> · Meta: {program.goal} {program.card_type === "stamps" ? "sellos" : "puntos"}
        </div>
        <EnrollForm slug={slug} accent={program.accent_color ?? "#7AB619"} />
        {program.terms ? <p style={{ fontSize: 12, opacity: 0.7, marginTop: 16 }}>{program.terms}</p> : null}
      </div>
    </div>
  );
}
