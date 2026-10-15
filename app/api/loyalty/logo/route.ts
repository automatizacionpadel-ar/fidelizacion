import { NextResponse } from "next/server";
import sharp from "sharp";
import { getMyBusiness } from "@/lib/loyalty/business";
import { createAdminClient } from "@/lib/supabase/admin";

// Compresión server-side con sharp: las imágenes que sube el negocio
// (logos, sellos, heroes) se redimensionan a su medida óptima y se
// recomprimen sin pérdida visible, para que pesen poco en /f, /t y Wallet.
//
// Logo Wallet: Google NO respeta transparencias (rellena de blanco y pide
// un cuadrado con fondo pleno). Si viene bgHex, el logo se centra fundido
// sobre un cuadrado 660×660 de ese color: el círculo de Wallet se mimetiza
// con la tarjeta y no aparece el fondo blanco.
async function optimize(buf: Buffer, kind: "logo" | "stamp" | "hero" | "wallet_logo", mime: string, bgHex?: string): Promise<{ buf: Buffer; ext: string }> {
  if (kind === "wallet_logo" && bgHex && /^#[0-9a-fA-F]{6}$/.test(bgHex)) {
    const inner = await sharp(buf)
      .resize({ width: 462, height: 462, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const meta = await sharp(inner).metadata();
    const flat = await sharp({
      create: { width: 660, height: 660, channels: 3, background: bgHex },
    })
      .composite([{ input: inner, top: Math.round((660 - (meta.height ?? 462)) / 2), left: Math.round((660 - (meta.width ?? 462)) / 2) }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { buf: flat, ext: "png" };
  }
  const base =
    kind === "hero"
      ? sharp(buf).resize({ width: 1032, height: 812, fit: "inside", withoutEnlargement: true })
      : kind === "stamp"
        ? sharp(buf).resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
        : sharp(buf).resize({ width: 660, height: 660, fit: "inside", withoutEnlargement: true });
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  if (mime === "image/png") return { buf: await base.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(), ext };
  if (mime === "image/webp") return { buf: await base.webp({ quality: 82 }).toBuffer(), ext };
  return { buf: await base.jpeg({ quality: 82, mozjpeg: true }).toBuffer(), ext };
}

export async function POST(req: Request) {
  const { user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const rawKind = form?.get("kind");
  const kind = rawKind === "stamp" ? "stamp" : rawKind === "hero" ? "hero" : rawKind === "wallet_logo" ? "wallet_logo" : "logo";
  const label = kind === "stamp" ? "una imagen" : kind === "hero" ? "una imagen hero" : kind === "wallet_logo" ? "un logo cuadrado" : "un logo";
  if (!file) return NextResponse.json({ error: `Subí ${label}.` }, { status: 400 });
  // La hero viaja a Apple Wallet, que solo acepta PNG.
  if (kind === "hero" && file.type !== "image/png")
    return NextResponse.json({ error: "La hero tiene que ser PNG (es el único formato que acepta Apple Wallet)." }, { status: 400 });
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    return NextResponse.json({ error: "Tiene que ser PNG, JPG o WebP." }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "No puede pesar más de 2 MB." }, { status: 400 });

  const admin = createAdminClient();
  const bgHex = typeof form?.get("bg") === "string" ? (form.get("bg") as string) : undefined;
  const raw = Buffer.from(await file.arrayBuffer());
  // Si sharp falla con un archivo raro, se sube el original sin romper.
  const optimized = await optimize(raw, kind, file.type, bgHex).catch(() => ({ buf: raw, ext: file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg" }));
  const { buf, ext } = optimized;
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const path =
    kind === "stamp"
      ? `${business.id}/stamps/${Date.now()}.${ext}`
      : kind === "hero"
        ? `${business.id}/heroes/${Date.now()}.${ext}`
        : kind === "wallet_logo"
          ? `${business.id}/wallet-logos/${Date.now()}.${ext}`
          : `${business.id}/${Date.now()}.${ext}`;
  const { error } = await admin.storage.from("logos").upload(path, buf, { contentType: mime, upsert: false });
  if (error) {
    // Si el bucket no existe, mensaje claro
    return NextResponse.json({ error: `No se pudo subir: ${error.message} (creá el bucket público "logos" en Supabase Storage).` }, { status: 400 });
  }
  const { data } = admin.storage.from("logos").getPublicUrl(path);
  return NextResponse.json({ logo_url: data.publicUrl });
}
