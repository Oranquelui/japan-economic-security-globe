import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildSourcesLicenseCatalog } from "../source-catalog";

describe("buildSourcesLicenseCatalog", () => {
  test("groups official and private sources and exposes Japanese policy copy", () => {
    const catalog = buildSourcesLicenseCatalog(loadSeedGraph().sources);

    expect(catalog.groups.find((group) => group.id === "official")?.items.length).toBeGreaterThan(0);
    expect(catalog.groups.find((group) => group.id === "private")?.items.length).toBeGreaterThan(0);
    expect(catalog.policySummary).toContain("民間");
    expect(catalog.licenseSummary).toContain("コード");
  });
});
