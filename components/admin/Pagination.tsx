import Link from "next/link";

export function Pagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) {
    return <p style={{ fontSize: 12, color: "#9A9A96" }}>{total} resultado(s).</p>;
  }

  function href(next: number) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) q.set(k, v);
    }
    q.set("page", String(next));
    return `${basePath}?${q.toString()}`;
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginTop: 12 }}>
      <p style={{ fontSize: 12, color: "#9A9A96" }}>
        {total} resultado(s) · página {page} de {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} style={{ border: "1px solid #3D3D3B", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#F0F0EE" }}>
            Anterior
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} style={{ border: "1px solid #3D3D3B", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#F0F0EE" }}>
            Siguiente
          </Link>
        ) : null}
      </div>
    </div>
  );
}
