import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteProgramIconButton } from "@/components/loyalty/DeleteProgramIconButton";
import { ProgramStatusButton } from "@/components/loyalty/ProgramStatusButton";
import { PLANS, cardLimits, normalizePlan } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function TarjetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id,plan")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) redirect("/panel");

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("id,name,card_title,card_type,status,goal,branches(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const plan = normalizePlan((business as { plan?: string }).plan);
  const limits = cardLimits(plan);
  const totalCards = programs?.length ?? 0;
  const activeCards = (programs ?? []).filter((p) => p.status === "active").length;
  const canCreate = totalCards < limits.total;

  const { data: cards } = await supabase
    .from("loyalty_cards")
    .select("program_id")
    .eq("business_id", business.id);
  const clientsByProgram = new Map<string, number>();
  for (const c of cards ?? []) {
    clientsByProgram.set(c.program_id, (clientsByProgram.get(c.program_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Tarjetas</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>Tus tarjetas de sellos o puntos.</p>
          <div style={{ marginTop: 10 }}>
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #7AB619, #9AD53A)",
                color: "#20201F",
                borderRadius: 999,
                padding: "3px 12px",
                fontSize: 14,
                fontWeight: 900,
                boxShadow: "0 4px 16px rgba(122,182,25,0.2)",
              }}
            >
              Plan {PLANS[plan].label}
            </span>
            <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: 10, maxWidth: 420 }}>
              <PlanUsageBar
                label="Tarjetas activas"
                value={activeCards}
                max={limits.active}
                color="#7AB619"
              />
              <PlanUsageBar
                label="Tarjetas creadas"
                value={totalCards}
                max={limits.total}
                color="#8B5CF6"
              />
            </div>
            {activeCards >= limits.active ? (
              <p style={{ color: "#f59e0b", fontSize: 12, marginTop: 8 }}>
                Límite de tarjetas activas alcanzado. Pausá una para activar otra.
              </p>
            ) : null}
          </div>
        </div>
        {canCreate ? (
          <Link href="/panel/programas/nuevo">
            <Button>＋ Crear tarjeta</Button>
          </Link>
        ) : (
          <Button disabled title={`Límite de ${limits.total} tarjetas del plan ${PLANS[plan].label}`}>
            Límite de tarjetas alcanzado
          </Button>
        )}
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
                {(p.branches as unknown as { name: string } | null)?.name
                  ? ` · 📍 ${(p.branches as unknown as { name: string }).name}`
                  : ""}
              </p>
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 12, alignItems: "center" }}>
                <Link href={`/panel/programas/${p.id}`}><Button variant="secondary">Editar</Button></Link>
                <Link href={`/panel/${p.id}/qr`}><Button variant="secondary">Ver QR</Button></Link>
                <Link href="/panel/escanear"><Button variant="secondary">Escanear</Button></Link>
                <ProgramStatusButton programId={p.id} cardTitle={p.card_title} status={p.status} />
                <DeleteProgramIconButton
                  programId={p.id}
                  cardTitle={p.card_title}
                  clients={clientsByProgram.get(p.id) ?? 0}
                />
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

function PlanUsageBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
        <span style={{ color: "#9A9A96" }}>{label}</span>
        <span style={{ color: "#F0F0EE", fontWeight: 800 }}>{value}/{max}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          marginTop: 5,
          height: 8,
          borderRadius: 999,
          background: "#20201F",
          border: "1px solid #3D3D3B",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
