import { describe, expect, test } from "vitest";

import { DEFAULT_RANKING_POLICY } from "../../config/ranking-registry";
import { loadSeedGraph, loadSeedRankingSignals } from "../../data/seed-loader";
import { buildOperationRows } from "../../presentation/operations";
import {
  applyRankingToOperationRows,
  buildHomepageLeadSelection,
  buildPresetRailThemeOrder
} from "../../presentation/ranking";
import { getThemeView } from "../../semantic/selectors";
import type { RankingOverride, RankingSignal } from "../../../types/ranking";
import { THEME_IDS } from "../../../types/semantic";
import { buildRankingDecision } from "../decision";

function buildSignal(overrides: Partial<RankingSignal> = {}): RankingSignal {
  return {
    id: "ranking-signal:alpha",
    label: "Alpha",
    importanceAxes: ["energy"],
    canonicalRefs: [{ kind: "flow", id: "flow:saudi-oil-japan" }],
    sourceIds: ["source:enecho-energy-trends"],
    componentInputs: {
      nationalImportance: 0.75,
      disruptionDepth: 0.64,
      sourceConfidence: 0.9,
      publicAttention: 0.2
    },
    retrievedAt: "2026-04-25T00:00:00.000Z",
    ...overrides
  };
}

describe("buildRankingDecision", () => {
  test("selects the most nationally significant items first on the homepage", () => {
    const decision = buildRankingDecision({
      surfaceId: "homepage",
      signals: loadSeedRankingSignals(),
      now: "2026-04-26T00:00:00.000Z"
    });

    expect(decision.surfaceId).toBe("homepage");
    expect(decision.policyVersion).toBe(DEFAULT_RANKING_POLICY.version);
    expect(decision.items.slice(0, 3).map((item) => item.signalId)).toEqual([
      "ranking-signal:energy-middle-east-route",
      "ranking-signal:semiconductors-kumamoto-exposure",
      "ranking-signal:food-rice-price-pressure"
    ]);
    expect(decision.items[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        canonicalId: "flow:saudi-oil-japan",
        primaryAxis: "energy",
        topComponentId: "nationalImportance"
      })
    );
  });

  test("applies only active overrides that match the active surface", () => {
    const alpha = buildSignal();
    const beta = buildSignal({
      id: "ranking-signal:beta",
      label: "Beta",
      canonicalRefs: [{ kind: "observation", id: "observation:rice-price-signal-2026" }],
      importanceAxes: ["food"],
      componentInputs: {
        nationalImportance: 0.7,
        disruptionDepth: 0.64,
        sourceConfidence: 0.9,
        publicAttention: 0.2
      }
    });
    const activeOverride: RankingOverride = {
      id: "ranking-override:beta-promote",
      reason: "Cabinet watch floor",
      explanation: "Promote for the inbox shift handoff.",
      createdAt: "2026-04-25T00:00:00.000Z",
      expiresAt: "2026-04-27T00:00:00.000Z",
      signalId: beta.id,
      surfaceId: "inbox"
    };
    const expiredOverride: RankingOverride = {
      ...activeOverride,
      id: "ranking-override:expired",
      expiresAt: "2026-04-24T00:00:00.000Z"
    };

    const boosted = buildRankingDecision({
      surfaceId: "inbox",
      signals: [alpha, beta],
      overrides: [activeOverride],
      now: "2026-04-26T00:00:00.000Z"
    });
    const ignored = buildRankingDecision({
      surfaceId: "homepage",
      signals: [alpha, beta],
      overrides: [activeOverride, expiredOverride],
      now: "2026-04-26T00:00:00.000Z"
    });

    expect(boosted.items.map((item) => item.signalId)).toEqual([
      "ranking-signal:beta",
      "ranking-signal:alpha"
    ]);
    expect(boosted.items[0]).toEqual(
      expect.objectContaining({
        overrideId: "ranking-override:beta-promote"
      })
    );
    expect(ignored.items.map((item) => item.signalId)).toEqual([
      "ranking-signal:alpha",
      "ranking-signal:beta"
    ]);
    expect(ignored.items.every((item) => item.overrideId === undefined)).toBe(true);
  });
});

describe("ranking presentation helpers", () => {
  test("maps the homepage lead back to a selectable theme and canonical item", () => {
    const graph = loadSeedGraph();
    const decision = buildRankingDecision({
      surfaceId: "homepage",
      signals: loadSeedRankingSignals(),
      now: "2026-04-26T00:00:00.000Z"
    });

    expect(buildHomepageLeadSelection(graph, loadSeedRankingSignals(), decision)).toEqual({
      selectedId: "flow:saudi-oil-japan",
      themeId: "energy"
    });
  });

  test("decorates operation rows with ranking metadata and sorts ranked items first", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");
    const rows = buildOperationRows(view);
    const decision = buildRankingDecision({
      surfaceId: "inbox",
      signals: loadSeedRankingSignals(),
      now: "2026-04-26T00:00:00.000Z"
    });

    const rankedRows = applyRankingToOperationRows(rows, loadSeedRankingSignals(), decision);

    expect(rankedRows[0]).toEqual(
      expect.objectContaining({
        id: "flow:saudi-oil-japan",
        ranking: expect.objectContaining({
          rank: 1,
          signalId: "ranking-signal:energy-middle-east-route",
          priorityTier: "critical",
          primaryAxis: "energy",
          topComponentId: "nationalImportance"
        })
      })
    );
    expect(rankedRows[1]).toEqual(
      expect.objectContaining({
        id: "flow:qatar-lng-japan",
        ranking: expect.objectContaining({
          rank: 4,
          signalId: "ranking-signal:energy-lng-terminal-exposure"
        })
      })
    );
  });

  test("reorders stable preset themes by the strongest ranked signal without dropping any base theme", () => {
    const graph = loadSeedGraph();
    const decision = buildRankingDecision({
      surfaceId: "preset-rail",
      signals: loadSeedRankingSignals(),
      now: "2026-04-26T00:00:00.000Z"
    });

    const orderedThemes = buildPresetRailThemeOrder(THEME_IDS, graph, loadSeedRankingSignals(), decision);

    expect(new Set(orderedThemes)).toEqual(new Set(THEME_IDS));
    expect(orderedThemes.slice(0, 3)).toEqual(["energy", "semiconductors", "rice"]);
  });
});
