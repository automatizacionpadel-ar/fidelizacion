"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import type { ReferralAlly } from "@/lib/auth/referrals";

export function RegisterForm({ referral }: { referral: ReferralAlly | null }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            negocio,
            ...(referral ? { aliado_id: referral.id } : {}),
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("No se pudo crear tu cuenta. Probá de nuevo.");
      router.push("/panel");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh" }}>
      <div className="w-[90%] mx-auto" style={{ maxWidth: 480, paddingTop: 64 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Creá tu cuenta</h1>
        <p style={{ color: "#9A9A96", marginTop: 8 }}>
          Registrá tu negocio y empezá a fidelizar hoy mismo.
        </p>

        {referral ? (
          <div
            style={{
              marginTop: 16,
              background: "#2A2A29",
              border: "1px solid #7AB619",
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Te registrás con <strong style={{ color: "#7AB619" }}>{referral.name}</strong>.
            Al crear tu negocio, quedará asociado a su cartera.
          </div>
        ) : null}

        <Card style={{ marginTop: referral ? 16 : 24 }}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Martín Gómez" />
            </div>
            <div>
              <Label htmlFor="negocio">Nombre del negocio</Label>
              <Input id="negocio" required value={negocio} onChange={(e) => setNegocio(e.target.value)} placeholder="Ej. Café de barrio" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@tunegocio.com" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear mi cuenta"}
            </Button>
          </form>
        </Card>
        <p style={{ color: "#9A9A96", marginTop: 16, fontSize: 14 }}>
          ¿Ya tenés cuenta? <Link href="/login" style={{ color: "#7AB619", fontWeight: 700 }}>Entrá acá</Link>
        </p>
      </div>
    </div>
  );
}
