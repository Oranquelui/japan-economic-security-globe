import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildEvidenceGraph, buildGlobeFlows } from "../view-models";

describe("semantic view models", () => {
  test("builds Energy-led globe flows with route entities", () => {
    const graph = loadSeedGraph();

    const flows = buildGlobeFlows(graph, "energy");

    expect(flows.map((flow) => flow.id)).toContain("flow:qatar-lng-japan");
    expect(flows.find((flow) => flow.id === "flow:qatar-lng-japan")?.route.map((entity) => entity.id)).toEqual(
      expect.arrayContaining(["chokepoint:hormuz", "chokepoint:malacca", "terminal:sodegaura-lng"])
    );
  });

  test("builds a compact evidence graph for a selected theme", () => {
    const graph = loadSeedGraph();

    const evidenceGraph = buildEvidenceGraph(graph, "rice");

    expect(evidenceGraph.nodes.map((node) => node.id)).toContain("product:rice");
    expect(evidenceGraph.links.some((link) => link.label === "observedAt")).toBe(true);
  });
});
