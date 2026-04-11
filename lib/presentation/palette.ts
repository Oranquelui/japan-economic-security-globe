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

const BASE_THEME: Omit<ThemePalette, "accent" | "accentSoft" | "accentText"> = {
  surfaceCanvas: "#d7dde2",
  surfacePanel: "rgba(57, 63, 69, 0.84)",
  surfacePanelElevated: "rgba(71, 79, 86, 0.78)",
  borderSubtle: "rgba(98, 108, 118, 0.42)",
  borderStrong: "rgba(78, 89, 99, 0.58)",
  textPrimary: "#f5f7fa",
  textMuted: "#c4ccd5"
};

const THEME_PALETTES: Record<ThemeId, Pick<ThemePalette, "accent" | "accentSoft" | "accentText">> = {
  energy: {
    accent: "#b67a45",
    accentSoft: "rgba(182, 122, 69, 0.12)",
    accentText: "#f0d7bf"
  },
  rice: {
    accent: "#a88a56",
    accentSoft: "rgba(168, 138, 86, 0.12)",
    accentText: "#efe0bc"
  },
  water: {
    accent: "#5a9fc2",
    accentSoft: "rgba(90, 159, 194, 0.12)",
    accentText: "#d2ebf8"
  },
  defense: {
    accent: "#8b6773",
    accentSoft: "rgba(139, 103, 115, 0.12)",
    accentText: "#eed9df"
  },
  semiconductors: {
    accent: "#5aae9d",
    accentSoft: "rgba(90, 174, 157, 0.12)",
    accentText: "#d9f4ee"
  }
};

const STATUS_PALETTE: StatusPalette = {
  high: "#d36b6b",
  watch: "#d1a55d",
  normal: "#6da88a",
  monitoring: "#5d8db8",
  selected: "#7db7d9"
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
