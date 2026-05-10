import { buildRankingExplanation } from "../ranking/explain";
import { computeRankingScore } from "../ranking/score";
import { getDetailView } from "../semantic/detail";
import { getThemeLabel, localizeAnyLabel } from "./japanese";
import { resolveRankingThemeId, resolveSelectableCanonicalId } from "./ranking";
import type { RankingDecision, RankingSignal } from "../../types/ranking";
import type { SemanticGraph, ThemeId } from "../../types/semantic";

export interface WatchboardBriefingViewModel {
  confidenceLabel: string;
  freshnessLabel: string;
  japanImpact: string;
  priorityTierLabel: "Critical" | "High" | "Watch" | "Baseline";
  rankLabel: string;
  selectedId: string | null;
  themeId: ThemeId;
  themeLabel: string;
  title: string;
  whyNow: string;
}

export function buildWatchboardBriefing(
  graph: SemanticGraph,
  signals: RankingSignal[],
  decision: RankingDecision,
  now: string
): WatchboardBriefingViewModel | null {
  const topItem = decision.items[0];

  if (!topItem) {
    return null;
  }

  const signal = signals.find((candidate) => candidate.id === topItem.signalId);

  if (!signal) {
    return null;
  }

  const selectedId = resolveSelectableCanonicalId(signal);
  const themeId = resolveRankingThemeId(graph, signal);
  const score = computeRankingScore(signal, { now });
  const explanation = buildRankingExplanation(signal, score, {
    decisionItem: topItem,
    now
  });
  const detail = selectedId ? safelyGetDetail(graph, selectedId) : null;

  return {
    confidenceLabel: explanation.confidence.label,
    freshnessLabel: explanation.freshness.label,
    japanImpact: detail?.whyItMatters ?? "日本向けの供給・生活・政策判断への影響を優先して監視する。",
    priorityTierLabel: explanation.priorityTierLabel,
    rankLabel: explanation.rankLabel ?? `#${topItem.rank}`,
    selectedId,
    themeId,
    themeLabel: getThemeLabel(themeId).label,
    title: detail ? localizeAnyLabel(detail.id, detail.label) : signal.label,
    whyNow: explanation.summary
  };
}

function safelyGetDetail(graph: SemanticGraph, selectedId: string) {
  try {
    return getDetailView(graph, selectedId);
  } catch {
    return null;
  }
}
