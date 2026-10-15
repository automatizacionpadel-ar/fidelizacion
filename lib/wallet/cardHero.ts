// Hero dinámica por tarjeta para Google Wallet.
//
// Cada tarjeta tiene UN solo archivo que se sobrescribe:
//   logos/cards/{cardId}.png  (upsert, nunca se acumulan versiones)
// El storage crece con la cantidad de tarjetas activas, no con los sellos.
//
// Qué se dibuja (1032×812, la medida óptima de Google):
// - Fondo: la hero que subió el negocio (cover) con degradado para legibilidad,
//   o el color de fondo del programa si no hay hero.
// - Encima: progreso SOLO con los iconos del programa en grilla centrada —
//   si hay imagen de sello custom se componen los PNG reales (llenos +
//   atenuados); si hay emoji, en servidor no hay fuente emoji así que se
//   dibujan círculos vectoriales. Sin números ni barra. Abajo: premio y
//   banner de premios por canjear.
//
// El texto Progreso/Premios deja de mandarse como módulos de texto del objeto:
// ahora vive dentro de esta imagen. Se pasa a Wallet con ?v=timestamp para
// saltear el caché de imágenes de Google sin crear archivos nuevos.
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export type CardHeroInput = {
  cardId: string;
  backgroundColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
  cardTitle: string;
  cardType: "stamps" | "points";
  goal: number;
  balance: number;
  rewardsAvailable: number;
  rewardDescription?: string | null;
  stampImageUrl?: string | null;
  baseHeroUrl?: string | null;
};

const W = 1032;
const H = 812;
const MAX_STAMPS_ROW = 12;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    if (!ab.byteLength || ab.byteLength > 2 * 1024 * 1024) return null;
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

export async function renderCardHero(i: CardHeroInput): Promise<Buffer> {
  const goal = Math.max(1, i.goal);
  const done = Math.max(0, Math.min(i.balance, goal));
  const accent = i.accentColor || "#7AB619";
  const title = (i.cardTitle || "Tu tarjeta").slice(0, 40);
  const reward = (i.rewardDescription || "").slice(0, 60);
  // El progreso se refleja SOLO con los iconos: imagen de sello real si el
  // negocio subió una, o círculos vectoriales si usa emoji/texto.
  // Sin números ni barra. Sellos: filas de 5 que abarcan el 80% del ancho,
  // centradas vertical y horizontalmente. Puntos: grilla adaptativa.
  const GRID_W = Math.round(W * 0.8);
  const GRID_TOP = 180;
  const GRID_BOTTOM = 640;
  const gap = 16;
  const cols =
    i.cardType === "points"
      ? goal <= MAX_STAMPS_ROW
        ? goal
        : goal <= 40
          ? 10
          : 20
      : Math.min(goal, 5);
  const rows = Math.ceil(goal / cols);
  const cellByWidth = Math.floor((GRID_W - (cols - 1) * gap) / cols);
  const cellByHeight = Math.floor((GRID_BOTTOM - GRID_TOP - (rows - 1) * gap) / rows);
  const cell = Math.max(16, Math.min(160, cellByWidth, cellByHeight));
  const gridH = rows * cell + (rows - 1) * gap;
  const y0 = Math.round(GRID_TOP + (GRID_BOTTOM - GRID_TOP - gridH) / 2);

  // 1. Base: hero del negocio (cover) o color sólido.
  let baseBuf: Buffer;
  let hasBase = false;
  if (i.baseHeroUrl) {
    const raw = await fetchBuffer(i.baseHeroUrl);
    if (raw) {
      try {
        baseBuf = await sharp(raw).resize(W, H, { fit: "cover" }).png().toBuffer();
        hasBase = true;
      } catch {
        baseBuf = await sharp({
          create: { width: W, height: H, channels: 3, background: i.backgroundColor || "#2A2A29" },
        }).png().toBuffer();
      }
    } else {
      baseBuf = await sharp({
        create: { width: W, height: H, channels: 3, background: i.backgroundColor || "#2A2A29" },
      }).png().toBuffer();
    }
  } else {
    baseBuf = await sharp({
      create: { width: W, height: H, channels: 3, background: i.backgroundColor || "#2A2A29" },
    }).png().toBuffer();
  }
  const fg = hasBase ? "#FFFFFF" : i.textColor || "#F0F0EE";
  const FONT = "DejaVu Sans, sans-serif";

  // 2. Grilla de círculos vectoriales (solo cuando el sello es emoji/texto).
  // Cada fila se centra: las incompletas (ej. 12 sellos → 5+5+2) quedan al medio.
  const useStampImages = !!i.stampImageUrl;
  let circles = "";
  if (!useStampImages) {
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(cols, goal - r * cols);
      const rowW = inRow * cell + (inRow - 1) * gap;
      const x0 = (W - rowW) / 2 + cell / 2;
      const cy = y0 + r * (cell + gap) + cell / 2;
      for (let k = 0; k < inRow; k++) {
        const idx = r * cols + k;
        const cx = x0 + k * (cell + gap);
        circles +=
          idx < done
            ? `<circle cx="${cx}" cy="${cy}" r="${cell / 2}" fill="${accent}"/>`
            : `<circle cx="${cx}" cy="${cy}" r="${cell / 2}" fill="none" stroke="${fg}" stroke-opacity="0.45" stroke-width="3"/>`;
      }
    }
  }

  const rewardsBanner =
    i.rewardsAvailable > 0
      ? `<rect x="64" y="722" width="560" height="64" rx="14" fill="${accent}"/>
         <text x="92" y="765" font-family="${FONT}" font-size="34" font-weight="bold" fill="#20201F">${i.rewardsAvailable} PREMIO${i.rewardsAvailable > 1 ? "S" : ""} PARA CANJEAR</text>`
      : "";

  const overlay = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${hasBase ? `<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.55" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sh)"/>` : ""}
  <text x="64" y="104" font-family="${FONT}" font-size="38" font-weight="bold" letter-spacing="3" fill="${fg}" opacity="0.85">${esc(title.toUpperCase())}</text>
  ${circles}
  <text x="64" y="700" font-family="${FONT}" font-size="36" fill="${fg}">Premio: ${esc(reward || "—")}</text>
  ${rewardsBanner}
</svg>`;

  let composed = sharp(baseBuf).composite([{ input: Buffer.from(overlay), top: 0, left: 0 }]);

  // 3. Iconos reales del negocio (imagen de sello) encima de la hero,
  // en la misma grilla. Llenos a todo color, pendientes atenuados.
  if (useStampImages) {
    const raw = await fetchBuffer(i.stampImageUrl!);
    if (raw) {
      try {
        const full = await sharp(raw).resize(cell, cell, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
        const empty = await sharp(raw).resize(cell, cell, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).composite([{ input: Buffer.from(`<svg width="${cell}" height="${cell}"><rect width="${cell}" height="${cell}" fill="#fff" opacity="0.55"/></svg>`) }]).png().toBuffer();
        const parts: { input: Buffer; top: number; left: number }[] = [];
        for (let r = 0; r < rows; r++) {
          const inRow = Math.min(cols, goal - r * cols);
          const rowW = inRow * cell + (inRow - 1) * gap;
          const x0 = Math.round((W - rowW) / 2);
          const top = Math.round(y0 + r * (cell + gap));
          for (let k = 0; k < inRow; k++) {
            const idx = r * cols + k;
            parts.push({ input: idx < done ? full : empty, top, left: x0 + k * (cell + gap) });
          }
        }
        composed = composed.composite(parts);
      } catch {
        // Si la imagen de sello falla, queda la base + premio. No se rompe nada.
      }
    }
  }

  return composed.png({ compressionLevel: 9 }).toBuffer();
}

// Regenera y sube (sobrescribe) la hero de una tarjeta. Devuelve la URL
// pública con ?v= para saltear el caché de Google sin crear archivos nuevos.
export async function refreshCardHeroImage(i: CardHeroInput): Promise<string> {
  const admin = createAdminClient();
  const png = await renderCardHero(i);
  const path = `cards/${i.cardId}.png`;
  const { error } = await admin.storage
    .from("logos")
    .upload(path, png, { contentType: "image/png", upsert: true, cacheControl: "3600" });
  if (error) throw new Error(`No se pudo subir la hero: ${error.message}`);
  const { data } = admin.storage.from("logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
