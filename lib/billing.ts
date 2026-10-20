// Facturación de la mensualidad del servicio.
// Los precios de los planes viven acá: cambialos cuando quieras actualizarlos.
export const PLANS = {
  base: { label: "Básico", price: 30000 },
  pro: { label: "Pro", price: 55000 },
} as const;

export type PlanId = keyof typeof PLANS;
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function normalizePlan(p: string | null | undefined): PlanId {
  if (p && (p as PlanId) in PLANS) return p as PlanId;
  return "base";
}

export function planPrice(p: string | null | undefined): number {
  return PLANS[normalizePlan(p)].price;
}

// Límites de tarjetas de fidelización por plan.
export const CARD_LIMITS: Record<PlanId, { total: number; active: number }> = {
  base: { total: 3, active: 1 },
  pro: { total: 6, active: 3 },
};

export function cardLimits(p: string | null | undefined) {
  return CARD_LIMITS[normalizePlan(p)];
}

export function cardLimitMessage(p: string | null | undefined, kind: "total" | "active"): string {
  const plan = normalizePlan(p);
  const limits = CARD_LIMITS[plan];
  if (kind === "total") {
    return `El plan ${PLANS[plan].label} permite hasta ${limits.total} tarjetas diferentes.`;
  }
  return `El plan ${PLANS[plan].label} permite hasta ${limits.active} ${
    limits.active === 1 ? "tarjeta activa" : "tarjetas activas"
  } al mismo tiempo.`;
}

export const CURRENCY = "ARS";

export const PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
] as const;

// Período actual en formato "YYYY-MM" (mes del negocio, hora local del server).
export function currentPeriod(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}`;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-10" -> "Octubre 2026"
export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return period;
  return `${MONTHS[m - 1]} ${y}`;
}

// "2026-10" -> "Octubre"
export function periodMonthLabel(period: string): string {
  const [, m] = period.split("-").map(Number);
  if (!m || m < 1 || m > 12) return period;
  return MONTHS[m - 1];
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}
