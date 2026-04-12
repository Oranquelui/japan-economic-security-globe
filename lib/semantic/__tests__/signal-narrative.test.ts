import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildSignalNarrativeForFlow, buildSignalNarrativeForObservation } from "../signal-narrative";

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
});
