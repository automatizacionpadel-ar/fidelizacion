import { NextResponse } from "next/server";
import sharp from "sharp";
import { getMyBusiness } from "@/lib/loyalty/business";
import { createAdminClient } from "@/lib/supabase/admin";

// Compresión server-side con sharp: las imágenes que sube el negocio
// (logos, sellos, heroes) se redimensionan a su medida óptima y se
// recomprimen sin pérdida visible, para que pesen poco en /f, /t y Wallet.
async function optimize(buf: Buffer, kind: "logo" | "stamp" | "hero", mime: string): Promise<Buffer> {
  const base =
    kind === "hero"
      ? sharp(buf).resize({ width: 1032, height: 812, fit: "inside", withoutEnlargement: true })
      : kind === "logo"
        ? sharp(buf).resize({ width: 660, height: 660, fit: "inside", withoutEnlargement: true })
        : sharp(buf).resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true });
  if (mime === "image/png") return base.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  if (mime === "image/webp") return base.webp({ quality: 82 }).toBuffer();
  return base.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

export async function POST(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const rawKind = form?.get("kind");
  const kind = rawKind === "stamp" ? "stamp" : rawKind === "hero" ? "hero" : "logo";
  const label = kind === "stamp" ? "una imagen" : kind === "hero" ? "una imagen hero" : "un logo";
  if (!file) return NextResponse.json({ error: `Subí ${label}.` }, { status: 400 });
  // La hero viaja a Apple Wallet, que solo acepta PNG.
  if (kind === "hero" && file.type !== "image/png")
    return NextResponse.json({ error: "La hero tiene que ser PNG (es el único formato que acepta Apple Wallet)." }, { status: 400 });
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    return NextResponse.json({ error: "Tiene que ser PNG, JPG o WebP." }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "No puede pesar más de 2 MB." }, { status: 400 });

  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path =
    kind === "stamp"
      ? `${business.id}/stamps/${Date.now()}.${ext}`
      : kind === "hero"
        ? `${business.id}/heroes/${Date.now()}.${ext}`
        : `${business.id}/${Date.now()}.${ext}`;
  const raw = Buffer.from(await file.arrayBuffer());
  // Si sharp falla con un archivo raro, se sube el original sin romper.
  const buf = await optimize(raw, kind, file.type).catch(() => raw);
  const { error } = await admin.storage.from("logos").upload(path, buf, { contentType: file.type, upsert: false });
  if (error) {
    // Si el bucket no existe, mensaje claro
    return NextResponse.json({ error: `No se pudo subir: ${error.message} (creá el bucket público "logos" en Supabase Storage).` }, { status: 400 });
  }
  const { data } = admin.storage.from("logos").getPublicUrl(path);
  return NextResponse.json({ logo_url: data.publicUrl });
}
