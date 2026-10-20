import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function SuspendedAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div style={{ background: "#20201F", minHeight: "100vh" }}>
      <div className="w-[92%] mx-auto" style={{ maxWidth: 520, paddingTop: 64 }}>
        <Card>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#f87171" }}>CUENTA SUSPENDIDA</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
            Tu acceso está pausado
          </h1>
          <p style={{ color: "#9A9A96", fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>
            El acceso a esta cuenta fue suspendido por la administración de la plataforma.
            Si creés que es un error o necesitás reactivarla, contactá a soporte.
          </p>
          <form action={signOut} style={{ marginTop: 20 }}>
            <Button type="submit" variant="secondary">Cerrar sesión</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
