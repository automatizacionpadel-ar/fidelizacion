import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { AdjustForm } from "@/components/loyalty/AdjustForm";
import { ResyncButton } from "@/components/loyalty/ResyncButton";

export const dynamic = "force-dynamic";

export default async function ClienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");

  const { data: card } = await supabase
    .from("loyalty_cards")
    .select("*,loyalty_members!inner(name,phone,email),loyalty_programs!inner(card_title,goal)")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!card) notFound();

  const { data: tx } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("card_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const m = card.loyalty_members as unknown as { name: string; phone: string; email: string | null };
  const p = card.loyalty_programs as unknown as { card_title: string; goal: number };
  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/t/${card.token}`;

  async function deleteMember() {
    "use server";
    const s = await createClient();
    const { data: me } = await s.auth.getUser();
    const { data: biz } = await s
      .from("businesses")
      .select("status")
      .eq("owner_user_id", me.user?.id ?? "")
      .maybeSingle();
    if (biz?.status === "suspended") redirect("/panel");
    // Anonimizar/borrar: borramos la tarjeta y sus transacciones, y el miembro si no tiene más tarjetas.
    await s.from("loyalty_transactions").delete().eq("card_id", id);
    await s.from("loyalty_cards").delete().eq("id", id);
    redirect("/panel/clientes");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{m.name}</h1>
        <p style={{ color: "#9A9A96", fontSize: 14 }}>{m.phone}{m.email ? ` · ${m.email}` : ""}</p>
        <Card style={{ marginTop: 12 }}>
          <p><strong>{p.card_title}</strong> · {card.balance} de {p.goal} · 🏆 {card.rewards_available} premio(s)</p>
          <p style={{ marginTop: 10, fontSize: 14 }}>
            🔗 Tarjeta web del cliente:{" "}
            <a href={cardUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#7AB619", fontWeight: 700 }}>
              Abrir tarjeta
            </a>
          </p>
          <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 4 }}>
            Mandale ese link al celu del cliente (ej. por WhatsApp). Al abrirla se actualiza la app y los avisos.
          </p>
          <ResyncButton cardId={id} />
          <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 6 }}>
            Fuerza la actualización del pase en Google Wallet (progreso y premios).
          </p>
        </Card>
        <h2 style={{ fontWeight: 800, marginTop: 20, marginBottom: 8 }}>Historial</h2>
        <Table
          head={["Fecha", "Tipo", "Cant.", "Nota"]}
          rows={(tx ?? []).map((t) => [
            new Date(t.created_at).toLocaleString("es-AR"),
            t.type === "earn" ? "Suma" : t.type === "redeem" ? "Canje" : "Ajuste",
            String(t.amount),
            t.note ?? "—",
          ])}
        />
      </div>
      <div>
        <Card>
          <h3 style={{ fontWeight: 800 }}>Ajuste manual</h3>
          <AdjustForm cardId={id} />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <h3 style={{ fontWeight: 800 }}>Privacidad</h3>
          <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6 }}>El cliente puede pedir que borres sus datos. Esto elimina su tarjeta e historial.</p>
          <form action={deleteMember} style={{ marginTop: 10 }}>
            <button type="submit" style={{ color: "#f87171", fontSize: 14, background: "none", border: "1px solid #3D3D3B", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              Eliminar cliente
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
