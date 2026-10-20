import { NextResponse } from "next/server";

export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).host === new URL(req.url).host) return null;
  } catch {
    // sigue abajo
  }
  return NextResponse.json({ error: "Origen inválido." }, { status: 403 });
}
