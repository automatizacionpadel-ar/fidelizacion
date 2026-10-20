import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_BANK_SETTINGS, normalizeBankSettings, type BankSettings } from "@/lib/bank-settings";

export async function getAdminBankSettings(): Promise<{ settings: BankSettings; error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("bank_transfer_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      const missing = error.message.includes("bank_transfer_settings") || error.message.includes("schema cache");
      return {
        settings: EMPTY_BANK_SETTINGS,
        error: missing ? "Falta aplicar la migración 021_bank_transfer_settings.sql." : error.message,
      };
    }
    return { settings: normalizeBankSettings(data), error: null };
  } catch (error) {
    return {
      settings: EMPTY_BANK_SETTINGS,
      error: error instanceof Error ? error.message : "No se pudo cargar la configuración.",
    };
  }
}
