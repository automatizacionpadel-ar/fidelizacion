import { ProgramForm } from "@/components/loyalty/ProgramForm";

export const dynamic = "force-dynamic";

export default function NuevoProgramaPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Crear tarjeta</h1>
      <p style={{ color: "#9A9A96", fontSize: 14, marginBottom: 20 }}>Completá los pasos y publicá cuando esté lista.</p>
      <ProgramForm />
    </div>
  );
}
