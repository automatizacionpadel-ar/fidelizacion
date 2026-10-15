"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMsg("Te mandamos un email para recuperar tu contraseña. Revisá tu bandeja.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh" }}>
      <div className="w-[90%] mx-auto" style={{ maxWidth: 480, paddingTop: 64 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Recuperar contraseña</h1>
        <Card style={{ marginTop: 24 }}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@tunegocio.com" />
            </div>
            {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
            {msg && <p style={{ color: "#7AB619", fontSize: 14 }}>{msg}</p>}
            <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar email"}</Button>
          </form>
        </Card>
        <p style={{ color: "#9A9A96", marginTop: 16, fontSize: 14 }}>
          <Link href="/login" style={{ color: "#7AB619", fontWeight: 700 }}>Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
