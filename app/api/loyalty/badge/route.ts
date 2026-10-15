import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

// Insignia de notificación personalizada por programa (pública: la descarga
// el celu al mostrar el aviso, fuera de sesión).
// Usa la forma (alfa) de la imagen de sello del negocio en blanco sólido:
// Android tiñe la insignia en monocromo sí o sí, así la silueta del café
// queda en blanco y se distingue del icono de Chrome.
// Si el sello no tiene transparencia (fondo pleno) no sirve como silueta
// y se responde 404 para que el service worker use la insignia genérica.
export async function GET(req: Request) {
  const programId = new URL(req.url).searchParams.get("program_id");
  if (!programId) return new NextResponse("Falta program_id.", { status: 400 });
  const admin = createAdminClient();
  const { data: program } = await admin
    .from("loyalty_programs")
    .select("stamp_image_url")
    .eq("id", programId)
    .maybeSingle();
  const src = program?.stamp_image_url as string | null;
  if (!src) return new NextResponse("Sin sello.", { status: 404 });
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error("fetch");
    const raw = Buffer.from(await res.arrayBuffer());
    const S = 96;
    const { data, info } = await sharp(raw)
      .resize({ width: Math.round(S * 0.8), height: Math.round(S * 0.8), fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // ¿Tiene transparencia real para recortar silueta?
    let transparent = 0;
    for (let k = 3; k < data.length; k += 4) if (data[k] < 128) transparent++;
    if (transparent < data.length / 4 / 20) return new NextResponse("Sin silueta.", { status: 404 });
    // Lienzo 96×96 centrado + todo blanco conservando el alfa original.
    const dx = Math.round((S - info.width) / 2);
    const dy = Math.round((S - info.height) / 2);
    const canvas = Buffer.alloc(S * S * 4, 0);
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const si = (y * info.width + x) * 4;
        const di = ((dy + y) * S + (dx + x)) * 4;
        canvas[di] = 255;
        canvas[di + 1] = 255;
        canvas[di + 2] = 255;
        canvas[di + 3] = data[si + 3];
      }
    }
    const png = await sharp(canvas, { raw: { width: S, height: S, channels: 4 } }).png().toBuffer();
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("Falló la insignia.", { status: 500 });
  }
}
