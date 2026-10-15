"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import {
  POSTER_DEFAULTS,
  POSTER_SIZES,
  POSTER_TEMPLATES,
  defaultPosterTexts,
  posterDocument,
  type PosterSize,
  type PosterTemplate,
} from "@/lib/loyalty/poster";

export function QrPoster({
  url,
  businessName,
  cardTitle,
  rewardDescription,
  goal,
  cardType,
  earnUnit,
  logoUrl,
}: {
  url: string;
  businessName: string;
  cardTitle: string;
  rewardDescription: string;
  goal: number;
  cardType: "stamps" | "points";
  earnUnit: "visit" | "amount_spent";
  logoUrl?: string | null;
}) {
  const auto = useMemo(
    () => defaultPosterTexts({ businessName, cardTitle, rewardDescription, goal, cardType, earnUnit }),
    [businessName, cardTitle, rewardDescription, goal, cardType, earnUnit]
  );

  const [template, setTemplate] = useState<PosterTemplate>("moderno");
  const [size, setSize] = useState<PosterSize>("A5");
  const [qr, setQr] = useState("");
  const [texts, setTexts] = useState(auto);
  const [bg, setBg] = useState("");
  const [ink, setInk] = useState("");
  const [accent, setAccent] = useState("");
  const [scale, setScale] = useState(100);
  const [showLogo, setShowLogo] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setPreviewW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // La hoja real (mm → px) se escala para que entre exacta en el preview, sin scroll.
  const sheetW = size === "A5" ? (148 * 96) / 25.4 : (210 * 96) / 25.4;
  const sheetH = (sheetW * 210) / 148;
  const fit = previewW > 0 ? Math.min(1, previewW / sheetW) : 1;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 1200, margin: 2 }).then(setQr).catch(() => {});
  }, [url]);

  const set = (k: keyof typeof texts, v: string) => setTexts((p) => ({ ...p, [k]: v }));

  function reset() {
    setTexts(auto);
    setBg("");
    setInk("");
    setAccent("");
    setScale(100);
    setShowLogo(true);
  }

  const defaults = POSTER_DEFAULTS[template];
  const html = useMemo(() => {
    if (!qr) return "";
    return posterDocument(
      template,
      size,
      { ...texts, logoUrl, qrDataUrl: qr },
      { bg: bg || undefined, ink: ink || undefined, accent: accent || undefined, scale, showLogo }
    );
  }, [template, size, qr, texts, logoUrl, bg, ink, accent, scale, showLogo]);

  function print() {
    if (!html) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      alert("Permitile al navegador abrir la ventana para imprimir.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    const go = () => {
      try {
        w.print();
      } catch {}
    };
    if (w.document.readyState === "complete") setTimeout(go, 300);
    else w.onload = () => setTimeout(go, 300);
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <h2 style={{ fontWeight: 800 }}>🖨️ Cartel para imprimir</h2>
      <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 6 }}>
        Elegí diseño y tamaño, personalizalo y abrilo listo para imprimir o guardar como PDF.
      </p>

      <p style={{ fontSize: 13, fontWeight: 700, color: "#9A9A96", marginTop: 14 }}>DISEÑO</p>
      <div className="grid gap-2 md:grid-cols-4" style={{ marginTop: 8 }}>
        {POSTER_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            style={{
              textAlign: "left", borderRadius: 10, padding: 10, cursor: "pointer",
              background: template === t.id ? "#20201F" : "transparent",
              border: template === t.id ? "2px solid #7AB619" : "1px solid #3D3D3B",
            }}
          >
            <strong style={{ fontSize: 14 }}>{t.label}</strong>
            <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 2 }}>{t.desc}</p>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 700, color: "#9A9A96", marginTop: 14 }}>TAMAÑO</p>
      <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
        {POSTER_SIZES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSize(s.id)}
            title={s.desc}
            style={{
              borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              background: size === s.id ? "#7AB619" : "#20201F",
              color: size === s.id ? "#20201F" : "#F0F0EE",
              border: "1px solid #3D3D3B",
            }}
          >
            {s.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#9A9A96", alignSelf: "center" }}>
          {size === "A5" ? "14,8 × 21 cm · cartel de escritorio" : "21 × 29,7 cm · cartel grande"}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]" style={{ marginTop: 16 }}>
        <div ref={previewRef} style={{ maxWidth: 380 }}>
          {html ? (
            <div style={{ width: "100%", height: sheetH * fit, overflow: "hidden", border: "1px solid #3D3D3B", borderRadius: 12, background: "#fff" }}>
              <iframe
                title="Vista previa del cartel"
                srcDoc={html}
                sandbox=""
                style={{ width: sheetW, height: sheetH, border: 0, transform: `scale(${fit})`, transformOrigin: "top left", pointerEvents: "none", display: "block" }}
              />
            </div>
          ) : (
            <p style={{ fontSize: 14, color: "#9A9A96" }}>Generando vista previa…</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Label>Nombre del negocio</Label>
            <Input value={texts.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <Label>Título de la tarjeta</Label>
            <Input value={texts.cardTitle} onChange={(e) => set("cardTitle", e.target.value)} />
          </div>
          <div>
            <Label>Texto descriptivo</Label>
            <textarea
              value={texts.howText}
              onChange={(e) => set("howText", e.target.value)}
              rows={3}
              style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
            />
          </div>
          <div>
            <Label>Texto del premio</Label>
            <Input value={texts.rewardText} onChange={(e) => set("rewardText", e.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {(
              [
                ["Fondo", bg, setBg, defaults.bg],
                ["Texto", ink, setInk, defaults.ink],
                ["Acento", accent, setAccent, defaults.accent],
              ] as const
            ).map(([label, value, setValue, fallback]) => (
              <div key={label}>
                <Label>{label}</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value || fallback}
                    onChange={(e) => setValue(e.target.value)}
                    style={{ width: 44, height: 36, cursor: "pointer", background: "none", border: "1px solid #3D3D3B", borderRadius: 8 }}
                  />
                  <Input value={value || fallback} onChange={(e) => setValue(e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label>Tamaño del texto: {scale}%</Label>
            <input
              type="range"
              min={80}
              max={130}
              step={5}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7AB619" }}
            />
          </div>

          <label style={{ display: "flex", gap: 8, fontSize: 14, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
            Mostrar logo del negocio
          </label>

          <div>
            <Button variant="secondary" onClick={reset}>Restablecer diseño</Button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Button disabled={!html} onClick={print}>Imprimir / Guardar PDF ({size})</Button>
        <p style={{ color: "#5C5C59", fontSize: 12, marginTop: 8 }}>
          En el diálogo de impresión elegí el mismo tamaño de papel ({size}) y desactivá los
          encabezados y pies de página del navegador para que salga en 1 hoja.
        </p>
      </div>
    </Card>
  );
}
