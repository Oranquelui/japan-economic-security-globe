import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildSourcesLicenseCatalog, resolveSourceCategory } from "../source-catalog";
import type { SourceCategory, SourceDocument } from "../../../types/semantic";

describe("buildSourcesLicenseCatalog", () => {
  test("supports the three source categories in deterministic order", () => {
    const catalog = buildSourcesLicenseCatalog(loadSeedGraph().sources);

    expect(catalog.groups.map((group) => [group.id, group.title])).toEqual([
      ["official", "政府・公的機関ソース"],
      ["open-data", "公開・オープンデータ"],
      ["private", "民間企業ソース"]
    ]);

    const naturalEarthId = "source:natural-earth-admin1-japan-5-1-1";
    const naturalEarth = catalog.groups
      .find((group) => group.id === "open-data")
      ?.items.find((item) => item.id === naturalEarthId);
    expect(naturalEarth).toBeDefined();
    expect(naturalEarth?.rights).toMatchObject({
      artifactVersion: "natural-earth-5.1.1-japan-prefectures-v2",
      processingDate: "2026-07-18"
    });
    expect(catalog.groups.find((group) => group.id === "official")?.items.map((item) => item.id)).not.toContain(
      naturalEarthId
    );
    expect(catalog.groups.find((group) => group.id === "private")?.items.map((item) => item.id)).not.toContain(
      naturalEarthId
    );

    const eStatId = "source:estat-rice-prefecture-harvest-r5";
    expect(catalog.groups.find((group) => group.id === "official")?.items.map((item) => item.id)).toContain(eStatId);
  });

  test("keeps legacy official flags backward compatible when sourceCategory is absent", () => {
    const legacySources: SourceDocument[] = [
      source("source:implicit-official", {}),
      source("source:explicit-official", { official: true }),
      source("source:private", { official: false })
    ];
    const catalog = buildSourcesLicenseCatalog(legacySources);

    expect(catalog.groups.find((group) => group.id === "official")?.items.map((item) => item.id)).toEqual([
      "source:explicit-official",
      "source:implicit-official"
    ]);
    expect(catalog.groups.find((group) => group.id === "private")?.items.map((item) => item.id)).toEqual([
      "source:private"
    ]);
    expect(resolveSourceCategory(legacySources[0])).toBe("official");
    expect(resolveSourceCategory(legacySources[1])).toBe("official");
    expect(resolveSourceCategory(legacySources[2])).toBe("private");
  });

  test("treats sourceCategory as authoritative and exposes three-category policy copy", () => {
    const categories: SourceCategory[] = ["official", "open-data", "private"];
    const catalog = buildSourcesLicenseCatalog(
      categories.map((sourceCategory) => source(`source:${sourceCategory}`, { sourceCategory, official: true }))
    );

    expect(catalog.groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ["source:official"],
      ["source:open-data"],
      ["source:private"]
    ]);
    expect(catalog.policySummary).toContain("オープンデータ");
    expect(catalog.policySummary).toContain("民間");
    expect(catalog.sourceSummary).toContain("公開・オープンデータ");
    expect(catalog.sourceSummary).toContain("民間企業ソース");
    expect(catalog.licenseSummary).toContain("コード");
    expect(catalog.groups.find((group) => group.id === "open-data")?.description).toContain("利用条件");
    expect(resolveSourceCategory(source("source:category-wins", { sourceCategory: "open-data", official: true }))).toBe(
      "open-data"
    );
  });
});

function source(id: string, overrides: Partial<SourceDocument>): SourceDocument {
  return {
    id,
    label: id,
    url: `https://example.com/${id}`,
    publisher: "Test publisher",
    accessed: "2026-07-18",
    ...overrides
  };
}
