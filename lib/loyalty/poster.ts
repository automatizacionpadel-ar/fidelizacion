// Carteles imprimibles del QR (mostrador / escritorio).
// Un único generador HTML: se usa igual para la vista previa (iframe)
// y para imprimir (ventana nueva → PDF o papel).
// Las medidas internas usan unidades cqw/cqh para escalar a cualquier tamaño,
// y @page fija el tamaño de hoja real (A5 o A4).
// El contenido está presupuestado para entrar siempre en 1 hoja:
// el footer queda anclado abajo y nada se corta.

export type PosterTemplate = "moderno" | "clasico" | "futurista" | "gradiente";
export type PosterSize = "A5" | "A4";

export const POSTER_TEMPLATES: { id: PosterTemplate; label: string; desc: string }[] = [
  { id: "moderno", label: "Moderno", desc: "Blanco, limpio y directo." },
  { id: "clasico", label: "Clásico", desc: "Crema con marco dorado." },
  { id: "futurista", label: "Futurista", desc: "Oscuro con brillo neón." },
  { id: "gradiente", label: "Gradiente", desc: "Color vibrante degradado." },
];

export const POSTER_DEFAULTS: Record<PosterTemplate, { bg: string; ink: string; accent: string }> = {
  moderno: { bg: "#ffffff", ink: "#20201F", accent: "#7AB619" },
  clasico: { bg: "#FAF5EA", ink: "#2A2118", accent: "#C9A227" },
  futurista: { bg: "#0A0A14", ink: "#E8F6FF", accent: "#00E5FF" },
  gradiente: { bg: "#0EA5E9", ink: "#20201F", accent: "#0EA5E9" },
};

export const POSTER_SIZES: { id: PosterSize; label: string; desc: string }[] = [
  { id: "A5", label: "A5", desc: "14,8 × 21 cm · cartel de escritorio" },
  { id: "A4", label: "A4", desc: "21 × 29,7 cm · cartel grande" },
];

export type PosterTexts = {
  businessName: string;
  cardTitle: string;
  howText: string;
  rewardText: string;
};

export type PosterStyle = {
  bg?: string;
  ink?: string;
  accent?: string;
  /** 100 = normal */
  scale?: number;
  showLogo?: boolean;
};

export type PosterData = PosterTexts & {
  logoUrl?: string | null;
  qrDataUrl: string;
};

export function defaultPosterTexts(opts: {
  businessName: string;
  cardTitle: string;
  rewardDescription: string;
  goal: number;
  cardType: "stamps" | "points";
  earnUnit: "visit" | "amount_spent";
}): PosterTexts {
  const unit = opts.cardType === "stamps" ? "sellos" : "puntos";
  return {
    businessName: opts.businessName || opts.cardTitle,
    cardTitle: opts.cardTitle,
    howText:
      opts.earnUnit === "amount_spent"
        ? `Escaneá este QR con tu celu, creá tu tarjeta gratis y sumá ${unit} con tus compras.`
        : `Escaneá este QR con tu celu, creá tu tarjeta gratis y sumá 1 ${unit === "sellos" ? "sello" : "punto"} en cada visita.`,
    rewardText: `Al llegar a ${opts.goal} ${unit} te llevás: ${opts.rewardDescription || "un premio"}.`,
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function posterDocument(
  template: PosterTemplate,
  size: PosterSize,
  d: PosterData,
  style: PosterStyle = {}
): string {
  const pageSize = size === "A5" ? "A5 portrait" : "A4 portrait";
  const sheetSize = size === "A5" ? "width:148mm;height:210mm;" : "width:210mm;height:297mm;";

  const vars = [
    style.bg ? `--pbg:${esc(style.bg)};` : "",
    style.ink ? `--ink:${esc(style.ink)};` : "",
    style.accent ? `--accent:${esc(style.accent)};` : "",
    `--tscale:${(style.scale ?? 100) / 100};`,
  ].join("");

  const showLogo = style.showLogo !== false;
  const logo = !showLogo
    ? ""
    : d.logoUrl
      ? `<img class="logo" src="${esc(d.logoUrl)}" alt="Logo" />`
      : `<div class="logo-fallback">${esc((d.businessName || "F")[0])}</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>QR ${esc(d.cardTitle)}</title>
<style>
@page { size: ${pageSize}; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { display: flex; justify-content: center; background: #888; }
@media print { body { background: none; } }
.sheet { ${sheetSize} container-type: size; display: flex; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.frame { flex: 1; min-height: 0; margin: 4cqw; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
.logo { max-width: 60cqw; max-height: 13cqh; object-fit: contain; }
.logo-fallback { width: 16cqw; height: 16cqw; border-radius: 4cqw; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 8cqw; background: var(--accent, #7AB619); color: #fff; }
.kicker { font-size: 3.2cqw; font-weight: 800; letter-spacing: 0.35em; margin: 3cqw 0 0; text-transform: uppercase; }
.biz { font-size: calc(7.5cqw * var(--tscale, 1)); font-weight: 800; margin: 1.2cqw 0 0; line-height: 1.15; }
.card { font-size: calc(4.6cqw * var(--tscale, 1)); font-weight: 600; margin: 1cqw 0 0; }
.qrbox { background: #fff; border-radius: 3cqw; padding: 3cqw; margin-top: 3.5cqw; flex-shrink: 0; }
.qrbox img { display: block; width: 44cqw; height: 44cqw; }
.how { font-size: calc(3.8cqw * var(--tscale, 1)); line-height: 1.45; margin: 3.5cqw 2cqw 0; }
.reward { font-size: calc(4.2cqw * var(--tscale, 1)); font-weight: 800; margin: 2cqw 2cqw 0; line-height: 1.4; }
.foot { margin-top: auto; flex-shrink: 0; padding-top: 2.5cqw; font-size: 2.8cqw; }

/* ——— Moderno ——— */
.t-moderno { background: var(--pbg, #fff); color: var(--ink, #20201F); }
.t-moderno .frame { border-top: 2cqw solid var(--accent, #7AB619); padding-top: 4cqw; }
.t-moderno .kicker { color: var(--accent, #7AB619); }
.t-moderno .qrbox { border: 0.6cqw solid var(--accent, #7AB619); }
.t-moderno .foot { color: var(--ink, #20201F); opacity: 0.55; }

/* ——— Clásico ——— */
.t-clasico { background: var(--pbg, #FAF5EA); color: var(--ink, #2A2118); font-family: Georgia, "Times New Roman", serif; }
.t-clasico .frame { border: 0.8cqw solid var(--accent, #C9A227); outline: 0.4cqw solid var(--accent, #C9A227); outline-offset: -2.4cqw; padding: 4cqw 3cqw; }
.t-clasico .kicker { color: var(--accent, #C9A227); }
.t-clasico .biz { font-size: calc(8cqw * var(--tscale, 1)); }
.t-clasico .rule { width: 30cqw; height: 0.5cqw; background: var(--accent, #C9A227); margin-top: 2.5cqw; flex-shrink: 0; }
.t-clasico .qrbox { border: 0.6cqw solid var(--accent, #C9A227); }
.t-clasico .foot { font-style: italic; opacity: 0.75; }

/* ——— Futurista ——— */
.t-futurista { background: var(--pbg, #0A0A14); color: var(--ink, #E8F6FF); }
.t-futurista .frame { border: 0.6cqw solid var(--accent, #00E5FF); box-shadow: inset 0 0 8cqw var(--accent, #00E5FF); padding: 4cqw 3cqw; }
.t-futurista .kicker { color: var(--accent, #00E5FF); }
.t-futurista .qrbox { box-shadow: 0 0 5cqw var(--accent, #00E5FF); }
.t-futurista .reward { color: var(--accent, #00E5FF); }
.t-futurista .foot { opacity: 0.6; }

/* ——— Gradiente ——— */
.t-gradiente { background: var(--pbg, linear-gradient(160deg, var(--accent, #7AB619), #0EA5E9 55%, #7C3AED)); color: #fff; }
.t-gradiente .panel { background: #fff; color: var(--ink, #20201F); border-radius: 4cqw; padding: 4cqw 3cqw 3.5cqw; width: 100%; min-height: 0; display: flex; flex-direction: column; align-items: center; }
.t-gradiente .kicker { color: var(--accent, #0EA5E9); }
.t-gradiente .qrbox { border: 0.6cqw solid var(--accent, #0EA5E9); }
.t-gradiente .foot { color: #fff; font-weight: 600; }
</style>
</head>
<body>
<div class="sheet t-${template}" style="${vars}">
  <div class="frame">
    ${template === "gradiente" ? '<div class="panel">' : ""}
    ${logo}
    <p class="kicker">Tarjeta de fidelización</p>
    <h1 class="biz">${esc(d.businessName || d.cardTitle)}</h1>
    <p class="card">${esc(d.cardTitle)}</p>
    ${template === "clasico" ? '<div class="rule"></div>' : ""}
    <div class="qrbox"><img src="${d.qrDataUrl}" alt="QR" /></div>
    <p class="how">${esc(d.howText)}</p>
    <p class="reward">🎁 ${esc(d.rewardText)}</p>
    ${template === "gradiente" ? "</div>" : ""}
    <div class="foot">Elaborado por <strong>SimplificIA</strong></div>
  </div>
</div>
</body>
</html>`;
}
