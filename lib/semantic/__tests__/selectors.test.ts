import { describe, expect, it } from "vitest";
import { getThemeView } from "../selectors";
import { loadSeedGraph } from "../../data/seed-loader";
import type { SemanticGraph } from "../../../types/semantic";

const graph: SemanticGraph = {
  entities: [
    {
      id: "country:japan",
      kind: "Country",
      label: "Japan",
      summary: "Service anchor for people in Japan.",
      whyItMatters:
        "All dependency stories are interpreted through their effect on people in Japan.",
      themes: ["energy"],
      provenance: ["source:test"]
    }
  ],
  flows: [
    {
      id: "flow:test-energy",
      theme: "energy",
      label: "Test energy flow",
      originId: "country:japan",
      destinationId: "country:japan",
      resourceId: "resource:lng",
      routeIds: [],
      sourceIds: ["source:test"],
      period: "2026",
      summary: "A test flow."
    }
  ],
  observations: [],
  sources: [
    {
      id: "source:test",
      label: "Test source",
      url: "https://example.com",
      publisher: "Example",
      accessed: "2026-04-10"
    }
  ],
  edges: []
};

describe("getThemeView", () => {
  it("derives a theme view from the canonical semantic graph", () => {
    const view = getThemeView(graph, "energy");

    expect(view.id).toBe("energy");
    expect(view.title).toBe("エネルギー");
    expect(view.entities).toHaveLength(1);
    expect(view.flows).toHaveLength(1);
    expect(view.sources).toHaveLength(1);
  });

  it("loads complete thin slices for every MVP theme", () => {
    const seededGraph = loadSeedGraph();
    const themes = ["energy", "rice", "water", "defense", "semiconductors"] as const;

    for (const theme of themes) {
      const view = getThemeView(seededGraph, theme);
      const hasFlowOrObservation = view.flows.length + view.observations.length > 0;

      expect(view.entities.length, `${theme} entities`).toBeGreaterThan(0);
      expect(view.sources.length, `${theme} sources`).toBeGreaterThan(0);
      expect(hasFlowOrObservation, `${theme} flow or observation`).toBe(true);
    }
  });
});
