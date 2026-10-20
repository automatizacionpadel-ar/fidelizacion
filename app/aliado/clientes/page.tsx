import Link from "next/link";
import { requireAlly } from "@/lib/auth/roles";
import { listAdminClients } from "@/lib/admin/clients";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/admin/Pagination";
import { PlanBadge, StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AllyClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { ally } = await requireAlly();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  let result;
  let error: string | null = null;
  try {
    result = await listAdminClients({ allyId: ally.id, q: params.q, status: params.status, page });
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mis clientes</h1>
      <p style={{ color: "#9A9A96", fontSize: 14 }}>
        Negocios asignados a tu cartera. Solo lectura.
      </p>

      <Card style={{ marginTop: 16 }}>
        <form className="grid gap-2 md:grid-cols-[2fr_1fr_auto]" style={{ alignItems: "end" }}>
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
          <button type="submit" style={{ background: "#2A2A29", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>Filtrar</button>
        </form>
      </Card>

      {error ? (
        <Card style={{ marginTop: 16 }}><p style={{ color: "#f87171", fontSize: 14 }}>{error}</p></Card>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
            <Table
              head={["Negocio", "Plan", "Estado", "Alta", ""]}
              rows={(result?.rows ?? []).map((c) => [
                <div key="n">
                  <Link href={`/aliado/clientes/${c.id}`} style={{ color: "#F0F0EE", fontWeight: 700 }}>{c.name}</Link>
                  <p style={{ color: "#9A9A96", fontSize: 12 }}>/{c.slug}</p>
                </div>,
                <PlanBadge key="p" plan={c.plan} />,
                <StatusBadge key="s" status={c.status} />,
                new Date(c.created_at).toLocaleDateString("es-AR"),
                <Link key="v" href={`/aliado/clientes/${c.id}`} style={{ color: "#7AB619", fontWeight: 700 }}>Ver métricas</Link>,
              ])}
            />
          </div>
          {result ? (
            <Pagination basePath="/aliado/clientes" params={{ q: params.q, status: params.status }} page={result.page} total={result.total} pageSize={result.pageSize} />
          ) : null}
        </>
      )}
    </div>
  );
}
