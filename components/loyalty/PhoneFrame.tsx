// Marco de celular para las vistas previas del panel.
// No es decoración: obliga a diseñar a 390px (ancho real de un móvil)
// con safe-area y scroll interno, igual que /f y /t en el teléfono.
export function PhoneFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <p
        style={{
          color: "#5C5C59",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <div
        style={{
          width: 340,
          maxWidth: "100%",
          margin: "0 auto",
          borderRadius: 36,
          border: "1px solid #3D3D3B",
          background: "#0F0F0E",
          padding: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            borderRadius: 28,
            overflow: "hidden",
            background: "#20201F",
            maxHeight: 620,
            overflowY: "auto",
          }}
        >
          {/* notch */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
            <div style={{ width: 100, height: 6, borderRadius: 999, background: "#3D3D3B" }} />
          </div>
          {children}
          {/* safe-area */}
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      </div>
    </div>
  );
}
