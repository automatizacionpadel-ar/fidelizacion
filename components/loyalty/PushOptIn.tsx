"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { subscribePush } from "@/lib/push/subscribeClient";

// Botón de respaldo para tarjetas creadas antes del alta con avisos incluidos.
// Las tarjetas nuevas ya activan los avisos en el formulario de registro.
export function PushOptIn({ cardToken }: { cardToken: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function subscribe() {
    setState("busy");
    const ok = await subscribePush(cardToken);
    setState(ok ? "done" : "error");
  }

  if (state === "done") {
    return <p style={{ fontSize: 13, color: "#7AB619", textAlign: "center" }}>🔔 Avisos activados. Te vamos a avisar de premios y novedades.</p>;
  }
  return (
    <div style={{ textAlign: "center", marginTop: 12 }}>
      <Button variant="secondary" onClick={subscribe} disabled={state === "busy"}>
        {state === "busy" ? "Activando..." : "🔔 Avisame de mis premios"}
      </Button>
      {state === "error" && (
        <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>No pudimos activar los avisos en este celu.</p>
      )}
    </div>
  );
}
