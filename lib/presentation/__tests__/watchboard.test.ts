import { describe, expect, test } from "vitest";

import { loadSeedGraph, loadSeedRankingSignals } from "../../data/seed-loader";
import { buildRankingDecision } from "../../ranking/decision";
import { buildWatchboardBriefing } from "../watchboard";

describe("watchboard presentation", () => {
  test("builds a today-for-japan briefing from the top-ranked signal", () => {
    const graph = loadSeedGraph();
    const signals = loadSeedRankingSignals();
    const decision = buildRankingDecision({
      surfaceId: "homepage",
      signals,
      now: "2026-04-26T00:00:00.000Z"
    });

    const briefing = buildWatchboardBriefing(graph, signals, decision, "2026-04-26T00:00:00.000Z");

    expect(briefing).toEqual(
      expect.objectContaining({
        rankLabel: "#1",
        themeId: "energy",
        themeLabel: "エネルギー",
        title: "サウジ原油 → 日本",
        freshnessLabel: "1日前取得",
        confidenceLabel: "高信頼",
        whyNow: "国家的重要度が高く、日本向けの監視優先度が高い。"
      })
    );
  });
});
