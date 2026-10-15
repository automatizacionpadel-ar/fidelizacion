"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { CapturePreview } from "./CapturePreview";
import { WalletPreview } from "./WalletPreview";
import { PhoneFrame } from "./PhoneFrame";
import { CARD_FONTS, CARD_TEMPLATES, CARD_TEMPLATE_IDS, type CardTemplateId, STAMP_ICON_PRESETS } from "@/lib/loyalty/cardDesign";

export type ProgramDraft = {
  id?: string;
  name: string;
  card_title: string;
  branch_id: string | null;
  card_type: "stamps" | "points";
  goal: number;
  earn_unit: "visit" | "amount_spent";
  points_per_amount: number | null;
  amount_step: number | null;
  reward_type: "free_item" | "discount_percent" | "cashback";
  reward_description: string;
  reward_value: number | null;
  terms: string;
  logo_url: string | null;
  wallet_logo_url: string | null;
  hero_image_url: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  stamp_icon: string;
  stamp_image_url: string | null;
  font_family: string;
  template: string;
  stamp_cooldown_minutes: number;
  status: string;
};

const defaults: ProgramDraft = {
  name: "",
  card_title: "",
  branch_id: null,
  card_type: "stamps",
  goal: 10,
  earn_unit: "visit",
  points_per_amount: 1,
  amount_step: 1000,
  reward_type: "free_item",
  reward_description: "",
  reward_value: null,
  terms: "",
  logo_url: null,
  wallet_logo_url: null,
  hero_image_url: null,
  background_color: "#2A2A29",
  text_color: "#F0F0EE",
  accent_color: "#7AB619",
  stamp_icon: "✓",
  stamp_image_url: null,
  font_family: "system",
  template: "moderno",
  stamp_cooldown_minutes: 5,
  status: "draft",
};

// Flujo en 5 pasos:
// 1 Tipo · 2 Reglas · 3 Captación (página web móvil /f) ·
// 4 Wallet (tarjeta de sumar en Google/Apple Wallet) · 5 Publicar.
export function ProgramForm({
  initial,
  isActive,
  businessName,
  branches,
}: {
  initial?: Partial<ProgramDraft>;
  isActive?: boolean;
  businessName?: string;
  branches?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [d, setD] = useState<ProgramDraft>({ ...defaults, ...initial });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = (k: keyof ProgramDraft, v: unknown) => setD((p) => ({ ...p, [k]: v }));
  const isPoints = d.card_type === "points";
  const unit = isPoints ? "puntos" : "sellos";

  function applyTemplate(id: CardTemplateId) {    const preset = CARD_TEMPLATES[id].preset;
    setD((p) => ({
      ...p,
      template: id,
      background_color: preset.background_color,
      text_color: preset.text_color,
      accent_color: preset.accent_color,
      font_family: preset.font_family,
    }));
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/loyalty/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir el logo.");
      set("logo_url", json.logo_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el logo.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadStamp(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "stamp");
      const res = await fetch("/api/loyalty/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
      set("stamp_image_url", json.logo_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadWalletLogo(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "wallet_logo");
      // El color de fondo viaja para fundir el logo en un cuadrado pleno:
      // Google rellena las transparencias de blanco, así el círculo se mimetiza.
      form.append("bg", d.background_color);
      const res = await fetch("/api/loyalty/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir el logo.");
      set("wallet_logo_url", json.logo_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el logo.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadHero(file: File) {    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "hero");
      const res = await fetch("/api/loyalty/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
      set("hero_image_url", json.logo_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function save(publish: boolean) {
    setSaving(true);
    setError(null);
    setOk(null);
    if (branches && branches.length > 0 && !d.branch_id) {
      setError("Elegí la sucursal de esta tarjeta en el paso 2 (Reglas).");
      setSaving(false);
      setStep(2);
      return;
    }
    try {
      const payload = { ...d, points_per_amount: d.points_per_amount, amount_step: d.amount_step, reward_value: d.reward_value };
      let id = d.id;
      if (id) {
        const res = await fetch(`/api/loyalty/programs/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo guardar.");
      } else {
        const res = await fetch("/api/loyalty/programs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo crear.");
        id = json.program.id;
        set("id", id);
      }
      if (publish && id) {
        setPublishing(true);
        const res = await fetch(`/api/loyalty/programs/${id}/publish`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo publicar.");
        setOk(json.wallet_warning ? `Publicada. Aviso: ${json.wallet_warning}` : "¡Publicada! Tu tarjeta ya está activa.");
        setPublishing(false);
      } else {
        setOk("Guardada como borrador.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
      setPublishing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        {isActive && (
          <p style={{ background: "#3B82F6", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 16 }}>
            ⚠️ Esta tarjeta está activa. Los cambios de diseño se propagan a las tarjetas emitidas; los de reglas aplican hacia adelante.
          </p>
        )}
        <Steps step={step} setStep={setStep} />

        {step === 1 && (
          <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
            <Label>Tipo de tarjeta</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <TypeOption
                active={d.card_type === "stamps"}
                title="Sellos"
                desc="Ej. comprá 10 cafés y llevate 1 gratis."
                onClick={() => set("card_type", "stamps")}
              />
              <TypeOption
                active={d.card_type === "points"}
                title="Puntos"
                desc="Ej. sumá puntos por visita o por monto gastado."
                onClick={() => set("card_type", "points")}
              />
            </div>
            <div style={{ opacity: 0.55, border: "1px dashed #3D3D3B", borderRadius: 10, padding: 12, fontSize: 14 }}>
              🎟️ Cupones — <strong>Próximamente</strong>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4" style={{ marginTop: 16 }}>
            <div>
              <Label>Sucursal (esta tarjeta solo vale acá)</Label>
              {branches && branches.length > 0 ? (
                <select
                  value={d.branch_id ?? ""}
                  onChange={(e) => set("branch_id", e.target.value || null)}
                  style={selectStyle}
                >
                  <option value="">Elegí una sucursal…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <p style={{ fontSize: 13, color: "#9A9A96", marginTop: 6 }}>
                  Primero creá una sucursal en <strong>Panel → Sucursales</strong> (aunque tengas un solo local).
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Nombre interno</Label><Input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Tarjeta café 2026" /></div>
              <div><Label>Título visible en la tarjeta</Label><Input value={d.card_title} onChange={(e) => set("card_title", e.target.value)} placeholder="Ej. Café de barrio ☕" /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Meta ({unit} para el premio)</Label>
                <Input type="number" min={2} max={10000} value={d.goal} onChange={(e) => set("goal", Number(e.target.value))} placeholder={isPoints ? "Ej. 100" : "Ej. 10"} />
              </div>
              <div>
                <Label>¿Qué suma?</Label>
                <select value={d.earn_unit} onChange={(e) => set("earn_unit", e.target.value)} style={selectStyle}>
                  <option value="visit">Cada visita suma 1 {unit === "puntos" ? "punto" : "sello"}</option>
                  <option value="amount_spent">Por monto gastado</option>
                </select>
                {d.earn_unit === "visit" && (
                  <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 6 }}>
                    Cada escaneo suma 1 {unit === "puntos" ? "punto" : "sello"}. Simple, sin montos.
                  </p>
                )}
              </div>
            </div>
            {d.earn_unit === "amount_spent" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Cada cuántos $</Label><Input type="number" min={1} value={d.amount_step ?? 1000} onChange={(e) => set("amount_step", Number(e.target.value))} /></div>
                <div><Label>Cuántos puntos otorga</Label><Input type="number" min={1} value={d.points_per_amount ?? 1} onChange={(e) => set("points_per_amount", Number(e.target.value))} /></div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tipo de premio</Label>
                <select
                  value={d.reward_type}
                  onChange={(e) => {
                    const v = e.target.value;
                    setD((p) => ({ ...p, reward_type: v as ProgramDraft["reward_type"], reward_value: v === "free_item" ? null : p.reward_value }));
                  }}
                  style={selectStyle}
                >
                  <option value="free_item">Producto / servicio gratis</option>
                  <option value="discount_percent">Descuento en %</option>
                  <option value="cashback">Cashback</option>
                </select>
              </div>
              <div><Label>Descripción del premio</Label><Input value={d.reward_description} onChange={(e) => set("reward_description", e.target.value)} placeholder="Ej. Un café gratis" /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {d.reward_type !== "free_item" && (
                <div><Label>Valor (%, $ — opcional)</Label><Input type="number" min={0} value={d.reward_value ?? ""} onChange={(e) => set("reward_value", e.target.value === "" ? null : Number(e.target.value))} placeholder="Ej. 20" /></div>
              )}
              <div><Label>Tiempo mínimo entre {unit} (min)</Label><Input type="number" min={0} max={1440} value={d.stamp_cooldown_minutes} onChange={(e) => set("stamp_cooldown_minutes", Number(e.target.value))} /></div>
            </div>
            <div><Label>Condiciones (corto)</Label><Input value={d.terms} onChange={(e) => set("terms", e.target.value)} placeholder="Ej. Válido de lunes a viernes." /></div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4" style={{ marginTop: 16 }}>
            <div
              style={{ background: "#20201F", border: "1px solid #3D3D3B", borderRadius: 10, padding: 12, fontSize: 13, color: "#9A9A96", lineHeight: 1.6 }}
            >
              📱 <strong style={{ color: "#F0F0EE" }}>Página de captación</strong> — es la web móvil
              que ve el cliente al escanear tu QR del mostrador (<code>/f/…</code>).
              Acá el diseño es libre: colores, tipografía y plantilla sí se aplican.
            </div>
            <div>
              <Label>Logo de la web (PNG/JPG/WebP, máx 2 MB)</Label>
              <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4 }}>
                Solo para la página de captación: se ve grande al 80% del ancho, vale cuadrado o rectangular.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
                style={{ fontSize: 14 }}
              />
              {uploading && <p style={{ fontSize: 13, color: "#9A9A96" }}>Subiendo...</p>}
              {d.logo_url && <p style={{ fontSize: 13, color: "#7AB619" }}>✓ Logo cargado (se reutiliza en Wallet, en chico)</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <ColorField label="Fondo" value={d.background_color} onChange={(v) => set("background_color", v)} />
              <ColorField label="Texto" value={d.text_color} onChange={(v) => set("text_color", v)} />
              <ColorField label="Acento / botón" value={d.accent_color} onChange={(v) => set("accent_color", v)} />
            </div>
            <div style={{ maxWidth: 320 }}>
              <Label>Tipografía del texto</Label>
              <select value={d.font_family} onChange={(e) => set("font_family", e.target.value)} style={selectStyle}>
                {Object.entries(CARD_FONTS).map(([key, f]) => (
                  <option key={key} value={key}>{f.label}</option>
                ))}
              </select>
              <p style={{ fontSize: 22, marginTop: 8, fontFamily: CARD_FONTS[d.font_family as keyof typeof CARD_FONTS]?.stack }}>
                Así se ve tu título ☕
              </p>
            </div>
            <div>
              <Label>Plantillas</Label>
              <p style={{ fontSize: 13, color: "#9A9A96", marginTop: 4 }}>
                Elegí un estilo como punto de partida. Se aplican sus colores y tipografía,
                y después podés seguir editando todo arriba. Solo afectan a la web, no a Wallet.
              </p>
              <div className="grid gap-3 md:grid-cols-2" style={{ marginTop: 10 }}>
                {CARD_TEMPLATE_IDS.map((id) => {
                  const tpl = CARD_TEMPLATES[id];
                  const active = d.template === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyTemplate(id)}
                      style={{
                        textAlign: "left", borderRadius: 12, padding: 12, cursor: "pointer",
                        background: active ? "#20201F" : "transparent",
                        border: active ? "2px solid #7AB619" : "1px solid #3D3D3B",
                      }}
                    >
                      <TemplateThumb id={id} />
                      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                        <strong style={{ fontSize: 14 }}>{tpl.label}</strong>
                        {active && <span style={{ fontSize: 12, color: "#7AB619", fontWeight: 800 }}>✓ Elegida</span>}
                      </div>
                      <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 2 }}>{tpl.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4" style={{ marginTop: 16 }}>
            <div
              style={{ background: "#20201F", border: "1px solid #3D3D3B", borderRadius: 10, padding: 12, fontSize: 13, color: "#9A9A96", lineHeight: 1.6 }}
            >
              💳 <strong style={{ color: "#F0F0EE" }}>Tarjeta de sumar (Wallet)</strong> — es la que
              el cliente guarda en Google Wallet / Apple Wallet para sumar {unit} en cada visita.
              La imagen se genera <strong style={{ color: "#F0F0EE" }}>por tarjeta</strong>: tu hero de fondo
              + el progreso encima (sellos, barra y premio), y se actualiza sola con cada sello.
              Un solo archivo por tarjeta, se sobrescribe — no ocupa lugar extra.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ColorField label="Fondo Wallet (único color que respetan)" value={d.background_color} onChange={(v) => set("background_color", v)} />
              <div>
                <Label>Logo Wallet cuadrado (PNG/JPG/WebP, máx 2 MB)</Label>
                <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4, lineHeight: 1.6 }}>
                  Solo para las billeteras. Ideal <strong style={{ color: "#F0F0EE" }}>PNG cuadrado 660×660</strong>:
                  Google lo recorta en círculo. Lo fundimos sobre tu color de fondo para que no aparezca
                  el círculo blanco (Google rellena las transparencias). Si no subís uno, se reutiliza el logo de la web.
                </p>
                <div className="flex gap-2 flex-wrap items-center" style={{ marginTop: 8 }}>
                  {d.wallet_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.wallet_logo_url}
                      alt="logo wallet"
                      style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid #3D3D3B", background: "#fff" }}
                    />
                  ) : null}
                  <label style={{ fontSize: 14, color: "#9A9A96", cursor: "pointer", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 12px" }}>
                    {uploading ? "Subiendo..." : d.wallet_logo_url ? "Cambiar logo Wallet" : "Subir logo cuadrado"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWalletLogo(f); }}
                    />
                  </label>
                  {d.wallet_logo_url && (
                    <button
                      type="button"
                      onClick={() => set("wallet_logo_url", null)}
                      style={{ fontSize: 13, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Usar el de la web
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Imagen hero / banner (PNG, máx 2 MB)</Label>
              <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4, lineHeight: 1.6 }}>
                Medida óptima: <strong style={{ color: "#F0F0EE" }}>PNG 1032 × 812 px (~5:4)</strong>.
                Solo PNG: es el único formato que acepta Apple Wallet.
                En Google ocupa todo el ancho de la tarjeta; en Apple se reutiliza como strip
                (banner 1125 × 432, recorte central). Sin texto dentro: no se traduce.
              </p>
              <div className="flex gap-2 flex-wrap items-center" style={{ marginTop: 8 }}>
                {d.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.hero_image_url}
                    alt="hero"
                    style={{ width: "100%", maxWidth: 320, aspectRatio: "1032/812", objectFit: "cover", borderRadius: 10, border: "1px solid #3D3D3B" }}
                  />
                ) : null}
                <label style={{ fontSize: 14, color: "#9A9A96", cursor: "pointer", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 12px" }}>
                  {uploading ? "Subiendo..." : d.hero_image_url ? "Cambiar hero" : "Subir hero 1032×812"}
                  <input
                    type="file"
                    accept="image/png"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero(f); }}
                  />
                </label>
                {d.hero_image_url && (
                  <button
                    type="button"
                    onClick={() => set("hero_image_url", null)}
                    style={{ fontSize: 13, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
            <div>
              <Label>Sello: elegí un icono o subí tu propia imagen</Label>
              <p style={{ fontSize: 12, color: "#9A9A96", marginTop: 4 }}>
                Tus sellos se dibujan encima de la hero en cada tarjeta. Si subís imagen PNG se usan tus
                iconos reales (llenos + atenuados); con emoji se dibujan círculos + números.
              </p>
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
                {STAMP_ICON_PRESETS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => { set("stamp_icon", ic); set("stamp_image_url", null); }}
                    style={{
                      width: 42, height: 42, borderRadius: 10, fontSize: 20, cursor: "pointer",
                      background: d.stamp_icon === ic && !d.stamp_image_url ? "#7AB619" : "#20201F",
                      border: d.stamp_icon === ic && !d.stamp_image_url ? "2px solid #7AB619" : "1px solid #3D3D3B",
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap items-center" style={{ marginTop: 8 }}>
                <div style={{ maxWidth: 200 }}>
                  <Input
                    value={STAMP_ICON_PRESETS.includes(d.stamp_icon) ? "" : d.stamp_icon}
                    onChange={(e) => { const v = e.target.value.slice(0, 4); if (v) { set("stamp_icon", v); set("stamp_image_url", null); } }}
                    placeholder="O escribí tu emoji acá"
                  />
                </div>
                <label style={{ fontSize: 14, color: "#9A9A96", cursor: "pointer", border: "1px solid #3D3D3B", borderRadius: 10, padding: "8px 12px" }}>
                  {uploading ? "Subiendo..." : d.stamp_image_url ? "Cambiar imagen (solo web)" : "Subir imagen (solo web)"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStamp(f); }}
                  />
                </label>
                {d.stamp_image_url && (
                  <button
                    type="button"
                    onClick={() => set("stamp_image_url", null)}
                    style={{ fontSize: 13, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
              {d.stamp_image_url && (
                <p style={{ fontSize: 13, color: "#7AB619", marginTop: 6 }}>✓ Imagen cargada (solo se ve en la web, en Wallet se usa el icono)</p>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ marginTop: 16, fontSize: 15 }}>
            <h3 style={{ fontWeight: 800 }}>Revisá y publicá</h3>
            <ul style={{ color: "#9A9A96", marginTop: 8, lineHeight: 1.7 }}>
              <li><strong style={{ color: "#F0F0EE" }}>{d.card_title || "—"}</strong> ({d.card_type === "stamps" ? "sellos" : "puntos"})</li>
              <li>Meta: {d.goal} · Suma por: {d.earn_unit === "visit" ? "visita" : `monto (cada $${d.amount_step} = ${d.points_per_amount} pts)`}</li>
              <li>Premio: {d.reward_description || "—"}</li>
              <li>Cooldown: {d.stamp_cooldown_minutes} min</li>
            </ul>
            <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 8 }}>
              Al publicar se crea/actualiza la clase en Google Wallet (si está configurado) y la tarjeta queda activa.
              Apple Wallet aún no está conectado: el cliente usa la tarjeta web como respaldo.
            </p>
          </div>
        )}

        {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 12 }}>{error}</p>}
        {ok && <p style={{ color: "#7AB619", fontSize: 14, marginTop: 12 }}>{ok}</p>}

        <div className="flex gap-2 flex-wrap" style={{ marginTop: 20 }}>
          {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Atrás</Button>}
          {step < 5 && <Button onClick={() => setStep(step + 1)}>Seguir</Button>}
          {step === 5 && (
            <>
              <Button variant="secondary" disabled={saving} onClick={() => save(false)}>
                {saving ? "Guardando..." : "Guardar borrador"}
              </Button>
              <Button disabled={saving || publishing} onClick={() => save(true)}>
                {publishing ? "Publicando..." : "Publicar"}
              </Button>
            </>
          )}
        </div>
      </Card>

      <div>
        {step === 4 ? (
          <>
            <p style={{ color: "#5C5C59", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>VISTA PREVIA · WALLET</p>
            <WalletPreview
              businessName={businessName}
              cardTitle={d.card_title}
              cardType={d.card_type}
              goal={d.goal}
              rewardDescription={d.reward_description}
              backgroundColor={d.background_color}
              logoUrl={d.logo_url}
              walletLogoUrl={d.wallet_logo_url}
              heroImageUrl={d.hero_image_url}
              stampIcon={d.stamp_icon}
              stampImageUrl={d.stamp_image_url}
            />
          </>
        ) : (
          <PhoneFrame label={step === 3 ? "Vista previa · captación (/f)" : "Vista previa en vivo · captación"} >
            <CapturePreview
              businessName={businessName}
              cardTitle={d.card_title}
              cardType={d.card_type}
              goal={d.goal}
              rewardDescription={d.reward_description}
              terms={d.terms}
              backgroundColor={d.background_color}
              textColor={d.text_color}
              accentColor={d.accent_color}
              logoUrl={d.logo_url}
              fontFamily={d.font_family}
            />
          </PhoneFrame>
        )}
      </div>
    </div>
  );
}

function Steps({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  const labels = ["Tipo", "Reglas", "Captación", "Wallet", "Publicar"];
  return (
    <div className="flex gap-2 flex-wrap">
      {labels.map((l, i) => (
        <button
          key={l}
          onClick={() => setStep(i + 1)}
          style={{
            flex: 1, minWidth: 80, borderRadius: 8, padding: "8px 4px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: step === i + 1 ? "#7AB619" : "#20201F",
            color: step === i + 1 ? "#20201F" : "#9A9A96",
            border: "1px solid #3D3D3B",
          }}
        >
          {i + 1}. {l}
        </button>
      ))}
    </div>
  );
}

function TemplateThumb({ id }: { id: CardTemplateId }) {
  const preset = CARD_TEMPLATES[id].preset;
  const base: React.CSSProperties = {
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const sample = (
    <span style={{ fontWeight: 800, fontSize: 18, color: preset.text_color, position: "relative", zIndex: 1 }}>
      Aa
    </span>
  );
  if (id === "clasico") {
    return (
      <div style={{ ...base, background: preset.background_color, border: `2px solid ${preset.accent_color}`, outline: `1px solid ${preset.accent_color}66`, outlineOffset: -6 }}>
        {sample}
      </div>
    );
  }
  if (id === "glass") {
    return (
      <div style={{ ...base, background: `linear-gradient(135deg, ${preset.accent_color}88, ${preset.background_color} 60%, #7c3aed66)`, border: "1px solid rgba(255,255,255,0.4)" }}>
        <div style={{ position: "absolute", inset: 8, borderRadius: 8, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }} />
        {sample}
      </div>
    );
  }
  if (id === "futurista") {
    return (
      <div style={{ ...base, background: preset.background_color, border: `1px solid ${preset.accent_color}`, boxShadow: `0 0 14px ${preset.accent_color}88, inset 0 0 14px ${preset.accent_color}33` }}>
        {sample}
      </div>
    );
  }
  return (
    <div style={{ ...base, background: preset.background_color, border: "1px solid #3D3D3B" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: preset.accent_color }} />
      {sample}
    </div>
  );
}

function TypeOption({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", borderRadius: 10, padding: 14, cursor: "pointer",
        background: active ? "#20201F" : "transparent",
        border: active ? "2px solid #7AB619" : "1px solid #3D3D3B",
      }}
    >
      <strong>{title}</strong>
      <p style={{ color: "#9A9A96", fontSize: 13, marginTop: 4 }}>{desc}</p>
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 44, height: 36, cursor: "pointer", background: "none", border: "1px solid #3D3D3B", borderRadius: 8 }} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%", background: "#20201F", color: "#F0F0EE",
  border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 16,
};
