import { describe, expect, test } from "vitest";

import { ATTENTION_SOURCE_REGISTRY } from "../../config/ranking-registry";
import {
  FixtureAttentionSourceAdapter,
  loadAttentionSignals,
  normalizeAttentionSignals
} from "../attention";
import { computeRankingScore } from "../score";
import type { RankingSignal } from "../../../types/ranking";

function buildSignal(overrides: Partial<RankingSignal> = {}): RankingSignal {
  return {
    id: "ranking-signal:energy-middle-east-route",
    label: "中東エネルギー輸送路の圧力",
    importanceAxes: ["energy"],
    canonicalRefs: [{ kind: "flow", id: "flow:saudi-oil-japan" }],
    sourceIds: ["source:enecho-energy-trends"],
    componentInputs: {
      nationalImportance: 0.95,
      disruptionDepth: 0.82,
      sourceConfidence: 0.9,
      publicAttention: 0.1
    },
    retrievedAt: "2026-04-25T00:00:00.000Z",
    ...overrides
  };
}

describe("attention adapter seam", () => {
  test("normalizes allowed attention observations into ranking signals", () => {
    const normalized = normalizeAttentionSignals("fixture-public-interest", [
      {
        semanticId: "ranking-signal:energy-middle-east-route",
        score: 0.72,
        observedAt: "2026-04-26T00:00:00.000Z",
        url: "https://example.com/energy"
      }
    ]);

    expect(ATTENTION_SOURCE_REGISTRY["fixture-public-interest"]).toEqual(
      expect.objectContaining({
        enabled: true,
        termsStatus: "allowed"
      })
    );
    expect(normalized).toEqual([
      expect.objectContaining({
        id: "attention:fixture-public-interest:ranking-signal:energy-middle-east-route",
        signalId: "ranking-signal:energy-middle-east-route",
        sourceLabel: "Public attention fixture",
        score: 0.72,
        url: "https://example.com/energy"
      })
    ]);
  });

  test("missing attention data degrades gracefully without failing ranking", async () => {
    const adapter = new FixtureAttentionSourceAdapter("fixture-public-interest", {});
    const signal = buildSignal();
    const attentionSignals = await loadAttentionSignals([signal.id], adapter, "2026-04-26T00:00:00.000Z");

    expect(attentionSignals).toEqual([]);
    expect(() =>
      computeRankingScore(signal, {
        attentionSignals,
        now: "2026-04-26T00:00:00.000Z"
      })
    ).not.toThrow();
  });

  test("stale attention from the adapter still decays through the scoring layer", async () => {
    const signal = buildSignal({
      componentInputs: {
        nationalImportance: 0.4,
        disruptionDepth: 0.4,
        sourceConfidence: 0.9,
        publicAttention: 0
      }
    });
    const recentAdapter = new FixtureAttentionSourceAdapter("fixture-public-interest", {
      [signal.id]: {
        score: 1,
        observedAt: "2026-04-25T00:00:00.000Z"
      }
    });
    const staleAdapter = new FixtureAttentionSourceAdapter("fixture-public-interest", {
      [signal.id]: {
        score: 1,
        observedAt: "2026-04-10T00:00:00.000Z"
      }
    });

    const recentAttention = await loadAttentionSignals([signal.id], recentAdapter, "2026-04-26T00:00:00.000Z");
    const staleAttention = await loadAttentionSignals([signal.id], staleAdapter, "2026-04-26T00:00:00.000Z");
    const recentScore = computeRankingScore(signal, {
      attentionSignals: recentAttention,
      now: "2026-04-26T00:00:00.000Z"
    });
    const staleScore = computeRankingScore(signal, {
      attentionSignals: staleAttention,
      now: "2026-04-26T00:00:00.000Z"
    });

    expect(recentScore.finalScore).toBeGreaterThan(staleScore.finalScore);
  });

  test("blocked or disabled sources are rejected before they can influence ranking", async () => {
    const adapter = new FixtureAttentionSourceAdapter("x-japan", {
      "ranking-signal:energy-middle-east-route": {
        score: 0.99,
        observedAt: "2026-04-26T00:00:00.000Z"
      }
    });

    expect(ATTENTION_SOURCE_REGISTRY["x-japan"]).toEqual(
      expect.objectContaining({
        enabled: false,
        termsStatus: "blocked"
      })
    );
    await expect(
      loadAttentionSignals(["ranking-signal:energy-middle-east-route"], adapter, "2026-04-26T00:00:00.000Z")
    ).resolves.toEqual([]);
  });
});
