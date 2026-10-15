import { getMyBusiness } from "@/lib/loyalty/business";

export async function GET() {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return new Response("No autorizado.", { status: 401 });
  const { data } = await supabase
    .from("loyalty_cards")
    .select("balance,rewards_available,created_at,loyalty_members!inner(name,phone,email),loyalty_programs!inner(card_title)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = [["nombre", "telefono", "email", "programa", "balance", "premios", "alta"]];
  for (const c of data ?? []) {
    const m = c.loyalty_members as unknown as { name: string; phone: string; email: string | null };
    const p = c.loyalty_programs as unknown as { card_title: string };
    rows.push([m.name, m.phone, m.email ?? "", p.card_title, String(c.balance), String(c.rewards_available), c.created_at]);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=clientes.csv" },
  });
}
