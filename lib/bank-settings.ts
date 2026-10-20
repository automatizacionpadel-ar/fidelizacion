export type BankSettings = {
  holder: string;
  bank: string;
  accountType: string;
  cbuCvu: string;
  alias: string;
  taxId: string;
  notes: string;
  updatedAt: string | null;
};

export const EMPTY_BANK_SETTINGS: BankSettings = {
  holder: "",
  bank: "",
  accountType: "",
  cbuCvu: "",
  alias: "",
  taxId: "",
  notes: "",
  updatedAt: null,
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeBankSettings(row: unknown): BankSettings {
  if (!row || typeof row !== "object") return EMPTY_BANK_SETTINGS;
  const r = row as Record<string, unknown>;
  return {
    holder: text(r.holder),
    bank: text(r.bank),
    accountType: text(r.account_type),
    cbuCvu: text(r.cbu_cvu),
    alias: text(r.alias),
    taxId: text(r.tax_id),
    notes: text(r.notes),
    updatedAt: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

export function hasBankSettings(settings: BankSettings): boolean {
  return Boolean(settings.alias.trim() || settings.cbuCvu.trim());
}

export function bankDetailRows(settings: BankSettings): [string, string][] {
  return (
    [
      ["Titular", settings.holder],
      ["Banco / billetera", settings.bank],
      ["Tipo de cuenta", settings.accountType],
      ["Alias", settings.alias],
      ["CBU / CVU", settings.cbuCvu],
      ["CUIT / CUIL", settings.taxId],
    ] as [string, string][]
  ).filter(([, value]) => value.trim() !== "");
}
