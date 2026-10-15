// Tipografías disponibles para la tarjeta virtual.
// Se cargan con next/font en app/layout.tsx (variables CSS).
export const CARD_FONTS = {
  system: {
    label: "Sistema",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  inter: { label: "Inter", stack: "var(--font-inter), system-ui, sans-serif" },
  poppins: { label: "Poppins", stack: "var(--font-poppins), system-ui, sans-serif" },
  montserrat: { label: "Montserrat", stack: "var(--font-montserrat), system-ui, sans-serif" },
  playfair: { label: "Playfair Display", stack: "var(--font-playfair), Georgia, serif" },
} as const;

export type CardFontKey = keyof typeof CARD_FONTS;

export function cardFontStack(key: string | null | undefined) {
  return CARD_FONTS[(key as CardFontKey) ?? "system"]?.stack ?? CARD_FONTS.system.stack;
}

export const STAMP_ICON_PRESETS = ["✓", "☕", "⭐", "❤️", "🔥", "🍕", "🍔", "🍺", "💈", "✂️", "🎁", "👍"];

// Plantillas visuales de la tarjeta virtual.
// Cada una trae un punto de partida (colores + tipografía) que el negocio
// puede seguir editando libremente después de elegirla.
export const CARD_TEMPLATES = {
  moderno: {
    label: "Moderno",
    desc: "Limpio y directo, con acento vibrante.",
    preset: {
      background_color: "#2A2A29",
      text_color: "#F0F0EE",
      accent_color: "#7AB619",
      font_family: "poppins",
    },
  },
  clasico: {
    label: "Clásico",
    desc: "Elegante, marco dorado y serif.",
    preset: {
      background_color: "#1E1B16",
      text_color: "#F5EBD7",
      accent_color: "#C9A227",
      font_family: "playfair",
    },
  },
  glass: {
    label: "Cristal",
    desc: "Glassmorphism translúcido y suave.",
    preset: {
      background_color: "#23232E",
      text_color: "#FFFFFF",
      accent_color: "#22D3EE",
      font_family: "inter",
    },
  },
  futurista: {
    label: "Futurista",
    desc: "Oscuro con brillo neón.",
    preset: {
      background_color: "#0B0B14",
      text_color: "#E8F6FF",
      accent_color: "#00E5FF",
      font_family: "montserrat",
    },
  },
} as const;

export type CardTemplateId = keyof typeof CARD_TEMPLATES;

export const CARD_TEMPLATE_IDS = Object.keys(CARD_TEMPLATES) as CardTemplateId[];

export function normalizeTemplate(t: string | null | undefined): CardTemplateId {
  if (t && (t as CardTemplateId) in CARD_TEMPLATES) return t as CardTemplateId;
  return "moderno";
}
