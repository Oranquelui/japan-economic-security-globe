import { describe, expect, test } from "vitest";

import {
  loadRoadRouteEvidenceManifest,
  loadRoadRouteEvidenceManifests,
  enforceRoadOperationsSourceGate,
  loadSeedRoadOperations
} from "../../data/seed-loader";
import { isRoadDirection, validateRoadRouteSources } from "../source-gate";
import type { RoadOperationsDataset, RoadRoute, RoadSegment } from "../../../types/road-operations";

function datasetWithout(field: keyof RoadRoute): RoadOperationsDataset {
  const dataset = structuredClone(loadSeedRoadOperations());
  delete (dataset.routes[0] as Partial<RoadRoute>)[field];
  return dataset;
}

describe("road route source gate", () => {
  test("loads an evidence manifest collection that can cover every route independently", () => {
    const dataset = loadSeedRoadOperations();
    const manifests = loadRoadRouteEvidenceManifests();

    expect(manifests).toHaveLength(dataset.routes.length);
    expect(manifests.map((manifest) => manifest.routeId)).toEqual(dataset.routes.map((route) => route.id));
    expect(dataset.evidenceManifests).toEqual(manifests);
  });

  test("throws before returning a dataset that fails the source gate", () => {
    const invalid = structuredClone(loadSeedRoadOperations());
    invalid.routes[0].geometryLicense = "" as never;

    expect(() => enforceRoadOperationsSourceGate(invalid)).toThrow(/source gate.*ODbL-1.0/i);
  });

  test.each([
    ["topology source IDs", (value: RoadOperationsDataset) => { value.routes[0].topologySourceIds = []; }],
    ["license notice", (value: RoadOperationsDataset) => { value.licenseNoticePath = ""; }],
    ["declared segment", (value: RoadOperationsDataset) => { value.segments = value.segments?.slice(1); }],
    ["declared junction", (value: RoadOperationsDataset) => { value.junctions = value.junctions?.slice(1); }],
    ["geometry source linkage", (value: RoadOperationsDataset) => { value.segments![0].sourceIds = []; }],
    ["segment carriageway", (value: RoadOperationsDataset) => { value.segments![0].direction = "西行き"; }]
  ] as const)("rejects a route without complete %s", (_label, mutate) => {
    const invalid = structuredClone(loadSeedRoadOperations());
    mutate(invalid);

    expect(validateRoadRouteSources(invalid).ok).toBe(false);
  });

  test("accepts constrained carriageway and destination labels but rejects empty or arbitrary directions", () => {
    expect([
      "東行き", "上り", "内回り", "inbound", "clockwise",
      "destination:Tokyo", "provider:carriageway-A", "東京方面"
    ].every(isRoadDirection)).toBe(true);
    expect(["", " ", "destination:", "provider:", "方面", "arbitrary"].some(isRoadDirection)).toBe(false);
  });

  test("requires road identity and explicit geometry rights on every segment", () => {
    const value = loadSeedRoadOperations();

    expect(value.segments?.every((item) => (
      item.roadName === "高速湾岸線" &&
      item.routeNumber === "B" &&
      item.geometrySourceId === value.routes[0].geometrySourceId &&
      item.geometryLicense === "ODbL-1.0" &&
      item.attribution === "© OpenStreetMap contributors" &&
      item.redistributionPermitted === true
    ))).toBe(true);

    const invalid = structuredClone(value);
    delete (invalid.segments![0] as Partial<RoadSegment>).roadName;
    expect(validateRoadRouteSources(invalid).ok).toBe(false);
  });

  test("accepts a second route whose approved topology evidence comes from another official authority", () => {
    const value = structuredClone(loadSeedRoadOperations());
    const sourceSegment = value.segments![0];
    const secondRoute = {
      ...value.routes[0],
      id: "route:nationwide-example",
      label: "全国路線例",
      direction: "destination:Osaka" as const,
      anchorIds: ["junction:nationwide-a", "junction:nationwide-b"],
      segmentIds: ["segment:nationwide-a-b"],
      topologySourceIds: ["source:nexco-west-route"]
    };
    value.routes.push(secondRoute);
    value.segments!.push({
      ...sourceSegment,
      id: "segment:nationwide-a-b",
      routeId: secondRoute.id,
      fromAnchorId: secondRoute.anchorIds[0],
      toAnchorId: secondRoute.anchorIds[1],
      direction: secondRoute.direction
    });
    value.junctions!.push(
      {
        id: secondRoute.anchorIds[0], routeId: secondRoute.id, label: "全国A", coordinates: [135, 35],
        sourceIds: [secondRoute.geometrySourceId, ...secondRoute.topologySourceIds]
      },
      {
        id: secondRoute.anchorIds[1], routeId: secondRoute.id, label: "全国B", coordinates: [136, 35],
        sourceIds: [secondRoute.geometrySourceId, ...secondRoute.topologySourceIds]
      }
    );
    value.evidenceManifests.push({
      routeId: secondRoute.id,
      routeVersion: secondRoute.version,
      topologySourceIds: secondRoute.topologySourceIds,
      directionClaim: {
        direction: secondRoute.direction,
        sourceUrl: "https://www.w-nexco.co.jp/search/highway_guide/",
        accessedAt: "2026-08-08",
        claim: "公式道路案内が目的地方向を示す",
        directionEvidence: "公式事業者の路線案内による",
        reviewStatus: "approved"
      },
      anchorClaims: secondRoute.anchorIds.map((anchorId) => ({
        anchorId,
        sourceUrl: "https://www.w-nexco.co.jp/search/highway_guide/",
        accessedAt: "2026-08-08",
        claim: `${anchorId} is on the route`,
        directionEvidence: "公式事業者の路線案内による",
        reviewStatus: "approved" as const
      }))
    });

    expect(validateRoadRouteSources(value)).toEqual({ ok: true, errors: [] });
  });

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
      evidenceManifests: [{
        ...manifest,
        directionClaim: { ...manifest.directionClaim, directionEvidence: "" }
      }]
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
