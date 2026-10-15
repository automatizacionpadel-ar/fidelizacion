import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/auth/helpers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stats } from "@/components/loyalty/Stats";
import { ActivityStats } from "@/components/loyalty/ActivityStats";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar negocio del dueño
  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && !error.message.includes("Could not find")) {
    // Si la tabla no existe todavía, mostrar ayuda de setup
    if (error.message.includes("schema cache")) {
      return <SetupNeeded />;
    }
  }

  if (!business) {
    return <CreateBusinessForm ownerName={(user.user_metadata?.nombre as string) ?? ""} />;
  }

  return (
    <div>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{business.name}</h1>
        <p style={{ color: "#9A9A96", fontSize: 14 }}>Resumen de tu operación.</p>
      </div>

      <Stats />
      <ActivityStats />
    </div>
  );
}

function SetupNeeded() {
  return (
    <Card>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Falta crear las tablas 🛠️</h1>
      <p style={{ color: "#9A9A96", marginTop: 8, fontSize: 14 }}>
        Corré la migración <code>supabase/migrations/001_loyalty.sql</code> en el SQL Editor de tu
        proyecto Supabase y recargá esta página.
      </p>
    </Card>
  );
}

function CreateBusinessForm({ ownerName }: { ownerName: string }) {
  async function create(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    let slug = slugify(name);
    // Asegurar unicidad básica
    const { data: existing } = await supabase.from("businesses").select("slug").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${user.id.slice(0, 6)}`;
    const { error } = await supabase.from("businesses").insert({
      owner_user_id: user.id,
      name,
      slug,
    });
    if (!error) redirect("/panel");
  }

  return (
    <Card style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        {ownerName ? `Hola ${ownerName} 👋` : "Casi listo 👋"}
      </h1>
      <p style={{ color: "#9A9A96", marginTop: 8, fontSize: 14 }}>
        Contanos el nombre de tu negocio para crear tu espacio.
      </p>
      <form action={create} className="flex flex-col gap-3" style={{ marginTop: 16 }}>
        <input
          name="name"
          required
          placeholder="Ej. Café de barrio"
          style={{ background: "#20201F", color: "#F0F0EE", border: "1px solid #3D3D3B", borderRadius: 10, padding: "10px 12px" }}
        />
        <Button type="submit">Crear mi negocio</Button>
      </form>
    </Card>
  );
}
