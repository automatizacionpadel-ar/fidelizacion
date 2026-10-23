"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/auth/continue");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No pudimos entrar. Revisá tus datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh" }}>
      <div className="w-[90%] mx-auto" style={{ maxWidth: 480, paddingTop: 64, paddingBottom: 64 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 32 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "#7AB619",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#20201F",
            }}
          >
            F
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#F0F0EE" }}>
            Fidelización
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Hola de nuevo 👋</h1>
        <p style={{ color: "#9A9A96", marginTop: 8 }}>
          Entrá con tus credenciales de cliente, aliado o administrador.
        </p>
        <Card style={{ marginTop: 24 }}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@tunegocio.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
              />
            </div>
            {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
        <p style={{ color: "#9A9A96", marginTop: 16, fontSize: 14 }}>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" style={{ color: "#7AB619", fontWeight: 700 }}>
            Registrate
          </Link>
          {" · "}
          <Link href="/recuperar-contrasena" style={{ color: "#7AB619", fontWeight: 700 }}>
            Olvidé mi contraseña
          </Link>
        </p>
      </div>
    </div>
  );
}
