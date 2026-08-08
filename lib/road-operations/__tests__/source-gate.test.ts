import { describe, expect, test } from "vitest";

import { loadRoadRouteEvidenceManifest, loadSeedRoadOperations } from "../../data/seed-loader";
import { validateRoadRouteSources } from "../source-gate";
import type { RoadOperationsDataset, RoadRoute } from "../../../types/road-operations";

function datasetWithout(field: keyof RoadRoute): RoadOperationsDataset {
  const dataset = structuredClone(loadSeedRoadOperations());
  delete (dataset.routes[0] as Partial<RoadRoute>)[field];
  return dataset;
}

describe("road route source gate", () => {
  test("loads only a route that passes the evidence and reuse gate", () => {
    const dataset = loadSeedRoadOperations();
    const result = validateRoadRouteSources(dataset);

    expect(result).toEqual({ ok: true, errors: [] });
    expect(dataset.routes[0]).toMatchObject({
      version: expect.any(String),
      direction: "東行き",
      topologySourceIds: ["source:shutoko-bayshore-route", "source:shutoko-jct-guide"],
      geometrySourceId: "source:openstreetmap-road-geometry",
      geometryLicense: "ODbL-1.0",
      attribution: "© OpenStreetMap contributors",
      redistributionPermitted: true
    });
  });

  test("requires complete direction evidence in the approved anchor-by-anchor manifest", () => {
    const dataset = loadSeedRoadOperations();
    const manifest = loadRoadRouteEvidenceManifest();
    const withoutDirectionEvidence = {
      ...dataset,
      evidenceManifest: {
        ...manifest,
        directionClaim: { ...manifest.directionClaim, directionEvidence: "" }
      }
    };

    expect(manifest.routeId).toBe("live-logistics:road-keihin-tokyo");
    expect(manifest.directionClaim).toMatchObject({
      direction: "東行き",
      sourceUrl: expect.stringMatching(/^https:\/\/www\.shutoko\.jp\//),
      accessedAt: expect.stringMatching(/^2026-08-/),
      reviewStatus: "approved"
    });
    expect(manifest.anchorClaims.map((claim) => claim.anchorId)).toEqual([
      "road-junction:honmoku-futo",
      "road-junction:honmoku-jct",
      "road-junction:daikoku-jct",
      "road-junction:kawasaki-ukishima-jct",
      "road-junction:oi-jct",
      "road-junction:tatsumi-jct",
      "road-junction:tokyo-bay-distribution"
    ]);
    expect(validateRoadRouteSources(withoutDirectionEvidence).ok).toBe(false);
  });

  test.each(["geometryVersion", "geometryExtractedAt", "geometrySourceUrl"] as const)("rejects route data without %s", (field) => {
    expect(validateRoadRouteSources(datasetWithout(field)).ok).toBe(false);
  });
});
