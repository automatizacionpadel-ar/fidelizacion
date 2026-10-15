"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/Card";

export function CardQr({ token }: { token: string }) {
  const [png, setPng] = useState("");
  useEffect(() => {
    QRCode.toDataURL(token, { width: 512, margin: 2 }).then(setPng).catch(() => {});
  }, [token]);
  return (
    <Card style={{ textAlign: "center" }}>
      <p style={{ color: "#5C5C59", fontSize: 12, fontWeight: 700 }}>TU QR</p>
      <div style={{ background: "#fff", borderRadius: 12, padding: 14, display: "inline-block", marginTop: 8 }}>
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt="QR de tu tarjeta" style={{ width: 220, height: 220 }} />
        ) : (
          <p style={{ color: "#333" }}>...</p>
        )}
      </div>
    </Card>
  );
}
