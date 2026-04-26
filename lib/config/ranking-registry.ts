import type { ImportanceAxis, RankingPolicy, RankingSurfaceId } from "../../types/ranking";
import { IMPORTANCE_AXES, RANKING_SURFACE_IDS } from "../../types/ranking";

export { IMPORTANCE_AXES, RANKING_SURFACE_IDS };

export const IMPORTANCE_AXIS_LABELS: Record<ImportanceAxis, string> = {
  energy: "エネルギー",
  food: "食料",
  semiconductors: "半導体",
  logistics: "物流",
  disaster_infrastructure: "災害基盤",
  defense_industrial_base: "防衛産業基盤",
  household_cost: "家計負担"
};

export const RANKING_SURFACE_LABELS: Record<RankingSurfaceId, string> = {
  homepage: "ホーム",
  inbox: "監視インボックス",
  "preset-rail": "プリセット",
  briefing: "ブリーフィング"
};

export const SCORE_TIER_THRESHOLDS = {
  critical: 0.8,
  high: 0.65,
  watch: 0.45
} as const;

export interface AttentionSourceMetadata {
  enabled: boolean;
  label: string;
  refreshClass: "hourly" | "daily" | "weekly";
  sourceType: "social" | "news" | "search" | "fixture";
  termsStatus: "allowed" | "review" | "blocked";
}

export const ATTENTION_SOURCE_REGISTRY: Record<string, AttentionSourceMetadata> = {
  "fixture-public-interest": {
    enabled: true,
    label: "Public attention fixture",
    refreshClass: "daily",
    sourceType: "fixture",
    termsStatus: "allowed"
  },
  "x-japan": {
    enabled: false,
    label: "X Japan",
    refreshClass: "hourly",
    sourceType: "social",
    termsStatus: "blocked"
  },
  "yahoo-japan-news": {
    enabled: false,
    label: "Yahoo Japan News",
    refreshClass: "daily",
    sourceType: "news",
    termsStatus: "review"
  }
};

export const DEFAULT_RANKING_POLICY: RankingPolicy = {
  version: "national-importance-v1",
  weights: {
    nationalImportance: 0.5,
    disruptionDepth: 0.25,
    sourceConfidence: 0.15,
    publicAttention: 0.1
  },
  attentionDecayWindowDays: 7,
  freshnessBoostCap: 0.05
};
