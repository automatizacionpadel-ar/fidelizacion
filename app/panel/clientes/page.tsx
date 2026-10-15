import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!business) redirect("/panel");

  const query = supabase
    .from("loyalty_cards")
    .select("id,balance,rewards_available,last_earn_at,loyalty_members!inner(name,phone),loyalty_programs!inner(card_title)")
    .eq("business_id", business.id)
    .order("last_earn_at", { ascending: false, nullsFirst: false })
    .limit(100);
  const { data: cards } = await query;

  const filtered = (cards ?? []).filter((c) => {
    if (!q) return true;
    const m = c.loyalty_members as unknown as { name: string; phone: string };
    return (m.name + " " + m.phone).toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Clientes</h1>
        <div className="flex gap-2">
          <form className="flex gap-2">
            <input name="q" defaultValue={q ?? ""} placeholder="Buscar por nombre o teléfono" style={{ background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 12px", fontSize: 14 }} />
            <Button variant="secondary" type="submit">Buscar</Button>
          </form>
          <a href="/api/loyalty/members/export"><Button variant="secondary">Exportar CSV</Button></a>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Table
          head={["Cliente", "Teléfono", "Programa", "Progreso", "Premios", ""]}
          rows={filtered.map((c) => {
            const m = c.loyalty_members as unknown as { name: string; phone: string };
            const p = c.loyalty_programs as unknown as { card_title: string };
            return [
              m.name,
              m.phone,
              p.card_title,
              `${c.balance}`,
              `${c.rewards_available}`,
              <Link key={c.id} href={`/panel/clientes/${c.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>Ver</Link>,
            ];
          })}
        />
      </div>
      {(!cards || cards.length === 0) && (
        <Card style={{ marginTop: 16 }}><p style={{ color: "#9A9A96" }}>Todavía no tenés clientes. Compartí tu QR para que se sumen.</p></Card>
      )}
    </div>
  );
}
