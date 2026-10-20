"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { bankDetailRows, hasBankSettings, type BankSettings } from "@/lib/bank-settings";

type FormState = Omit<BankSettings, "updatedAt">;

const textareaStyle: React.CSSProperties = {
  width: "100%",
  background: "#20201F",
  color: "#F0F0EE",
  border: "1px solid #3D3D3B",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
  resize: "vertical",
  outline: "none",
};

export function BankSettingsForm({ settings }: { settings: BankSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    holder: settings.holder,
    bank: settings.bank,
    accountType: settings.accountType,
    cbuCvu: settings.cbuCvu,
    alias: settings.alias,
    taxId: settings.taxId,
    notes: settings.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setOk(false);
  }

  const preview: BankSettings = { ...form, updatedAt: settings.updatedAt };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/admin/bank-settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudieron guardar los datos.");
      setOk(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="bank-holder">Titular de la cuenta</Label>
          <Input
            id="bank-holder"
            value={form.holder}
            onChange={(e) => set("holder", e.target.value)}
            placeholder="Nombre y apellido o razón social"
            required
          />
        </div>
        <div>
          <Label htmlFor="bank-name">Banco / billetera</Label>
          <Input
            id="bank-name"
            value={form.bank}
            onChange={(e) => set("bank", e.target.value)}
            placeholder="Ej. Brubank, Banco Nación, Mercado Pago"
            required
          />
        </div>
        <div>
          <Label htmlFor="bank-account-type">Tipo de cuenta</Label>
          <Input
            id="bank-account-type"
            value={form.accountType}
            onChange={(e) => set("accountType", e.target.value)}
            placeholder="Ej. Caja de ahorro en pesos"
          />
        </div>
        <div>
          <Label htmlFor="bank-tax-id">CUIT / CUIL</Label>
          <Input
            id="bank-tax-id"
            value={form.taxId}
            onChange={(e) => set("taxId", e.target.value)}
            placeholder="Opcional"
            inputMode="numeric"
          />
        </div>
        <div>
          <Label htmlFor="bank-alias">Alias</Label>
          <Input
            id="bank-alias"
            value={form.alias}
            onChange={(e) => set("alias", e.target.value)}
            placeholder="Ej. mi.negocio.pagos"
          />
        </div>
        <div>
          <Label htmlFor="bank-cbu">CBU / CVU</Label>
          <Input
            id="bank-cbu"
            value={form.cbuCvu}
            onChange={(e) => set("cbuCvu", e.target.value)}
            placeholder="22 dígitos"
            inputMode="numeric"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="bank-notes">Instrucciones adicionales</Label>
          <textarea
            id="bank-notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
            placeholder="Ej. Enviá el comprobante desde el mismo portal. Las transferencias se acreditan en el día."
            style={textareaStyle}
          />
        </div>
      </div>

      <p style={{ color: "#9A9A96", fontSize: 12, marginTop: 8 }}>
        Completá al menos un alias o un CBU/CVU. Estos datos se muestran a los clientes en su sección de pagos.
      </p>

      {error ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p> : null}
      {ok ? <p style={{ color: "#7AB619", fontSize: 13, marginTop: 8 }}>Datos bancarios guardados.</p> : null}

      <div style={{ marginTop: 14 }}>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar datos bancarios"}
        </Button>
      </div>

      <div style={{ marginTop: 24, borderTop: "1px solid #3D3D3B", paddingTop: 16 }}>
        <p style={{ fontSize: 12, color: "#9A9A96", fontWeight: 700 }}>VISTA PREVIA EN EL PORTAL DEL CLIENTE</p>
        {hasBankSettings(preview) ? (
          <>
            <dl className="grid gap-x-4 gap-y-2 md:grid-cols-2" style={{ marginTop: 12, fontSize: 14 }}>
              {bankDetailRows(preview).map(([label, value]) => (
                <div key={label}>
                  <dt style={{ color: "#9A9A96", fontSize: 12 }}>{label}</dt>
                  <dd style={{ fontWeight: 700, wordBreak: "break-all" }}>{value}</dd>
                </div>
              ))}
            </dl>
            {preview.notes ? (
              <p style={{ color: "#F0F0EE", fontSize: 13, marginTop: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {preview.notes}
              </p>
            ) : null}
          </>
        ) : (
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 8 }}>
            Todavía no hay alias ni CBU/CVU para mostrar.
          </p>
        )}
      </div>
    </form>
  );
}
