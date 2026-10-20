import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { listAdminAllies } from "@/lib/admin/allies";
import { formatMoney } from "@/lib/billing";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AllyRowActions } from "@/components/admin/AllyRowActions";

export const dynamic = "force-dynamic";

export default async function AdminAlliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  let result;
  let error: string | null = null;
  try {
    result = await listAdminAllies({ q: params.q, status: params.status, page });
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Aliados</h1>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>
            Partners comerciales y su cartera de clientes.
          </p>
        </div>
        <Link href="/admin/aliados/nuevo">
          <Button>＋ Nuevo aliado</Button>
        </Link>
      </div>

      <Card style={{ marginTop: 16 }}>
        <form className="grid gap-2 md:grid-cols-[2fr_1fr_auto]" style={{ alignItems: "end" }}>
          <div>
            <label htmlFor="q" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Buscar</label>
            <input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Nombre, email o contacto" style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }} />
          </div>
          <div>
            <label htmlFor="status" style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 4 }}>Estado</label>
            <select id="status" name="status" defaultValue={params.status ?? ""} style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "9px 12px", fontSize: 14 }}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
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
              head={["Aliado", "Contacto", "Comisión", "Clientes", "Por pagar", "Estado", "Acciones"]}
              rows={(result?.rows ?? []).map((a) => [
                <Link key="n" href={`/admin/aliados/${a.id}`} style={{ color: "#F0F0EE", fontWeight: 700 }}>{a.name}</Link>,
                a.phone || "—",
                `${Number(a.commission_rate)}%`,
                a.active_clients,
                formatMoney(a.estimated_commission),
                <StatusBadge key="s" status={a.status} />,
                <AllyRowActions key="a" ally={a} />,
              ])}
            />
          </div>
          {result ? (
            <Pagination
              basePath="/admin/aliados"
              params={{ q: params.q, status: params.status }}
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
