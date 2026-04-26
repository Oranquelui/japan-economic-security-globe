import { DEFAULT_RANKING_POLICY } from "../config/ranking-registry";
import { clampScore, computeRankingScore } from "./score";
import type {
  AttentionSignal,
  CanonicalReference,
  RankingDecision,
  RankingOverride,
  RankingPolicy,
  RankingScore,
  RankingSignal,
  RankingSurfaceId
} from "../../types/ranking";

const OVERRIDE_SCORE_BOOST = 0.08;

interface BuildRankingDecisionOptions {
  surfaceId: RankingSurfaceId;
  signals: RankingSignal[];
  attentionSignals?: AttentionSignal[];
  now?: string;
  overrides?: RankingOverride[];
  policy?: RankingPolicy;
}

interface RankedSignal {
  canonicalRef: CanonicalReference;
  finalScore: number;
  override?: RankingOverride;
  score: RankingScore;
  signal: RankingSignal;
  topComponentId: RankingScore["components"][number]["id"];
}

export function buildRankingDecision({
  surfaceId,
  signals,
  attentionSignals = [],
  now = new Date().toISOString(),
  overrides = [],
  policy = DEFAULT_RANKING_POLICY
}: BuildRankingDecisionOptions): RankingDecision {
  const rankedSignals = signals
    .map((signal) => rankSignal(signal, { attentionSignals, now, overrides, policy, surfaceId }))
    .toSorted((left, right) => compareRankedSignals(left, right))
    .map((entry, index) => ({
      signalId: entry.signal.id,
      rank: index + 1,
      finalScore: entry.finalScore,
      canonicalId: entry.canonicalRef.id,
      canonicalKind: entry.canonicalRef.kind,
      primaryAxis: entry.signal.importanceAxes[0],
      topComponentId: entry.topComponentId,
      explanation: buildDecisionExplanation(entry.signal, entry.score, entry.override),
      overrideId: entry.override?.id
    }));

  return {
    surfaceId,
    scoredAt: now,
    policyVersion: policy.version,
    items: rankedSignals
  };
}

function rankSignal(
  signal: RankingSignal,
  {
    attentionSignals,
    now,
    overrides,
    policy,
    surfaceId
  }: {
    attentionSignals: AttentionSignal[];
    now: string;
    overrides: RankingOverride[];
    policy: RankingPolicy;
    surfaceId: RankingSurfaceId;
  }
): RankedSignal {
  const score = computeRankingScore(signal, {
    attentionSignals,
    now,
    policy
  });
  const canonicalRef = resolveCanonicalReference(signal);
  const override = resolveActiveOverride(signal, overrides, now, surfaceId);
  const finalScore = clampScore(score.finalScore + (override ? OVERRIDE_SCORE_BOOST : 0));
  const topComponentId = score.components
    .toSorted((left, right) => right.contribution - left.contribution || right.value - left.value)
    [0]?.id ?? "nationalImportance";

  return {
    canonicalRef,
    finalScore,
    override,
    score,
    signal,
    topComponentId
  };
}

function compareRankedSignals(left: RankedSignal, right: RankedSignal) {
  return (
    right.finalScore - left.finalScore
    || right.score.finalScore - left.score.finalScore
    || left.signal.label.localeCompare(right.signal.label, "ja")
  );
}

function resolveCanonicalReference(signal: RankingSignal): CanonicalReference {
  return signal.canonicalRefs.find((ref) => ref.kind !== "source") ?? signal.canonicalRefs[0];
}

function resolveActiveOverride(
  signal: RankingSignal,
  overrides: RankingOverride[],
  now: string,
  surfaceId: RankingSurfaceId
): RankingOverride | undefined {
  return overrides.find((override) => {
    if (!isActiveOverride(override, now)) {
      return false;
    }

    if (override.surfaceId && override.surfaceId !== surfaceId) {
      return false;
    }

    if (override.signalId) {
      return override.signalId === signal.id;
    }

    if (override.sourceId) {
      return signal.sourceIds.includes(override.sourceId);
    }

    return false;
  });
}

function isActiveOverride(override: RankingOverride, now: string): boolean {
  const nowTime = new Date(now).getTime();
  const createdAt = new Date(override.createdAt).getTime();
  const expiresAt = new Date(override.expiresAt).getTime();

  if (!Number.isFinite(nowTime) || !Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) {
    return false;
  }

  return createdAt <= nowTime && nowTime <= expiresAt;
}

function buildDecisionExplanation(
  signal: RankingSignal,
  score: RankingScore,
  override?: RankingOverride
): string {
  const nationalImportance = score.components.find((component) => component.id === "nationalImportance")?.value ?? 0;
  const disruptionDepth = score.components.find((component) => component.id === "disruptionDepth")?.value ?? 0;
  const explanation = nationalImportance >= disruptionDepth
    ? "国家的重要度が高く、日本向けの監視優先度が高い。"
    : "国内への波及深度が高く、継続監視の優先度が高い。";

  if (!override) {
    return explanation;
  }

  return `${explanation} Override: ${override.reason}.`;
}
