import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import {
  buildSignalNarrativeForFlow,
  buildSignalNarrativeForObservation,
  buildSourceHighlightsFromFlow
} from "../signal-narrative";

describe("signal narratives", () => {
  test("turns rice price data into a user-facing pressure signal", () => {
    const graph = loadSeedGraph();
    const observation = graph.observations.find((item) => item.id === "observation:rice-price-signal-2026");

    expect(observation).toBeDefined();

    const narrative = buildSignalNarrativeForObservation(observation!);

    expect(narrative.category).toBe("価格圧力");
    expect(narrative.recommendedAction).toContain("価格");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["次月価格", "民間在庫", "政策介入"]));
  });

  test("turns LNG route data into a route-dependency signal", () => {
    const graph = loadSeedGraph();
    const flow = graph.flows.find((item) => item.id === "flow:qatar-lng-japan");

    expect(flow).toBeDefined();

    const narrative = buildSignalNarrativeForFlow(flow!);

    expect(narrative.category).toBe("海上ルート依存");
    expect(narrative.recommendedAction).toContain("LNG");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["ホルムズ海峡", "マラッカ海峡", "電気料金"]));
  });

  test("turns rice input data into an input-cost pass-through signal", () => {
    const graph = loadSeedGraph();
    const flow = graph.flows.find((item) => item.id === "flow:energy-inputs-rice");

    expect(flow).toBeDefined();

    const narrative = buildSignalNarrativeForFlow(flow!);

    expect(narrative.category).toBe("投入コスト波及");
    expect(narrative.recommendedAction).toContain("相対取引価格");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["肥料原料", "相対取引価格", "民間在庫"]));
  });

  test("turns defense budget data into a capability-priority signal", () => {
    const graph = loadSeedGraph();
    const flow = graph.flows.find((item) => item.id === "flow:defense-budget-standoff");

    expect(flow).toBeDefined();

    const narrative = buildSignalNarrativeForFlow(flow!);
    const highlights = buildSourceHighlightsFromFlow(flow!, graph.sources.filter((source) => flow!.sourceIds.includes(source.id)));

    expect(narrative.category).toBe("能力優先配分");
    expect(narrative.recommendedAction).toContain("スタンド・オフ");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["予算額", "能力領域", "継続性"]));
    expect(highlights.some((item) => item.claim.includes("約9,733億円"))).toBe(true);
  });

  test("turns Dutch semiconductor equipment data into an equipment-dependency signal", () => {
    const graph = loadSeedGraph();
    const flow = graph.flows.find((item) => item.id === "flow:netherlands-equipment-japan");

    expect(flow).toBeDefined();

    const narrative = buildSignalNarrativeForFlow(flow!);

    expect(narrative.category).toBe("装置依存");
    expect(narrative.recommendedAction).toContain("装置");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["装置供給", "代替調達", "国内製造"]));
  });

  test("turns semiconductor policy data into an industrial-base policy signal", () => {
    const graph = loadSeedGraph();
    const observation = graph.observations.find((item) => item.id === "observation:semiconductor-policy-signal-2026");

    expect(observation).toBeDefined();

    const narrative = buildSignalNarrativeForObservation(observation!);

    expect(narrative.category).toBe("産業基盤政策");
    expect(narrative.recommendedAction).toContain("政策");
    expect(narrative.watchpoints).toEqual(expect.arrayContaining(["設備投資", "政策文書", "貿易統計"]));
  });
});
