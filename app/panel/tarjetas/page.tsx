import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) redirect("/panel");

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("id,name,card_title,card_type,status,goal")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Tarjetas</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>Tus tarjetas de sellos o puntos.</p>
        </div>
        <Link href="/panel/programas/nuevo">
          <Button>＋ Crear tarjeta</Button>
        </Link>
      </div>

      {!programs || programs.length === 0 ? (
        <Card style={{ marginTop: 24, textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 40 }}>🎴</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>Creá tu primera tarjeta</h2>
          <p style={{ color: "#9A9A96", marginTop: 8 }}>
            Sellos o puntos, con tu logo y tus colores. En 5 minutos tenés el QR para el mostrador.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/panel/programas/nuevo">
              <Button>Crear mi primera tarjeta</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: 24 }}>
          {programs.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <strong>{p.card_title}</strong>
                <StatusBadge status={p.status} />
              </div>
              <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 4 }}>
                {p.card_type === "stamps" ? "Sellos" : "Puntos"} · Meta: {p.goal} · {p.name}
              </p>
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 12 }}>
                <Link href={`/panel/programas/${p.id}`}><Button variant="secondary">Editar</Button></Link>
                <Link href={`/panel/${p.id}/qr`}><Button variant="secondary">Ver QR</Button></Link>
                <Link href="/panel/escanear"><Button variant="secondary">Escanear</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    draft: { bg: "#5C5C59", label: "Borrador" },
    active: { bg: "#7AB619", label: "Activa" },
    paused: { bg: "#3B82F6", label: "Pausada" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{ background: s.bg, color: "#20201F", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "2px 10px" }}>
      {s.label}
    </span>
  );
}
