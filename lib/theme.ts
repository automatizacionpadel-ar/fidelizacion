export const theme = {
  bgCard: "#2A2A29",
  bgDeep: "#20201F",
  border: "#3D3D3B",
  textPrimary: "#F0F0EE",
  textMuted: "#5C5C59",
  textMid: "#9A9A96",
  brand: "#7AB619",
  purple: "#8B5CF6",
  blue: "#3B82F6",
} as const;

export type ThemeToken = keyof typeof theme;
