import { IMPORTANCE_AXIS_LABELS, SCORE_TIER_THRESHOLDS } from "../config/ranking-registry";
import { DEFAULT_THEME_ID } from "../config/theme-registry";
import { buildRankingExplanation, type RankingExplanationViewModel } from "../ranking/explain";
import { computeRankingScore } from "../ranking/score";
import { getThemeView } from "../semantic/selectors";
import type { OperationRow, OperationRowRanking } from "./operations";
import type { SemanticGraph, ThemeId } from "../../types/semantic";
import type {
  CanonicalReference,
  ImportanceAxis,
  RankingDecision,
  RankingSignal,
  RankingScoreComponentId
} from "../../types/ranking";

const AXIS_THEME_MAP: Partial<Record<ImportanceAxis, ThemeId>> = {
  disaster_infrastructure: "water",
  defense_industrial_base: "defense",
  energy: "energy",
  food: "rice",
  semiconductors: "semiconductors"
};

export type RankingPriorityTier = "critical" | "high" | "watch" | "baseline";

export type RankedOperationRow = OperationRow & {
  ranking?: OperationRowRanking;
};

export function applyRankingToOperationRows(
  rows: OperationRow[],
  signals: RankingSignal[],
  decision: RankingDecision
): RankedOperationRow[] {
  const rowIds = new Set(rows.map((row) => row.id));
  const signalMap = new Map(signals.map((signal) => [signal.id, signal]));
  const rankingMap = new Map<string, OperationRowRanking>();

  for (const item of decision.items) {
    const signal = signalMap.get(item.signalId);

    if (!signal) {
      continue;
    }

    const targetId = resolveSelectableCanonicalId(signal, rowIds);

    if (!targetId || rankingMap.has(targetId)) {
      continue;
    }

    rankingMap.set(targetId, {
      finalScore: item.finalScore,
      overrideId: item.overrideId,
      primaryAxis: item.primaryAxis,
      primaryAxisLabel: IMPORTANCE_AXIS_LABELS[item.primaryAxis],
      priorityTier: getRankingPriorityTier(item.finalScore),
      rank: item.rank,
      signalId: item.signalId,
      topComponentId: item.topComponentId,
      whyRanked: item.explanation ?? "国家的重要度と国内波及を優先して配置。"
    });
  }

  return rows
    .map((row, index) => ({
      ...row,
      ranking: rankingMap.get(row.id),
      _index: index
    }))
    .toSorted((left, right) => {
      const leftRank = left.ranking?.rank ?? Number.POSITIVE_INFINITY;
      const rightRank = right.ranking?.rank ?? Number.POSITIVE_INFINITY;

      return leftRank - rightRank || left._index - right._index;
    })
    .map(({ _index, ...row }) => row);
}

export function buildHomepageLeadSelection(
  graph: SemanticGraph,
  signals: RankingSignal[],
  decision: RankingDecision
): { selectedId: string; themeId: ThemeId } | null {
  const topItem = decision.items[0];

  if (!topItem) {
    return null;
  }

  const signal = signals.find((candidate) => candidate.id === topItem.signalId);

  if (!signal) {
    return null;
  }

  const themeId = resolveRankingThemeId(graph, signal);
  const themeView = getThemeView(graph, themeId);
  const selectableIds = new Set([
    ...themeView.flows.map((flow) => flow.id),
    ...themeView.observations.map((observation) => observation.id),
    ...themeView.entities.map((entity) => entity.id)
  ]);
  const selectedId = resolveSelectableCanonicalId(signal, selectableIds);

  if (!selectedId) {
    return null;
  }

  return {
    selectedId,
    themeId
  };
}

export function buildPresetRailThemeOrder(
  baseThemeIds: readonly ThemeId[],
  graph: SemanticGraph,
  signals: RankingSignal[],
  decision: RankingDecision
): ThemeId[] {
  const signalMap = new Map(signals.map((signal) => [signal.id, signal]));
  const themeRanks = new Map<ThemeId, number>();

  for (const item of decision.items) {
    const signal = signalMap.get(item.signalId);

    if (!signal) {
      continue;
    }

    const themeId = resolveRankingThemeId(graph, signal);
    const existingRank = themeRanks.get(themeId);

    if (existingRank === undefined || item.rank < existingRank) {
      themeRanks.set(themeId, item.rank);
    }
  }

  return [...baseThemeIds].toSorted((left, right) => {
    const leftRank = themeRanks.get(left) ?? Number.POSITIVE_INFINITY;
    const rightRank = themeRanks.get(right) ?? Number.POSITIVE_INFINITY;

    return leftRank - rightRank || baseThemeIds.indexOf(left) - baseThemeIds.indexOf(right);
  });
}

export function buildSelectedRankingExplanation(
  selectedId: string,
  signals: RankingSignal[],
  decision: RankingDecision,
  now: string
): RankingExplanationViewModel | null {
  const decisionMap = new Map(decision.items.map((item) => [item.signalId, item] as const));
  const candidates = signals
    .filter((signal) => signal.canonicalRefs.some((ref) => ref.id === selectedId))
    .map((signal) => {
      const decisionItem = decisionMap.get(signal.id);
      const score = computeRankingScore(signal, { now });

      return {
        decisionItem,
        explanation: buildRankingExplanation(signal, score, {
          decisionItem,
          now
        }),
        score
      };
    })
    .toSorted((left, right) => {
      const leftRank = left.decisionItem?.rank ?? Number.POSITIVE_INFINITY;
      const rightRank = right.decisionItem?.rank ?? Number.POSITIVE_INFINITY;

      return leftRank - rightRank || right.score.finalScore - left.score.finalScore;
    });

  return candidates[0]?.explanation ?? null;
}

export function getRankingPriorityTier(finalScore: number): RankingPriorityTier {
  if (finalScore >= SCORE_TIER_THRESHOLDS.critical) {
    return "critical";
  }

  if (finalScore >= SCORE_TIER_THRESHOLDS.high) {
    return "high";
  }

  if (finalScore >= SCORE_TIER_THRESHOLDS.watch) {
    return "watch";
  }

  return "baseline";
}

export function resolveRankingThemeId(graph: SemanticGraph, signal: RankingSignal): ThemeId {
  for (const axis of signal.importanceAxes) {
    const mappedThemeId = AXIS_THEME_MAP[axis];

    if (mappedThemeId) {
      return mappedThemeId;
    }
  }

  const canonicalRef = resolveCanonicalReference(signal);

  if (canonicalRef.kind === "flow") {
    return graph.flows.find((flow) => flow.id === canonicalRef.id)?.theme ?? DEFAULT_THEME_ID;
  }

  if (canonicalRef.kind === "observation") {
    return graph.observations.find((observation) => observation.id === canonicalRef.id)?.theme ?? DEFAULT_THEME_ID;
  }

  if (canonicalRef.kind === "entity") {
    return graph.entities.find((entity) => entity.id === canonicalRef.id)?.themes[0] ?? DEFAULT_THEME_ID;
  }

  return DEFAULT_THEME_ID;
}

export function resolveSelectableCanonicalId(
  signal: RankingSignal,
  candidateIds?: Set<string>
): string | null {
  const selectableRef = signal.canonicalRefs.find((ref) => isSelectableReference(ref, candidateIds));

  return selectableRef?.id ?? null;
}

function resolveCanonicalReference(signal: RankingSignal): CanonicalReference {
  return signal.canonicalRefs.find((ref) => ref.kind !== "source") ?? signal.canonicalRefs[0];
}

function isSelectableReference(ref: CanonicalReference, candidateIds?: Set<string>) {
  if (ref.kind === "source") {
    return false;
  }

  if (!candidateIds) {
    return true;
  }

  return candidateIds.has(ref.id);
}
