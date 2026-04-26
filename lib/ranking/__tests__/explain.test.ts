import { describe, expect, test } from "vitest";

import type { RankingDecisionItem, RankingOverride, RankingSignal } from "../../../types/ranking";
import { buildRankingExplanation } from "../explain";
import { computeRankingScore } from "../score";

function buildSignal(overrides: Partial<RankingSignal> = {}): RankingSignal {
  return {
    id: "ranking-signal:energy-middle-east-route",
    label: "中東エネルギー輸送路の圧力",
    importanceAxes: ["energy", "logistics"],
    canonicalRefs: [
      { kind: "flow", id: "flow:saudi-oil-japan" },
      { kind: "entity", id: "chokepoint:hormuz" }
    ],
    sourceIds: ["source:enecho-energy-trends", "source:meti-2026-energy-taskforce"],
    componentInputs: {
      nationalImportance: 0.98,
      disruptionDepth: 0.88,
      sourceConfidence: 0.9,
      publicAttention: 0.45
    },
    retrievedAt: "2026-04-25T00:00:00.000Z",
    ...overrides
  };
}

function buildDecisionItem(overrides: Partial<RankingDecisionItem> = {}): RankingDecisionItem {
  return {
    signalId: "ranking-signal:energy-middle-east-route",
    rank: 1,
    finalScore: 0.95,
    canonicalId: "flow:saudi-oil-japan",
    canonicalKind: "flow",
    primaryAxis: "energy",
    topComponentId: "nationalImportance",
    explanation: "国家的重要度が高く、日本向けの監視優先度が高い。",
    ...overrides
  };
}

describe("buildRankingExplanation", () => {
  test("builds an evidence-friendly explanation with component, freshness, and confidence context", () => {
    const signal = buildSignal();
    const score = computeRankingScore(signal, { now: "2026-04-26T00:00:00.000Z" });

    const explanation = buildRankingExplanation(signal, score, {
      decisionItem: buildDecisionItem(),
      now: "2026-04-26T00:00:00.000Z"
    });

    expect(explanation.rankLabel).toBe("#1");
    expect(explanation.summary).toBe("国家的重要度が高く、日本向けの監視優先度が高い。");
    expect(explanation.primaryAxis.label).toBe("エネルギー");
    expect(explanation.topComponent.label).toBe("国家的重要度");
    expect(explanation.confidence.label).toBe("高信頼");
    expect(explanation.freshness.label).toBe("1日前取得");
    expect(explanation.components.map((component) => component.label)).toEqual([
      "国家的重要度",
      "波及深度",
      "出典信頼度",
      "公的関心"
    ]);
    expect(explanation.canonicalRefs.map((ref) => ref.id)).toEqual([
      "flow:saudi-oil-japan",
      "chokepoint:hormuz"
    ]);
  });

  test("surfaces active override metadata when present", () => {
    const signal = buildSignal();
    const score = computeRankingScore(signal, { now: "2026-04-26T00:00:00.000Z" });
    const override: RankingOverride = {
      id: "ranking-override:energy-floor",
      reason: "Cabinet watch floor",
      explanation: "Keep visible during cross-ministry monitoring.",
      createdAt: "2026-04-25T00:00:00.000Z",
      expiresAt: "2026-04-28T00:00:00.000Z",
      signalId: signal.id,
      surfaceId: "briefing"
    };

    const explanation = buildRankingExplanation(signal, score, {
      decisionItem: buildDecisionItem({ overrideId: override.id }),
      now: "2026-04-26T00:00:00.000Z",
      override
    });

    expect(explanation.override).toEqual({
      remainingLabel: "あと2日",
      expiresLabel: "2026-04-28まで",
      explanation: "Keep visible during cross-ministry monitoring.",
      reason: "Cabinet watch floor"
    });
  });
});
