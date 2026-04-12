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

  test("uses concrete official release pages for rice and water observations", () => {
    const graph = loadSeedGraph();
    const ricePriceSource = graph.sources.find((item) => item.id === "source:maff-rice-policy");
    const riceInventorySource = graph.sources.find((item) => item.id === "source:maff-rice-monthly-report");
    const ricePrefectureSource = graph.sources.find((item) => item.id === "source:estat-rice-prefecture-harvest-r5");
    const waterSource = graph.sources.find((item) => item.id === "source:mlit-drought-portal");

    expect(ricePriceSource?.url).toBe("https://www.maff.go.jp/j/press/nousan/kikaku/260313.html");
    expect(riceInventorySource?.url).toBe("https://www.maff.go.jp/j/press/nousan/kikaku/260331.html");
    expect(ricePrefectureSource?.url).toBe("https://www.e-stat.go.jp/dbview?sid=0002114508");
    expect(waterSource?.url).toBe("https://www.ktr.mlit.go.jp/river/shihon/river_shihon00000226.html");
  });
});
