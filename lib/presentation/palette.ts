import type { ThemeId } from "../../types/semantic";

export type ThemePalette = {
  accent: string;
  accentSoft: string;
  accentText: string;
  surfaceCanvas: string;
  surfacePanel: string;
  surfacePanelElevated: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textMuted: string;
};

export type StatusPalette = {
  high: string;
  watch: string;
  normal: string;
  monitoring: string;
  selected: string;
};

export type SemanticTone = "accent" | "high" | "watch" | "normal" | "monitoring" | "selected" | "neutral";

/**
 * Night Atlas base: deep operations-room chrome so the Japan map and
 * theme accents read as the hero, not a muddy gray dual-mode shell.
 */
const BASE_THEME: Omit<ThemePalette, "accent" | "accentSoft" | "accentText"> = {
  surfaceCanvas: "#0a121c",
  surfacePanel: "rgba(10, 16, 26, 0.92)",
  surfacePanelElevated: "rgba(18, 28, 42, 0.94)",
  borderSubtle: "rgba(148, 176, 204, 0.14)",
  borderStrong: "rgba(176, 206, 232, 0.28)",
  textPrimary: "#eef4fb",
  textMuted: "#93a4b8"
};

const THEME_PALETTES: Record<ThemeId, Pick<ThemePalette, "accent" | "accentSoft" | "accentText">> = {
  energy: {
    accent: "#e0a060",
    accentSoft: "rgba(224, 160, 96, 0.16)",
    accentText: "#f6dfc4"
  },
  logistics: {
    accent: "#4ec4d9",
    accentSoft: "rgba(78, 196, 217, 0.16)",
    accentText: "#d4f5fb"
  },
  "regional-security": {
    accent: "#e07a6e",
    accentSoft: "rgba(224, 122, 110, 0.16)",
    accentText: "#f8d8d3"
  },
  defense: {
    accent: "#c48a9a",
    accentSoft: "rgba(196, 138, 154, 0.15)",
    accentText: "#f3dde4"
  },
  semiconductors: {
    accent: "#4fd0b8",
    accentSoft: "rgba(79, 208, 184, 0.15)",
    accentText: "#d8f8f0"
  },
  rice: {
    accent: "#d4b06a",
    accentSoft: "rgba(212, 176, 106, 0.15)",
    accentText: "#f4e6c4"
  },
  water: {
    accent: "#5fb4de",
    accentSoft: "rgba(95, 180, 222, 0.15)",
    accentText: "#d7eefb"
  }
};

const STATUS_PALETTE: StatusPalette = {
  high: "#f07167",
  watch: "#e0b14a",
  normal: "#6fbf7a",
  monitoring: "#4eb3d8",
  selected: "#f2c96a"
};

export function getThemePalette(themeId: ThemeId): ThemePalette {
  return {
    ...BASE_THEME,
    ...THEME_PALETTES[themeId]
  };
}

export function getStatusPalette(): StatusPalette {
  return STATUS_PALETTE;
}

export function resolveToneColor(
  tone: SemanticTone,
  themePalette: ThemePalette,
  statusPalette: StatusPalette
): string {
  switch (tone) {
    case "accent":
      return themePalette.accent;
    case "high":
      return statusPalette.high;
    case "watch":
      return statusPalette.watch;
    case "normal":
      return statusPalette.normal;
    case "monitoring":
      return statusPalette.monitoring;
    case "selected":
      return statusPalette.selected;
    default:
      return themePalette.textMuted;
  }
}

export function getUrgencyTone(urgency: string): SemanticTone {
  if (urgency === "高") {
    return "high";
  }

  if (urgency === "中") {
    return "watch";
  }

  return "normal";
}

export function getStatusTone(status: string): SemanticTone {
  if (status === "監視中") {
    return "monitoring";
  }

  if (status === "要確認") {
    return "watch";
  }

  if (status === "表示対象") {
    return "normal";
  }

  return "neutral";
}
