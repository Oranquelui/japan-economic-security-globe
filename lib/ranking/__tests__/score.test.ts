import { describe, expect, test } from "vitest";

import type { AttentionSignal, RankingSignal } from "../../../types/ranking";
import type { ImportanceAxis, RankingSurfaceId } from "../../../types/ranking";
import {
  DEFAULT_RANKING_POLICY,
  IMPORTANCE_AXES,
  IMPORTANCE_AXIS_LABELS,
  RANKING_SURFACE_IDS
} from "../../config/ranking-registry";
import { computeRankingScore } from "../score";

function buildSignal(overrides: Partial<RankingSignal> = {}): RankingSignal {
  return {
    id: "ranking-signal:energy-middle-east-route",
    label: "Middle East energy route",
    importanceAxes: ["energy"],
    canonicalRefs: [{ kind: "flow", id: "flow:middle-east-energy-route" }],
    sourceIds: ["source:meti-energy"],
    componentInputs: {
      nationalImportance: 0.8,
      disruptionDepth: 0.6,
      sourceConfidence: 0.9,
      publicAttention: 0.2
    },
    retrievedAt: "2026-04-25T00:00:00.000Z",
    ...overrides
  };
}

function buildAttentionSignal(overrides: Partial<AttentionSignal> = {}): AttentionSignal {
  return {
    id: "attention:x:energy-route",
    signalId: "ranking-signal:energy-middle-east-route",
    sourceLabel: "X.com",
    observedAt: "2026-04-25T00:00:00.000Z",
    score: 0.8,
    ...overrides
  };
}

describe("ranking policy registry", () => {
  test("defines the default weights with national importance first", () => {
    expect(DEFAULT_RANKING_POLICY.weights).toEqual({
      nationalImportance: 0.5,
      disruptionDepth: 0.25,
      sourceConfidence: 0.15,
      publicAttention: 0.1
    });
  });

  test("exposes the supported national-importance axes", () => {
    const axes: ImportanceAxis[] = [...IMPORTANCE_AXES];

    expect(axes).toEqual([
      "energy",
      "food",
      "semiconductors",
      "logistics",
      "disaster_infrastructure",
      "defense_industrial_base",
      "household_cost"
    ]);
    expect(IMPORTANCE_AXIS_LABELS.disaster_infrastructure).toBe("災害基盤");
  });

  test("exposes the ranking surfaces that presentation layers can target", () => {
    const surfaceIds: RankingSurfaceId[] = [...RANKING_SURFACE_IDS];

    expect(surfaceIds).toEqual(["homepage", "inbox", "preset-rail", "briefing"]);
  });
});

describe("computeRankingScore", () => {
  test("returns deterministic scores for the same inputs", () => {
    const signal = buildSignal();
    const now = "2026-04-25T12:00:00.000Z";

    const first = computeRankingScore(signal, { now, policy: DEFAULT_RANKING_POLICY });
    const second = computeRankingScore(signal, { now, policy: DEFAULT_RANKING_POLICY });

    expect(first).toEqual(second);
  });

  test("keeps national importance more influential than public attention", () => {
    const strategicallyCritical = buildSignal({
      id: "ranking-signal:critical",
      componentInputs: {
        nationalImportance: 1,
        disruptionDepth: 0.8,
        sourceConfidence: 0.9,
        publicAttention: 0
      }
    });
    const highlyDiscussed = buildSignal({
      id: "ranking-signal:viral",
      componentInputs: {
        nationalImportance: 0.1,
        disruptionDepth: 0.2,
        sourceConfidence: 0.9,
        publicAttention: 1
      }
    });

    const criticalScore = computeRankingScore(strategicallyCritical, { now: "2026-04-25T12:00:00.000Z" });
    const viralScore = computeRankingScore(highlyDiscussed, { now: "2026-04-25T12:00:00.000Z" });

    expect(criticalScore.finalScore).toBeGreaterThan(viralScore.finalScore);
  });

  test("penalizes high-attention items when source confidence is low", () => {
    const lowConfidence = buildSignal({
      componentInputs: {
        nationalImportance: 0.5,
        disruptionDepth: 0.5,
        sourceConfidence: 0.1,
        publicAttention: 0.9
      }
    });
    const highConfidence = buildSignal({
      id: "ranking-signal:high-confidence",
      componentInputs: {
        nationalImportance: 0.5,
        disruptionDepth: 0.5,
        sourceConfidence: 0.9,
        publicAttention: 0.9
      }
    });

    const lowConfidenceScore = computeRankingScore(lowConfidence, { now: "2026-04-25T12:00:00.000Z" });
    const highConfidenceScore = computeRankingScore(highConfidence, { now: "2026-04-25T12:00:00.000Z" });

    expect(lowConfidenceScore.finalScore).toBeLessThan(highConfidenceScore.finalScore);
  });

  test("clamps scores into the public 0 to 1 range", () => {
    const signal = buildSignal({
      componentInputs: {
        nationalImportance: 4,
        disruptionDepth: 3,
        sourceConfidence: 2,
        publicAttention: 2
      }
    });

    const score = computeRankingScore(signal, { now: "2026-04-25T12:00:00.000Z" });

    expect(score.finalScore).toBeLessThanOrEqual(1);
    expect(score.finalScore).toBeGreaterThanOrEqual(0);
    expect(score.components.every((component) => component.value >= 0 && component.value <= 1)).toBe(true);
  });

  test("decays stale attention observations", () => {
    const signal = buildSignal({
      componentInputs: {
        nationalImportance: 0.4,
        disruptionDepth: 0.4,
        sourceConfidence: 0.9,
        publicAttention: 0
      }
    });

    const recentScore = computeRankingScore(signal, {
      now: "2026-04-25T12:00:00.000Z",
      attentionSignals: [buildAttentionSignal({ observedAt: "2026-04-24T12:00:00.000Z", score: 1 })]
    });
    const staleScore = computeRankingScore(signal, {
      now: "2026-04-25T12:00:00.000Z",
      attentionSignals: [buildAttentionSignal({ observedAt: "2026-04-10T12:00:00.000Z", score: 1 })]
    });

    const recentAttention = recentScore.components.find((component) => component.id === "publicAttention");
    const staleAttention = staleScore.components.find((component) => component.id === "publicAttention");

    expect(recentAttention?.value).toBeGreaterThan(staleAttention?.value ?? 0);
    expect(recentScore.finalScore).toBeGreaterThan(staleScore.finalScore);
  });

  test("rejects signals without canonical references", () => {
    const signal = buildSignal({
      canonicalRefs: [] as unknown as RankingSignal["canonicalRefs"]
    });

    expect(() => computeRankingScore(signal, { now: "2026-04-25T12:00:00.000Z" })).toThrow(
      "Ranking signals require at least one canonical reference."
    );
  });
});
