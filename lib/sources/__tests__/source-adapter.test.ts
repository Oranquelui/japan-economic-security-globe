import { describe, expect, it } from "vitest";

import {
  SOURCE_ACCESS_METHODS,
  SOURCE_OUTPUT_KINDS,
  SOURCE_ADAPTER_REGISTRY,
  normalizeSourceAdapterResult
} from "../source-adapter";

describe("source adapter foundation", () => {
  it("declares the supported official source access methods and normalized outputs", () => {
    expect(SOURCE_ACCESS_METHODS).toEqual([
      "api",
      "sparql",
      "ckan",
      "csv",
      "excel",
      "geojson",
      "tile",
      "pdf",
      "html"
    ]);

    expect(SOURCE_OUTPUT_KINDS).toEqual([
      "SourceSnapshot",
      "EvidenceClaim",
      "GeoFeature",
      "TimeSeriesObservation",
      "PolicySignal"
    ]);
  });

  it("registers initial adapter families for existing and planned themes", () => {
    expect(SOURCE_ADAPTER_REGISTRY.map((adapter) => adapter.id)).toEqual([
      "adapter:e-stat-api",
      "adapter:e-gov-data-portal",
      "adapter:gsi-tiles",
      "adapter:g-spatial-ckan",
      "adapter:mod-publication-pages",
      "adapter:jaxa-gportal",
      "adapter:jepx-market-data",
      "adapter:mhlw-drug-supply"
    ]);

    expect(SOURCE_ADAPTER_REGISTRY).toContainEqual(
      expect.objectContaining({
        id: "adapter:mod-publication-pages",
        accessMethod: "html",
        nonLiveBoundary: true
      })
    );
  });

  it("normalizes adapter output into a provenance-ready source snapshot", () => {
    const result = normalizeSourceAdapterResult({
      sourceId: "source:mod-north-korea-missile-info",
      capturedAt: "2026-06-19",
      sourceUrl: "https://www.mod.go.jp/j/surround/northKorea/index.html",
      accessMethod: "html",
      outputKinds: ["SourceSnapshot", "EvidenceClaim", "GeoFeature"],
      provenanceNote: "Official MOD publication page; parsed as non-live public context."
    });

    expect(result).toEqual({
      id: "source-snapshot:source:mod-north-korea-missile-info:2026-06-19",
      sourceId: "source:mod-north-korea-missile-info",
      capturedAt: "2026-06-19",
      sourceUrl: "https://www.mod.go.jp/j/surround/northKorea/index.html",
      accessMethod: "html",
      outputKinds: ["SourceSnapshot", "EvidenceClaim", "GeoFeature"],
      provenanceNote: "Official MOD publication page; parsed as non-live public context."
    });
  });
});
