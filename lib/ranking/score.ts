import { DEFAULT_RANKING_POLICY } from "../config/ranking-registry";
import type {
  AttentionSignal,
  RankingPolicy,
  RankingScore,
  RankingScoreComponentId,
  RankingSignal
} from "../../types/ranking";
import { RANKING_SCORE_COMPONENT_IDS } from "../../types/ranking";

type ComputeRankingScoreOptions = {
  attentionSignals?: AttentionSignal[];
  now?: string;
  policy?: RankingPolicy;
};

export function computeRankingScore(
  signal: RankingSignal,
  options: ComputeRankingScoreOptions = {}
): RankingScore {
  if (!hasCanonicalReference(signal)) {
    throw new Error("Ranking signals require at least one canonical reference.");
  }

  const policy = options.policy ?? DEFAULT_RANKING_POLICY;
  const now = options.now ?? new Date().toISOString();
  const sourceConfidence = clampScore(signal.componentInputs.sourceConfidence);
  const componentValues: Record<RankingScoreComponentId, number> = {
    nationalImportance: clampScore(signal.componentInputs.nationalImportance),
    disruptionDepth: clampScore(signal.componentInputs.disruptionDepth),
    sourceConfidence,
    publicAttention: resolveAttentionScore(signal, options.attentionSignals ?? [], now, policy)
  };
  const components = RANKING_SCORE_COMPONENT_IDS.map((id) => ({
    id,
    weight: policy.weights[id],
    value: componentValues[id],
    contribution: clampScore(componentValues[id] * policy.weights[id])
  }));

  const baseScore = components.reduce((total, component) => total + component.contribution, 0);
  const freshnessBoost = resolveFreshnessBoost(signal, now, sourceConfidence, policy);
  const confidencePenalty = applyConfidencePenalty(sourceConfidence);

  return {
    signalId: signal.id,
    policyVersion: policy.version,
    computedAt: now,
    finalScore: clampScore((baseScore + freshnessBoost) * confidencePenalty),
    components
  };
}

export function hasCanonicalReference(signal: RankingSignal): boolean {
  return Array.isArray(signal.canonicalRefs) && signal.canonicalRefs.length > 0;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function isAttentionStale(observedAt: string, now: string, decayWindowDays: number): boolean {
  return diffDays(observedAt, now) > decayWindowDays;
}

export function applyConfidencePenalty(sourceConfidence: number): number {
  const clamped = clampScore(sourceConfidence);

  if (clamped >= 0.5) {
    return 1;
  }

  return 1 - (0.5 - clamped) * 0.8;
}

function resolveAttentionScore(
  signal: RankingSignal,
  attentionSignals: AttentionSignal[],
  now: string,
  policy: RankingPolicy
): number {
  if (attentionSignals.length === 0) {
    return clampScore(signal.componentInputs.publicAttention);
  }

  const matchingSignals = attentionSignals.filter((attentionSignal) => attentionSignal.signalId === signal.id);

  if (matchingSignals.length === 0) {
    return clampScore(signal.componentInputs.publicAttention);
  }

  const strongestDecayedAttention = matchingSignals.reduce((maxScore, attentionSignal) => {
    const rawScore = clampScore(attentionSignal.score);
    const ageDays = diffDays(attentionSignal.observedAt, now);
    const decayedScore = rawScore * Math.exp(-Math.max(0, ageDays) / policy.attentionDecayWindowDays);

    return Math.max(maxScore, decayedScore);
  }, 0);

  return clampScore(strongestDecayedAttention);
}

function resolveFreshnessBoost(
  signal: RankingSignal,
  now: string,
  sourceConfidence: number,
  policy: RankingPolicy
): number {
  if (!signal.retrievedAt || sourceConfidence < 0.5) {
    return 0;
  }

  const ageDays = diffDays(signal.retrievedAt, now);

  if (ageDays <= 0) {
    return policy.freshnessBoostCap;
  }

  if (ageDays >= 7) {
    return 0;
  }

  return policy.freshnessBoostCap * (1 - ageDays / 7);
}

function diffDays(from: string, to: string): number {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) {
    return Number.POSITIVE_INFINITY;
  }

  return (toTime - fromTime) / (1000 * 60 * 60 * 24);
}
