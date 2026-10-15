"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { subscribePush } from "@/lib/push/subscribeClient";

export function EnrollForm({ slug, accent }: { slug: string; accent: string }) {
  const [stage, setStage] = useState<"phone" | "new" | "existing">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; card_url: string; wallet_link: string | null; push: boolean } | null>(null);

  async function checkPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accept) {
      setError("Aceptá el uso de tus datos para sumarte.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/enroll/check?slug=${encodeURIComponent(slug)}&phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      setStage(json.registered ? "existing" : "new");
    } catch {
      setError("No pudimos verificar tu número. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(fast: boolean) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/enroll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          fast
            ? { slug, phone, website: "" }
            : { slug, name, phone, email: email || null, website: "" }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No pudimos registrarte.");
      // En el mismo gesto del alta: activar avisos (el checkbox ya lo cubre).
      // Si el celu lo bloquea, la tarjeta igual queda creada.
      const push = await subscribePush(json.card_token);
      setDone({ name: fast ? "" : name, card_url: json.card_url, wallet_link: json.wallet_link, push });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const first = done.name.split(" ")[0] || "¡Listo!";
    return (
      <div style={{ marginTop: 20, borderRadius: 12, padding: 20, background: "rgba(0,0,0,0.25)" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{done.name ? `¡Listo, ${first}! 🎉` : "¡Listo! 🎉"}</h2>
        <p style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>Tu tarjeta ya es tuya. Guardala para sumar en cada visita.</p>
        {done.push ? (
          <p style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>🔔 Avisos activados en este celu.</p>
        ) : null}
        <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
          {done.wallet_link ? (
            <a href={done.wallet_link} style={{ background: accent, color: "#20201F", fontWeight: 800, borderRadius: 12, padding: "14px 16px", textAlign: "center", minHeight: 48, display: "block", fontSize: 16 }}>
              Agregar a Google Wallet
            </a>
          ) : null}
          <a href={done.card_url} style={{ border: "1px solid currentColor", borderRadius: 12, padding: "14px 16px", textAlign: "center", fontWeight: 700, minHeight: 48, display: "block", fontSize: 16 }}>
            Ver mi tarjeta web
          </a>
          {!done.wallet_link ? (
            <p style={{ fontSize: 12, opacity: 0.7, textAlign: "center", marginTop: 4 }}>
              Wallet no configurado en este negocio — la tarjeta web funciona igual.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const consent = (
    <label style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "flex-start", marginTop: 4 }}>
      <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} style={{ marginTop: 3 }} />
      Acepto que el negocio use mis datos (nombre y teléfono) para gestionar mi tarjeta de fidelización
      y a recibir avisos de premios y novedades en este celu.
    </label>
  );

  if (stage === "existing") {
    return (
      <div style={{ marginTop: 20, borderRadius: 12, padding: 20, background: "rgba(0,0,0,0.25)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Ya estás registrado 👌</h2>
        <p style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
          Ese número ya tiene cuenta en el negocio. Obtené esta tarjeta sin completar tus datos.
        </p>
        {error && <p style={{ fontSize: 14, color: "#ffb4b4", marginTop: 8 }}>{error}</p>}
        <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
          <Button disabled={loading} onClick={() => submit(true)} style={{ background: accent, borderColor: accent }}>
            {loading ? "Generando..." : "Obtener esta tarjeta"}
          </Button>
          <Button variant="secondary" onClick={() => setStage("phone")}>
            Usar otro número
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "new") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="flex flex-col gap-3" style={{ marginTop: 20 }}>
        <p style={{ fontSize: 14, opacity: 0.85 }}>Primera vez por acá: completá tus datos una sola vez.</p>
        <div>
          <Label>Tu nombre</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Lucía Fernández" />
        </div>
        <div>
          <Label>Email (opcional)</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
        {consent}
        {error && <p style={{ fontSize: 14, color: "#ffb4b4" }}>{error}</p>}
        <Button type="submit" disabled={loading} style={{ background: accent, borderColor: accent }}>
          {loading ? "Registrando..." : "Quiero mi tarjeta"}
        </Button>
        <Button variant="secondary" onClick={() => setStage("phone")}>
          Cambiar número
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={checkPhone} className="flex flex-col gap-3" style={{ marginTop: 20 }}>
      <div>
        <Label>Celular (WhatsApp)</Label>
        <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. 11 5555 5555" inputMode="tel" />
      </div>
      {consent}
      {error && <p style={{ fontSize: 14, color: "#ffb4b4" }}>{error}</p>}
      <Button type="submit" disabled={loading} style={{ background: accent, borderColor: accent }}>
        {loading ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );
}
