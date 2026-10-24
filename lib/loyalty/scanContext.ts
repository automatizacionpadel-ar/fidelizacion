import { headers } from "next/headers";

// Datos de origen del escaneo automático (QR/NFC). En Vercel los headers
// x-vercel-ip-* traen geolocalización aproximada por IP; en local quedan null.
export type ScanContext = {
  ip: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  userAgent: string | null;
};

function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function number(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getScanContext(): Promise<ScanContext> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    city: decode(h.get("x-vercel-ip-city")),
    country: decode(h.get("x-vercel-ip-country")),
    latitude: number(h.get("x-vercel-ip-latitude")),
    longitude: number(h.get("x-vercel-ip-longitude")),
    userAgent: h.get("user-agent"),
  };
}
