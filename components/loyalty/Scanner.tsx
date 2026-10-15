"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type FoundCard = {
  id: string;
  balance: number;
  rewards_available: number;
  token?: string;
  program_id: string;
  loyalty_programs: { card_title: string; card_type: string; goal: number; status: string; earn_unit: string; branch_id: string | null; branches: { name: string } | null };
  loyalty_members: { name: string; phone: string };
};

const BRANCH_KEY = "scanner-branch";

export function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [cards, setCards] = useState<FoundCard[]>([]);
  const [selected, setSelected] = useState<FoundCard | null>(null);
  const [lookupSource, setLookupSource] = useState<"scan" | "phone_lookup">("scan");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    try {
      setBranchId(window.localStorage.getItem(BRANCH_KEY) ?? "");
    } catch {}
    fetch("/api/loyalty/branches")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setBranches(j.branches ?? []))
      .catch(() => {});
  }, []);

  function pickBranch(id: string) {
    setBranchId(id);
    try {
      window.localStorage.setItem(BRANCH_KEY, id);
    } catch {}
  }

  // Las tarjetas valen solo en su sucursal. Legacy sin sucursal vale en todas.
  function branchBlocker(card: FoundCard): string | null {
    const cardBranch = card.loyalty_programs.branch_id;
    if (cardBranch && cardBranch !== branchId) {
      const name = card.loyalty_programs.branches?.name ?? "otra sucursal";
      return `Esta tarjeta es de ${name}. Cambiá a esa sucursal para operar.`;
    }
    return null;
  }

  async function startCamera() {
    setError(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const elId = "qr-reader";
      await new Promise((r) => setTimeout(r, 50));
      const qr = new Html5Qrcode(elId);
      scannerRef.current = qr as unknown as { stop: () => Promise<void> };
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded: string) => {
          setToken(decoded);
          stopCamera();
          lookupByToken(decoded);
        },
        () => {}
      );
    } catch {
      setError("No pudimos abrir la cámara. Usá la búsqueda por teléfono.");
      setScanning(false);
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
    } catch {}
    setScanning(false);
  }

  async function lookupByToken(t: string) {
    setError(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/loyalty/cards/lookup?token=${encodeURIComponent(t)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No encontramos esa tarjeta.");
      const c = { ...json.card, token: t } as FoundCard;
      setCards([c]);
      setSelected(c);
      setLookupSource("scan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al buscar.");
    } finally {
      setBusy(false);
    }
  }

  async function lookupByPhone() {
    setError(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/loyalty/cards/lookup?phone=${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No encontramos a ese cliente.");
      setCards(json.cards ?? []);
      setSelected(json.cards?.[0] ?? null);
      setLookupSource("phone_lookup");
      if ((json.cards ?? []).length === 0) setError("Ese teléfono no tiene tarjetas todavía.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al buscar.");
    } finally {
      setBusy(false);
    }
  }

  async function earn() {
    if (!selected) return;
    const blocked = branchBlocker(selected);
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/loyalty/earn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          card_id: selected.id,
          amount_spent: amount ? Number(amount) : null,
          source: lookupSource,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo sumar.");
      setSelected({ ...selected, balance: json.balance, rewards_available: json.rewards_available });
      setMsg(json.won > 0 ? `¡Premio ganado! 🎉 (${json.balance} de ${json.goal})` : `Sumado ✅ (${json.balance} de ${json.goal})`);
      setAmount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo sumar.");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!selected) return;
    const blocked = branchBlocker(selected);
    if (blocked) {
      setError(blocked);
      return;
    }
    if (!confirm("¿Canjear 1 premio de este cliente?")) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ card_id: selected.id, source: "scan" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo canjear.");
      setSelected({ ...selected, rewards_available: json.rewards_available });
      setMsg("Premio canjeado ✅");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo canjear.");
    } finally {
      setBusy(false);
    }
  }

  async function resync() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/loyalty/cards/${selected.id}/resync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falló la sincronización.");
      setMsg("Wallet sincronizada ✅ (reabrí Google Wallet en unos minutos)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falló la sincronización.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#9A9A96" }}>Sucursal activa (este mostrador)</p>
        {branches.length > 0 ? (
          <select
            value={branchId}
            onChange={(e) => pickBranch(e.target.value)}
            style={{ width: "100%", background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px", fontSize: 15, marginTop: 6 }}
          >
            <option value="">Elegí la sucursal…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <p style={{ fontSize: 13, color: "#9A9A96", marginTop: 6 }}>
            Sin sucursales: crealas en <strong>Panel → Sucursales</strong>.
          </p>
        )}
      </Card>
      <Card>
        {!scanning ? (
          <Button onClick={startCamera} style={{ width: "100%", padding: 14, fontSize: 16 }}>📷 Abrir cámara</Button>
        ) : (
          <Button variant="secondary" onClick={stopCamera} style={{ width: "100%" }}>Cerrar cámara</Button>
        )}
        <div id="qr-reader" style={{ marginTop: scanning ? 12 : 0 }} />
        <div className="flex gap-2" style={{ marginTop: 12 }}>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="O pegá el token del QR" />
          <Button variant="secondary" disabled={!token || busy} onClick={() => lookupByToken(token)}>Buscar</Button>
        </div>
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Buscar por teléfono" inputMode="tel" />
          <Button variant="secondary" disabled={!phone || busy} onClick={lookupByPhone}>Buscar</Button>
        </div>
      </Card>

      {cards.length > 1 && (
        <Card>
          <p style={{ fontSize: 13, color: "#9A9A96" }}>Este cliente tiene varias tarjetas:</p>
          <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer",
                  background: selected?.id === c.id ? "#7AB619" : "#20201F",
                  color: selected?.id === c.id ? "#20201F" : "#F0F0EE",
                  border: "1px solid #3D3D3B", fontWeight: 700,
                }}
              >
                {c.loyalty_programs.card_title}
                {c.loyalty_programs.branches?.name ? ` · ${c.loyalty_programs.branches.name}` : ""}
              </button>
            ))}
          </div>
        </Card>
      )}

      {selected && (
        <Card>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selected.loyalty_members.name}</h2>
          <p style={{ color: "#9A9A96", fontSize: 14 }}>
            {selected.loyalty_programs.card_title} · {selected.balance} de {selected.loyalty_programs.goal} · 🏆 {selected.rewards_available} premio(s)
            {selected.loyalty_programs.branches?.name ? ` · 📍 ${selected.loyalty_programs.branches.name}` : ""}
          </p>
          {selected.loyalty_programs.earn_unit === "amount_spent" && (
            <div style={{ marginTop: 12 }}>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto de la compra ($)" inputMode="decimal" type="number" min={0} />
            </div>
          )}
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <Button onClick={earn} disabled={busy} style={{ flex: 1, padding: 14, fontSize: 17 }}>
              {selected.loyalty_programs.card_type === "stamps" ? "Sumar sello" : "Sumar puntos"}
            </Button>
            {selected.rewards_available > 0 && (
              <Button onClick={redeem} disabled={busy} variant="secondary" style={{ flex: 1, padding: 14, fontSize: 17 }}>
                Canjear premio
              </Button>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <Button onClick={resync} disabled={busy} variant="secondary" style={{ width: "100%" }}>
              Sincronizar Wallet
            </Button>
          </div>
        </Card>
      )}

      {msg && <p style={{ color: "#7AB619", fontWeight: 700, fontSize: 16, textAlign: "center" }}>{msg}</p>}
      {error && <p style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{error}</p>}
    </div>
  );
}
