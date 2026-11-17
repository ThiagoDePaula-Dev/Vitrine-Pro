import type { CSSProperties } from "react";
import type { Theme } from "./schema";

const TEMPLATE_VARS = {
  dark: {
    "--lp-bg": "#0a0a0b",
    "--lp-fg": "#f5f5f5",
    "--lp-muted": "#a3a3a8",
    "--lp-card": "#151517",
    "--lp-border": "rgba(255,255,255,0.1)",
    "--lp-on-primary": "#ffffff",
  },
  light: {
    "--lp-bg": "#ffffff",
    "--lp-fg": "#18181b",
    "--lp-muted": "#63636b",
    "--lp-card": "#f5f5f7",
    "--lp-border": "rgba(0,0,0,0.1)",
    "--lp-on-primary": "#ffffff",
  },
  vibrant: {
    "--lp-bg": "#fff8f0",
    "--lp-fg": "#1c1033",
    "--lp-muted": "#5b5170",
    "--lp-card": "#ffffff",
    "--lp-border": "rgba(28,16,51,0.12)",
    "--lp-on-primary": "#ffffff",
  },
} as const;

const RADIUS = { none: "0px", sm: "6px", md: "12px", lg: "20px", full: "32px" } as const;

// Fontes carregadas em app/layout.tsx (variáveis CSS).
const FONTS = {
  modern: { head: "var(--font-inter)", body: "var(--font-inter)" },
  elegant: { head: "var(--font-playfair)", body: "var(--font-inter)" },
  bold: { head: "var(--font-space)", body: "var(--font-inter)" },
} as const;

export function themeStyle(theme: Theme): CSSProperties {
  const f = FONTS[theme.fontPair];
  return {
    ...TEMPLATE_VARS[theme.template],
    "--lp-primary": theme.primary,
    "--lp-accent": theme.accent,
    "--lp-radius": RADIUS[theme.radius],
    "--lp-font-head": f.head,
    "--lp-font-body": f.body,
  } as unknown as CSSProperties;
}

export const TEMPLATE_LABELS = {
  dark: "Escuro premium",
  light: "Claro clean",
  vibrant: "Vibrante",
} as const;

// Cores sugeridas ao trocar de template (o admin pode ajustar depois).
export const TEMPLATE_DEFAULT_COLORS = {
  dark: { primary: "#e11d48", accent: "#f59e0b" },
  light: { primary: "#0f766e", accent: "#0ea5e9" },
  vibrant: { primary: "#7c3aed", accent: "#f97316" },
} as const;
