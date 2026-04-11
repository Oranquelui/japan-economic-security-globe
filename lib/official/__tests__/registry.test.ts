import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildThemeOfficialCoverage, getOfficialSourceCatalog } from "../registry";

describe("official source registry", () => {
  test("exposes official access metadata for core sources", () => {
    const catalog = getOfficialSourceCatalog();
    const kokkai = catalog.find((entry) => entry.id === "source:kokkai-api");
    const estat = catalog.find((entry) => entry.id === "source:estat-lod-sparql");
    const customs = catalog.find((entry) => entry.id === "source:customs-trade-statistics");

    expect(kokkai).toEqual(
      expect.objectContaining({
        official: true,
        accessMode: "api",
        tier: "A"
      })
    );
    expect(estat).toEqual(
      expect.objectContaining({
        official: true,
        accessMode: "sparql",
        tier: "A"
      })
    );
    expect(customs).toEqual(
      expect.objectContaining({
        official: true,
        accessMode: "html",
        tier: "B"
      })
    );
  });

  test("builds theme coverage using official-first source metadata", () => {
    const graph = loadSeedGraph();

    const coverage = buildThemeOfficialCoverage(graph, "energy");

    expect(coverage.totalSources).toBe(4);
    expect(coverage.officialSources).toBe(3);
    expect(coverage.apiLikeSources).toBe(0);
    expect(coverage.documentSources).toBe(4);
    expect(coverage.primaryModes).toEqual(expect.arrayContaining(["html", "pdf"]));
  });
});
