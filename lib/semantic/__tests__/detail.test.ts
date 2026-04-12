import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getDetailView } from "../detail";

describe("getDetailView", () => {
  test("builds an evidence-ready detail view for an energy dependency flow", () => {
    const graph = loadSeedGraph();

    const detail = getDetailView(graph, "flow:qatar-lng-japan");

    expect(detail.label).toBe("Qatar LNG to Japan");
    expect(detail.kind).toBe("DependencyFlow");
    expect(detail.sources.map((source) => source.id)).toContain("source:meti-2026-energy-taskforce");
    expect(detail.sources[0]).toEqual(
      expect.objectContaining({
        official: true,
        accessMode: expect.any(String)
      })
    );
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining([
        "country:qatar",
        "country:japan",
        "resource:lng",
        "chokepoint:hormuz",
        "chokepoint:malacca",
        "terminal:sodegaura-lng"
      ])
    );
    expect(detail.signal.category).toBe("海上ルート依存");
    expect(detail.signal.watchpoints).toEqual(expect.arrayContaining(["ホルムズ海峡", "マラッカ海峡", "燃料費調整", "国内着地点"]));
    expect(detail.sourceHighlights.length).toBeGreaterThan(0);
    expect(detail.sparql.title).toBe("SPARQL preview for Qatar LNG to Japan");
    expect(detail.sparql.query).toContain("prov:wasDerivedFrom");
    expect(detail.sparql.query).toContain("<https://data.jp-strategic-dependency-graph.org/id/flow/qatar-lng-japan>");
    expect(detail.sparql.query).toContain("jpsdg:transitsVia");
  });

  test("builds source-specific claims for important energy entities", () => {
    const graph = loadSeedGraph();

    const detail = getDetailView(graph, "chokepoint:hormuz");

    expect(detail.kind).toBe("Chokepoint");
    expect(detail.sourceHighlights.some((item) => item.sourceId === "source:enecho-energy-trends" && item.claim.includes("ホルムズ海峡"))).toBe(true);
    expect(detail.sourceHighlights.some((item) => item.sourceId === "source:customs-trade-statistics" && item.claim.includes("国別依存"))).toBe(true);
  });
});
