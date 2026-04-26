export const IMPORTANCE_AXES = [
  "energy",
  "food",
  "semiconductors",
  "logistics",
  "disaster_infrastructure",
  "defense_industrial_base",
  "household_cost"
] as const;

export type ImportanceAxis = (typeof IMPORTANCE_AXES)[number];

export const RANKING_SCORE_COMPONENT_IDS = [
  "nationalImportance",
  "disruptionDepth",
  "sourceConfidence",
  "publicAttention"
] as const;

export type RankingScoreComponentId = (typeof RANKING_SCORE_COMPONENT_IDS)[number];

export const RANKING_SURFACE_IDS = ["homepage", "inbox", "preset-rail", "briefing"] as const;

export type RankingSurfaceId = (typeof RANKING_SURFACE_IDS)[number];

export type CanonicalReferenceKind = "entity" | "flow" | "observation" | "watch-signal" | "source";

export interface CanonicalReference {
  kind: CanonicalReferenceKind;
  id: string;
}

export type NonEmptyArray<T> = [T, ...T[]];

export type RankingComponentInputs = Record<RankingScoreComponentId, number>;

export interface RankingSignal {
  id: string;
  label: string;
  importanceAxes: NonEmptyArray<ImportanceAxis>;
  canonicalRefs: NonEmptyArray<CanonicalReference>;
  sourceIds: string[];
  componentInputs: RankingComponentInputs;
  retrievedAt?: string;
}

export interface ScoreComponent {
  id: RankingScoreComponentId;
  weight: number;
  value: number;
  contribution: number;
}

export interface RankingScore {
  signalId: string;
  policyVersion: string;
  computedAt: string;
  finalScore: number;
  components: ScoreComponent[];
}

export interface AttentionSignal {
  id: string;
  signalId: string;
  sourceLabel: string;
  observedAt: string;
  score: number;
  url?: string;
}

export interface RankingDecisionItem {
  signalId: string;
  rank: number;
  finalScore: number;
  canonicalId: string;
  canonicalKind: CanonicalReferenceKind;
  primaryAxis: ImportanceAxis;
  topComponentId: RankingScoreComponentId;
  explanation?: string;
  overrideId?: string;
}

export interface RankingDecision {
  surfaceId: RankingSurfaceId;
  scoredAt: string;
  policyVersion: string;
  items: RankingDecisionItem[];
}

export interface RankingOverride {
  id: string;
  reason: string;
  explanation: string;
  createdAt: string;
  expiresAt: string;
  signalId?: string;
  surfaceId?: RankingSurfaceId;
  sourceId?: string;
}

export interface RankingPolicy {
  version: string;
  weights: Record<RankingScoreComponentId, number>;
  attentionDecayWindowDays: number;
  freshnessBoostCap: number;
}
