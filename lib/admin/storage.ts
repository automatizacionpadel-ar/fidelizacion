import { createAdminClient } from "@/lib/supabase/admin";

// Recolecta las rutas del bucket "logos" de un negocio antes de borrar sus
// filas. El borrado de Storage se hace después de que la DB confirme.
export async function collectBusinessFilePaths(businessId: string): Promise<string[]> {
  const admin = createAdminClient();
  const [{ data: programs }, { data: cards }] = await Promise.all([
    admin
      .from("loyalty_programs")
      .select("id,logo_url,wallet_logo_url,hero_image_url,stamp_image_url")
      .eq("business_id", businessId),
    admin.from("loyalty_cards").select("id").eq("business_id", businessId),
  ]);

  const paths = new Set<string>();
  const addUrl = (url: unknown) => {
    if (typeof url !== "string") return;
    const marker = "/logos/";
    const i = url.indexOf(marker);
    if (i < 0) return;
    const path = url.slice(i + marker.length).split("?")[0];
    if (path) paths.add(path);
  };

  for (const p of programs ?? []) {
    addUrl(p.logo_url);
    addUrl(p.wallet_logo_url);
    addUrl(p.hero_image_url);
    addUrl(p.stamp_image_url);
    paths.add(`${businessId}/wallet-logos/${p.id}.png`);
  }
  for (const c of cards ?? []) {
    paths.add(`cards/${c.id}.png`);
  }

  return [...paths];
}

// Borra best-effort las rutas indicadas. Si Storage falla, no revierte la DB.
export async function removeStoragePaths(paths: string[]): Promise<number> {
  if (paths.length === 0) return 0;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("logos").remove(paths);
  if (error) {
    console.error("[admin-storage]", error.message);
    return 0;
  }
  return paths.length;
}

export async function removeBusinessFiles(businessId: string): Promise<number> {
  const paths = await collectBusinessFilePaths(businessId);
  return removeStoragePaths(paths);
}

// URL firmada temporal para un comprobante del bucket privado "receipts".
export async function createReceiptSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from("receipts").createSignedUrl(path, 3600);
    if (error) {
      console.error("[admin-storage]", error.message);
      return null;
    }
    return data.signedUrl;
  } catch (error) {
    console.error("[admin-storage]", (error as Error).message);
    return null;
  }
}

// Borra best-effort los comprobantes de pago del negocio (bucket privado).
export async function removeBusinessReceipts(businessId: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data: files, error } = await admin.storage.from("receipts").list(businessId, { limit: 1000 });
    if (error || !files?.length) return 0;
    const paths = files.map((file) => `${businessId}/${file.name}`);
    const { error: removeError } = await admin.storage.from("receipts").remove(paths);
    if (removeError) {
      console.error("[admin-storage]", removeError.message);
      return 0;
    }
    return paths.length;
  } catch (error) {
    console.error("[admin-storage]", (error as Error).message);
    return 0;
  }
}
