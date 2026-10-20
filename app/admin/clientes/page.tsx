import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { listAdminClients } from "@/lib/admin/clients";
import { getAlliesOptions } from "@/lib/admin/allies";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/admin/Pagination";
import { PlanBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { ClientRowActions } from "@/components/admin/ClientRowActions";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; ally?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  let result;
  let allies: { id: string; name: string; status: string }[] = [];
  let error: string | null = null;
  try {
    [result, allies] = await Promise.all([
      listAdminClients({
        q: params.q,
        status: params.status,
        plan: params.plan,
        allyId: params.ally,
        page,
      }),
      getAlliesOptions(),
    ]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Clientes</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>
            Todos los negocios de la plataforma.
          </p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <Button>＋ Nuevo cliente</Button>
        </Link>
      </div>

      <Card style={{ marginTop: 16 }}>
        <form className="grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]" style={{ alignItems: "end" }}>
          <div>
            <label htmlFor="q" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Buscar</label>
            <input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Nombre o slug" style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }} />
          </div>
          <div>
            <label htmlFor="status" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Estado</label>
            <select id="status" name="status" defaultValue={params.status ?? ""} style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </div>
          <div>
            <label htmlFor="plan" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Plan</label>
            <select id="plan" name="plan" defaultValue={params.plan ?? ""} style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }}>
              <option value="">Todos</option>
              <option value="base">Básico</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label htmlFor="ally" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Aliado</label>
            <select id="ally" name="ally" defaultValue={params.ally ?? ""} style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }}>
              <option value="">Todos</option>
              <option value="none">Sin aliado</option>
              {allies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <Button type="submit" variant="secondary">Filtrar</Button>
        </form>
      </Card>

      {error ? (
        <Card style={{ marginTop: 16 }}>
          <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
          <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 6 }}>
            ¿Aplicaste las migraciones 013–019?
          </p>
        </Card>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
            <Table
              head={["Negocio", "Dueño", "Teléfono", "Plan", "Estado", "Alta", "Aliado", "Acciones"]}
              rows={(result?.rows ?? []).map((c) => [
                <Link key="n" href={`/admin/clientes/${c.id}`} style={{ color: "#F0F0EE", fontWeight: 700 }}>{c.name}</Link>,
                c.owner_name ?? "—",
                c.owner_phone || "—",
                <PlanBadge key="p" plan={c.plan} />,
                <StatusBadge key="s" status={c.status} />,
                new Date(c.created_at).toLocaleDateString("es-AR"),
                <span key="ally" style={{ color: c.ally_id ? "#7AB619" : "#9A9A96", fontWeight: 700 }}>
                  {c.ally_id ? "Sí" : "No"}
                </span>,
                <ClientRowActions key="actions" client={c} allies={allies} />,
              ])}
            />
          </div>
          {result ? (
            <Pagination
              basePath="/admin/clientes"
              params={{ q: params.q, status: params.status, plan: params.plan, ally: params.ally }}
              page={result.page}
              total={result.total}
              pageSize={result.pageSize}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
