import type { ThemeId } from "../../types/semantic";

/**
 * Machine-readable map of e-Stat-oriented spine series to product themes.
 * Used for planning, validation, and future ingestion — not all series are live yet.
 */

export type EstatSeriesStatus = "seeded" | "planned" | "context-only";

export type EstatSeriesFamily = {
  /** Stable key for planning and adapters */
  id: string;
  labelJa: string;
  labelEn: string;
  /** Themes this series can feed */
  themeIds: ThemeId[];
  /** Implementation priority: lower is sooner */
  priority: number;
  status: EstatSeriesStatus;
  /** Known source ids in seed/registry when available */
  sourceIds: string[];
  geography: "nation" | "prefecture" | "municipality" | "mixed";
  cadence: "annual" | "quarterly" | "monthly" | "ad-hoc";
  unitHint: string;
  whyJapanCaresJa: string;
  /** Optional e-Stat discovery hints — not always a concrete statsDataId yet */
  discoveryHint?: string;
  notes?: string;
};

export const ESTAT_SERIES_FAMILIES: EstatSeriesFamily[] = [
  {
    id: "rice-harvest-prefecture",
    labelJa: "水稲収穫量（都道府県）",
    labelEn: "Rice harvest by prefecture",
    themeIds: ["rice"],
    priority: 1,
    status: "seeded",
    sourceIds: ["source:estat-rice-prefecture-harvest-r5", "source:estat-api-v3"],
    geography: "prefecture",
    cadence: "annual",
    unitHint: "t",
    whyJapanCaresJa: "主食用の国内供給基盤と産地偏在を、公式収穫量で示す。",
    discoveryHint: "Crop survey / 農林水産省 作物統計 水稲 都道府県",
    notes: "First vertical slice candidate. Seed observations already exist."
  },
  {
    id: "cpi-food-energy",
    labelJa: "消費者物価（食料・エネルギー関連）",
    labelEn: "CPI food and energy-related items",
    themeIds: ["rice", "energy"],
    priority: 2,
    status: "planned",
    sourceIds: ["source:estat-api-v3"],
    geography: "nation",
    cadence: "monthly",
    unitHint: "index",
    whyJapanCaresJa: "家計が体感する食料・エネルギーの価格圧力を公式指数で示す。",
    discoveryHint: "消費者物価指数 中分類・品目 食料 光熱"
  },
  {
    id: "energy-electricity-regional",
    labelJa: "電力・エネルギー関連地域統計",
    labelEn: "Regional electricity / energy statistics",
    themeIds: ["energy"],
    priority: 3,
    status: "planned",
    sourceIds: ["source:estat-api-v3"],
    geography: "mixed",
    cadence: "monthly",
    unitHint: "varies",
    whyJapanCaresJa: "対外燃料依存の“国内着地”を、電力・エネルギー統計で説明する。",
    discoveryHint: "電力調査統計 / エネルギー関連 e-Stat 表",
    notes: "Global tanker routes remain context-only; not an e-Stat series."
  },
  {
    id: "industry-production-semi-proxy",
    labelJa: "生産動態・関連工業統計（半導体代理）",
    labelEn: "Production dynamics (semiconductor proxies)",
    themeIds: ["semiconductors"],
    priority: 4,
    status: "planned",
    sourceIds: ["source:estat-api-v3"],
    geography: "nation",
    cadence: "monthly",
    unitHint: "index or quantity",
    whyJapanCaresJa: "国内生産基盤の強弱を、生産統計の公式系列で追う。",
    discoveryHint: "生産動態統計 電子部品・デバイス 等"
  },
  {
    id: "trade-critical-goods",
    labelJa: "貿易統計（重要物資）",
    labelEn: "Trade statistics for critical goods",
    themeIds: ["semiconductors", "energy"],
    priority: 5,
    status: "context-only",
    sourceIds: [],
    geography: "nation",
    cadence: "monthly",
    unitHint: "yen / quantity",
    whyJapanCaresJa: "対外依存度は貿易統計が本丸。e-Stat ではなく税関貿易統計が主。",
    notes: "Primary path is Trade Statistics of Japan; listed for theme completeness."
  },
  {
    id: "port-cargo-domestic",
    labelJa: "港湾貨物・国内物流関連統計",
    labelEn: "Port cargo / domestic logistics statistics",
    themeIds: ["logistics"],
    priority: 6,
    status: "planned",
    sourceIds: ["source:estat-api-v3"],
    geography: "mixed",
    cadence: "monthly",
    unitHint: "tonnage",
    whyJapanCaresJa: "港湾後続と国内物流の公式貨物量で、AISデモより説明責任のある像を作る。",
    discoveryHint: "港湾統計 貨物 取扱量"
  },
  {
    id: "population-regional",
    labelJa: "人口・地域統計",
    labelEn: "Population / regional statistics",
    themeIds: ["water", "rice"],
    priority: 7,
    status: "planned",
    sourceIds: ["source:estat-api-v3"],
    geography: "prefecture",
    cadence: "annual",
    unitHint: "persons",
    whyJapanCaresJa: "水・食料ストレスを読むときの需要側・地域脆弱性の背景。",
    discoveryHint: "国勢調査 / 人口推計 都道府県"
  }
];

export function getEstatSeriesByPriority(): EstatSeriesFamily[] {
  return [...ESTAT_SERIES_FAMILIES].sort((a, b) => a.priority - b.priority);
}

export function getEstatSeriesForTheme(themeId: ThemeId): EstatSeriesFamily[] {
  return getEstatSeriesByPriority().filter((series) => series.themeIds.includes(themeId));
}

export function getSpineSeriesForTheme(themeId: ThemeId): EstatSeriesFamily[] {
  return getEstatSeriesForTheme(themeId).filter((series) => series.status !== "context-only");
}

export function getFirstVerticalSliceSeries(): EstatSeriesFamily {
  const first = getEstatSeriesByPriority().find((series) => series.status === "seeded");
  if (!first) {
    throw new Error("No seeded e-Stat series family configured for the first vertical slice.");
  }
  return first;
}
