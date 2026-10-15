"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrWithLogo } from "./QrWithLogo";
import { QrPoster } from "./QrPoster";

export function QrView({
  url,
  title,
  logoUrl,
  businessName,
  rewardDescription,
  goal,
  cardType,
  earnUnit,
}: {
  url: string;
  title: string;
  logoUrl?: string | null;
  businessName: string;
  rewardDescription: string;
  goal: number;
  cardType: "stamps" | "points";
  earnUnit: "visit" | "amount_spent";
}) {
  const [png, setPng] = useState<string>("");
  const [svg, setSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toString(url, { type: "svg", margin: 2 }).then(setSvg).catch(() => {});
  }, [url]);

  function download(href: string, name: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  }

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card style={{ textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, display: "inline-block" }}>
          <QrWithLogo value={url} logoUrl={logoUrl} size={260} onReady={setPng} />
        </div>
      </Card>
      <div>
        <Card>
          <h2 style={{ fontWeight: 800 }}>Tu QR listo para imprimir</h2>
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 6, wordBreak: "break-all" }}>{url}</p>
          <div className="flex gap-2 flex-wrap" style={{ marginTop: 14 }}>
            <Button disabled={!png} onClick={() => download(png, "qr-tarjeta.png")}>Descargar PNG</Button>
            <Button disabled={!svg} variant="secondary" onClick={() => download(`data:image/svg+xml,${encodeURIComponent(svg)}`, "qr-tarjeta.svg")}>Descargar SVG</Button>
            <Button variant="secondary" onClick={copy}>{copied ? "Copiado ✅" : "Copiar enlace"}</Button>
          </div>
          <p style={{ color: "#5C5C59", fontSize: 12, marginTop: 8 }}>
            El PNG y el SVG son el código pelado (ideal para imprenta).
          </p>
        </Card>
        <Card style={{ marginTop: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>💡 Cómo usarlo</h3>
          <ul style={{ color: "#9A9A96", fontSize: 14, marginTop: 8, lineHeight: 1.8 }}>
            <li>· Imprimilo y pegalo en el mostrador o la vidriera.</li>
            <li>· Compartilo por WhatsApp, Instagram o tu web.</li>
            <li>· Ese mismo enlace lo podés grabar en un sticker NFC para que el cliente apoye el celu y se registre.</li>
          </ul>
        </Card>
      </div>
    </div>
      <QrPoster
        url={url}
        businessName={businessName}
        cardTitle={title}
        rewardDescription={rewardDescription}
        goal={goal}
        cardType={cardType}
        earnUnit={earnUnit}
        logoUrl={logoUrl}
      />
    </div>
  );
}
