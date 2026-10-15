// Normalización del logo Wallet.
//
// Google rellena de blanco las transparencias: el logo debe ser un cuadrado
// 660×660 con fondo pleno para que el círculo se mimetice con la tarjeta.
// Esta función garantiza eso SIEMPRE al publicar (no solo al subir):
// - Si el logo ya es 660×660 se usa tal cual (evita re-fundir y achicarlo).
// - Si no, se centra fundido sobre el color de fondo actual del programa en
//   un path fijo por programa (upsert: un solo archivo, siempre vigente).
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureFlatWalletLogo(
  srcUrl: string,
  bgHex: string | null | undefined,
  businessId: string,
  programId: string
): Promise<string> {
  const bg = bgHex && /^#[0-9a-fA-F]{6}$/.test(bgHex) ? bgHex : "#2A2A29";
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error("No se pudo leer el logo wallet.");
  const raw = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(raw).metadata();
  if (meta.width === 660 && meta.height === 660) return srcUrl;
  const inner = await sharp(raw)
    .resize({ width: 462, height: 462, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const innerMeta = await sharp(inner).metadata();
  const flat = await sharp({ create: { width: 660, height: 660, channels: 3, background: bg } })
    .composite([
      {
        input: inner,
        top: Math.round((660 - (innerMeta.height ?? 462)) / 2),
        left: Math.round((660 - (innerMeta.width ?? 462)) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  const admin = createAdminClient();
  const path = `${businessId}/wallet-logos/${programId}.png`;
  const { error } = await admin.storage
    .from("logos")
    .upload(path, flat, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`No se pudo normalizar el logo: ${error.message}`);
  const { data } = admin.storage.from("logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
