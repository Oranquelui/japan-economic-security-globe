import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";

describe("source quality", () => {
  test("uses a concrete METI energy source URL instead of the METI homepage", () => {
    const graph = loadSeedGraph();
    const source = graph.sources.find((item) => item.id === "source:meti-2026-energy-taskforce");

    expect(source?.url).toBeDefined();
    expect(source?.url).not.toBe("https://www.meti.go.jp/");
    expect(source?.url).toContain("meti.go.jp");
  });
});
