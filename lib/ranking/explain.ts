import { IMPORTANCE_AXIS_LABELS, SCORE_TIER_THRESHOLDS } from "../config/ranking-registry";
import type {
  CanonicalReference,
  RankingDecisionItem,
  RankingOverride,
  RankingScore,
  RankingScoreComponentId,
  RankingSignal
} from "../../types/ranking";

const COMPONENT_LABELS: Record<RankingScoreComponentId, string> = {
  nationalImportance: "国家的重要度",
  disruptionDepth: "波及深度",
  sourceConfidence: "出典信頼度",
  publicAttention: "公的関心"
};

export interface RankingExplanationViewModel {
  signalId: string;
  rankLabel: string | null;
  summary: string;
  finalScoreLabel: string;
  priorityTierLabel: "Critical" | "High" | "Watch" | "Baseline";
  primaryAxis: {
    id: RankingSignal["importanceAxes"][number];
    label: string;
  };
  topComponent: RankingExplanationComponentViewModel;
  confidence: {
    label: string;
    valuePercent: number;
    tone: "high" | "medium" | "low";
  };
  freshness: {
    label: string;
    tone: "fresh" | "recent" | "stale" | "unknown";
  };
  publicAttention: {
    label: string;
    valuePercent: number;
  };
  components: RankingExplanationComponentViewModel[];
  canonicalRefs: CanonicalReference[];
  override?: {
    reason: string;
    explanation: string;
    expiresLabel: string;
    remainingLabel: string;
  };
}

export interface RankingExplanationComponentViewModel {
  id: RankingScoreComponentId;
  label: string;
  contributionPercent: number;
  valuePercent: number;
  weightPercent: number;
}

interface BuildRankingExplanationOptions {
  decisionItem?: RankingDecisionItem;
  now?: string;
  override?: RankingOverride;
}

export function buildRankingExplanation(
  signal: RankingSignal,
  score: RankingScore,
  {
    decisionItem,
    now = score.computedAt,
    override
  }: BuildRankingExplanationOptions = {}
): RankingExplanationViewModel {
  const components = score.components.map((component) => ({
    id: component.id,
    label: COMPONENT_LABELS[component.id],
    contributionPercent: Math.round(component.contribution * 100),
    valuePercent: Math.round(component.value * 100),
    weightPercent: Math.round(component.weight * 100)
  }));
  const topComponent = resolveTopComponent(components, decisionItem?.topComponentId);
  const sourceConfidence = score.components.find((component) => component.id === "sourceConfidence")?.value ?? 0;
  const publicAttention = score.components.find((component) => component.id === "publicAttention")?.value ?? 0;
  const finalScore = decisionItem?.finalScore ?? score.finalScore;

  return {
    signalId: signal.id,
    rankLabel: decisionItem ? `#${decisionItem.rank}` : null,
    summary: decisionItem?.explanation ?? buildDefaultSummary(topComponent.label),
    finalScoreLabel: finalScore.toFixed(2),
    priorityTierLabel: getPriorityTierLabel(finalScore),
    primaryAxis: {
      id: signal.importanceAxes[0],
      label: IMPORTANCE_AXIS_LABELS[signal.importanceAxes[0]]
    },
    topComponent,
    confidence: {
      label: getConfidenceLabel(sourceConfidence),
      valuePercent: Math.round(sourceConfidence * 100),
      tone: getConfidenceTone(sourceConfidence)
    },
    freshness: getFreshnessInfo(signal.retrievedAt, now),
    publicAttention: {
      label: `公的関心 ${Math.round(publicAttention * 100)}%`,
      valuePercent: Math.round(publicAttention * 100)
    },
    components,
    canonicalRefs: signal.canonicalRefs,
    override: override
      ? {
          reason: override.reason,
          explanation: override.explanation,
          expiresLabel: `${override.expiresAt.slice(0, 10)}まで`,
          remainingLabel: getRemainingOverrideLabel(now, override.expiresAt)
        }
      : undefined
  };
}

function resolveTopComponent(
  components: RankingExplanationComponentViewModel[],
  topComponentId?: RankingScoreComponentId
) {
  return (
    (topComponentId ? components.find((component) => component.id === topComponentId) : undefined)
    ?? components.toSorted((left, right) => right.contributionPercent - left.contributionPercent)[0]
  );
}

function buildDefaultSummary(topComponentLabel: string) {
  return `${topComponentLabel}が主因で、日本向けの監視優先度が高い。`;
}

function getPriorityTierLabel(finalScore: number): RankingExplanationViewModel["priorityTierLabel"] {
  if (finalScore >= SCORE_TIER_THRESHOLDS.critical) {
    return "Critical";
  }

  if (finalScore >= SCORE_TIER_THRESHOLDS.high) {
    return "High";
  }

  if (finalScore >= SCORE_TIER_THRESHOLDS.watch) {
    return "Watch";
  }

  return "Baseline";
}

function getConfidenceTone(value: number): RankingExplanationViewModel["confidence"]["tone"] {
  if (value >= 0.8) {
    return "high";
  }

  if (value >= 0.5) {
    return "medium";
  }

  return "low";
}

function getConfidenceLabel(value: number): string {
  const tone = getConfidenceTone(value);

  if (tone === "high") {
    return "高信頼";
  }

  if (tone === "medium") {
    return "要確認";
  }

  return "低信頼";
}

function getFreshnessInfo(retrievedAt: string | undefined, now: string): RankingExplanationViewModel["freshness"] {
  if (!retrievedAt) {
    return {
      label: "取得日不明",
      tone: "unknown"
    };
  }

  const days = diffDays(retrievedAt, now);

  if (!Number.isFinite(days) || days < 0) {
    return {
      label: "取得日不明",
      tone: "unknown"
    };
  }

  if (days === 0) {
    return {
      label: "本日取得",
      tone: "fresh"
    };
  }

  return {
    label: `${days}日前取得`,
    tone: days <= 2 ? "fresh" : days <= 7 ? "recent" : "stale"
  };
}

function diffDays(from: string, to: string): number {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) {
    return Number.NaN;
  }

  return Math.floor((toTime - fromTime) / (1000 * 60 * 60 * 24));
}

function getRemainingOverrideLabel(now: string, expiresAt: string): string {
  const remainingDays = diffCalendarDays(now, expiresAt);

  if (!Number.isFinite(remainingDays)) {
    return "期限未確認";
  }

  if (remainingDays <= 0) {
    return "本日まで";
  }

  return `あと${remainingDays}日`;
}

function diffCalendarDays(from: string, to: string): number {
  const fromDay = toUtcCalendarDay(from);
  const toDay = toUtcCalendarDay(to);

  if (!Number.isFinite(fromDay) || !Number.isFinite(toDay)) {
    return Number.NaN;
  }

  return Math.round((toDay - fromDay) / (1000 * 60 * 60 * 24));
}

function toUtcCalendarDay(value: string): number {
  const isoDate = value.slice(0, 10);

  return new Date(`${isoDate}T00:00:00.000Z`).getTime();
}
