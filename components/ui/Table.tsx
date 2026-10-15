import type { ReactNode } from "react";

export function Table({
  head,
  rows,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid #3D3D3B", borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#20201F" }}>
            {head.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: "#9A9A96",
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  borderBottom: "1px solid #3D3D3B",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={head.length}
                style={{ padding: 20, textAlign: "center", color: "#5C5C59" }}
              >
                Todavía no hay datos.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #3D3D3B" }}>
                {r.map((c, j) => (
                  <td key={j} style={{ padding: "10px 12px", color: "#F0F0EE" }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
