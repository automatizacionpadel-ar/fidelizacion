"use client";

import { CardProgress, CardShell } from "./CardShell";
import { Stamp } from "./Stamp";
import { QrWithLogo } from "./QrWithLogo";

export type VirtualCardProps = {
  businessName: string;
  cardTitle: string;
  memberName: string;
  cardType: "stamps" | "points";
  goal: number;
  balance: number;
  rewardsAvailable: number;
  rewardDescription: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl?: string | null;
  token: string;
  stampIcon?: string | null;
  stampImageUrl?: string | null;
  fontFamily?: string | null;
  template?: string | null;
};

export function VirtualCard(p: VirtualCardProps) {
  const filled = Math.min(p.balance, p.goal);
  const label = p.cardType === "stamps" ? "sellos" : "puntos";
  const icon = p.stampIcon || "✓";
  // Si el título de la tarjeta es igual al nombre del negocio, mostrar uno solo
  const showBusiness =
    p.businessName.trim() !== "" &&
    p.businessName.trim().toLowerCase() !== p.cardTitle.trim().toLowerCase();

  return (
    <CardShell
      template={p.template}
      backgroundColor={p.backgroundColor}
      textColor={p.textColor}
      accentColor={p.accentColor}
      fontFamily={p.fontFamily}
      radius={18}
      padding={22}
      shadow="0 8px 32px rgba(0,0,0,0.45)"
    >
      {/* 1. Logo primero */}
      <div style={{ textAlign: "center" }}>
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.logoUrl}
            alt="Logo del negocio"
            style={{ width: "80%", aspectRatio: "16/9", borderRadius: 18, objectFit: "contain", display: "block", margin: "0 auto" }}
          />
        ) : (
          <div
            style={{
              width: "80%", aspectRatio: "16/9", borderRadius: 18, margin: "0 auto",
              background: p.accentColor, display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 800, fontSize: 56, color: "#20201F",
            }}
          >
            {(p.businessName || "F")[0]}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          {showBusiness && (
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{p.businessName}</p>
          )}
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{p.cardTitle}</h2>
        </div>
      </div>

      {/* 2. Premio */}
      <div
        style={{
          marginTop: 18,
          border: `1px solid ${p.accentColor}`,
          background: "rgba(128,128,128,0.15)",
          borderRadius: 12,
          padding: "12px 14px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, margin: 0, color: p.accentColor }}>
          🎁 PREMIO
        </p>
        <p style={{ fontSize: 16, fontWeight: 800, margin: "4px 0 0" }}>
          {p.rewardDescription || "—"}
        </p>
      </div>
      {p.rewardsAvailable > 0 && (
        <div
          style={{
            marginTop: 10, background: p.accentColor, color: "#20201F",
            borderRadius: 10, padding: "10px 12px", fontWeight: 800, textAlign: "center", fontSize: 14,
          }}
        >
          🎉 Tenés {p.rewardsAvailable} premio{p.rewardsAvailable > 1 ? "s" : ""} para canjear en el local
        </div>
      )}

      {/* 3. Puntos */}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <p style={{ fontSize: 34, fontWeight: 800, margin: 0, lineHeight: 1 }}>
          {filled}<span style={{ fontSize: 18, opacity: 0.6 }}>/{p.goal}</span>
        </p>
        <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, margin: "4px 0 10px" }}>
          {label.toUpperCase()}
        </p>
        <div className="flex gap-2 flex-wrap" style={{ alignItems: "center", justifyContent: "center" }}>
          {p.cardType === "points" ? (
            <div style={{ flex: 1, minWidth: 200 }}>
              <CardProgress balance={filled} goal={p.goal} accentColor={p.accentColor} />
            </div>
          ) : (
            <>
              {Array.from({ length: Math.min(p.goal, 20) }).map((_, i) => (
                <Stamp key={i} earned={i < filled} icon={icon} imageUrl={p.stampImageUrl} size={34} />
              ))}
              {p.goal > 20 && <span style={{ fontSize: 13, opacity: 0.7 }}>+{p.goal - 20} más</span>}
            </>
          )}
        </div>
      </div>

      {/* QR dentro del mismo cuadro */}
      <div style={{ marginTop: 18, borderTop: "1px dashed rgba(128,128,128,0.4)", paddingTop: 18, textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 14, display: "inline-block" }}>
          <QrWithLogo value={p.token} logoUrl={p.logoUrl} size={200} />
        </div>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Mostrá este QR en el mostrador para sumar</p>
      </div>
    </CardShell>
  );
}
