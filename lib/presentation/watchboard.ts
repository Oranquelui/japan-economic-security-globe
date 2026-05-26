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
  proofSourceLabels: string[];
  priorityTierLabel: "Critical" | "High" | "Watch" | "Baseline";
  rankLabel: string;
  safetyLabel: string;
  selectedId: string | null;
  sourceProofLabel: string;
  strategicQuestion: string;
  themeId: ThemeId;
  themeLabel: string;
  title: string;
  whyNow: string;
}

const STRATEGIC_QUESTION = "日本のどのライフラインが、エネルギー・物流・食料ルートの変化に晒されるか？";
const SAFETY_LABEL = "公開情報のみ / 遅延・bounded overlay";
const PROOF_SOURCE_PRIORITY = ["METI", "MAFF", "JMA", "Trade Statistics", "MLIT", "Cabinet Office", "TEPCO"] as const;

export function buildWatchboardBriefing(
  graph: SemanticGraph,
  signals: RankingSignal[],
  decision: RankingDecision,
  now: string,
  themeFilter?: ThemeId
): WatchboardBriefingViewModel | null {
  const topItem = selectDecisionItem(graph, signals, decision, themeFilter);

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
  const proofSourceLabels = buildProofSourceLabels(graph, signals, themeFilter ? [topItem] : decision.items);

  return {
    confidenceLabel: explanation.confidence.label,
    freshnessLabel: explanation.freshness.label,
    japanImpact: detail?.whyItMatters ?? "日本向けの供給・生活・政策判断への影響を優先して監視する。",
    proofSourceLabels,
    priorityTierLabel: explanation.priorityTierLabel,
    rankLabel: explanation.rankLabel ?? `#${topItem.rank}`,
    safetyLabel: SAFETY_LABEL,
    selectedId,
    sourceProofLabel: proofSourceLabels.length ? `根拠: ${proofSourceLabels.join(" / ")}` : "根拠: 公開出典",
    strategicQuestion: STRATEGIC_QUESTION,
    themeId,
    themeLabel: getThemeLabel(themeId).label,
    title: detail ? localizeAnyLabel(detail.id, detail.label) : signal.label,
    whyNow: explanation.summary
  };
}

function selectDecisionItem(
  graph: SemanticGraph,
  signals: RankingSignal[],
  decision: RankingDecision,
  themeFilter?: ThemeId
) {
  if (!themeFilter) {
    return decision.items[0];
  }

  return decision.items.find((item) => {
    const signal = signals.find((candidate) => candidate.id === item.signalId);

    return signal ? resolveRankingThemeId(graph, signal) === themeFilter : false;
  }) ?? decision.items[0];
}

function buildProofSourceLabels(
  graph: SemanticGraph,
  signals: RankingSignal[],
  decisionItems: RankingDecision["items"]
) {
  const sourceIds = new Set<string>();

  for (const item of decisionItems) {
    const signal = signals.find((candidate) => candidate.id === item.signalId);

    for (const sourceId of signal?.sourceIds ?? []) {
      sourceIds.add(sourceId);
    }
  }

  const labels = new Set<string>();

  for (const sourceId of sourceIds) {
    const source = graph.sources.find((candidate) => candidate.id === sourceId);
    const label = source ? getProofSourceLabel(source.id, `${source.label} ${source.publisher}`) : getProofSourceLabel(sourceId, sourceId);

    if (label) {
      labels.add(label);
    }
  }

  return [...labels].sort((a, b) => getProofSourcePriority(a) - getProofSourcePriority(b)).slice(0, 4);
}

function getProofSourceLabel(sourceId: string, searchableText: string) {
  const text = `${sourceId} ${searchableText}`.toLowerCase();

  if (text.includes("meti") || text.includes("enecho") || text.includes("経済産業省") || text.includes("資源エネルギー庁")) {
    return "METI";
  }

  if (text.includes("maff") || text.includes("農林水産省")) {
    return "MAFF";
  }

  if (text.includes("jma") || text.includes("気象庁")) {
    return "JMA";
  }

  if (text.includes("customs") || text.includes("trade statistics") || text.includes("関税局")) {
    return "Trade Statistics";
  }

  if (text.includes("mlit") || text.includes("国土交通省")) {
    return "MLIT";
  }

  if (text.includes("cabinet") || text.includes("内閣")) {
    return "Cabinet Office";
  }

  if (text.includes("tepco") || text.includes("東京電力")) {
    return "TEPCO";
  }

  return null;
}

function getProofSourcePriority(label: string) {
  const index = PROOF_SOURCE_PRIORITY.findIndex((candidate) => candidate === label);
  return index === -1 ? PROOF_SOURCE_PRIORITY.length : index;
}

function safelyGetDetail(graph: SemanticGraph, selectedId: string) {
  try {
    return getDetailView(graph, selectedId);
  } catch {
    return null;
  }
}
