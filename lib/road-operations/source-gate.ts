import type { RoadOperationsDataset } from "../../types/road-operations";

const REQUIRED_ANCHOR_IDS = [
  "road-junction:honmoku-futo",
  "road-junction:honmoku-jct",
  "road-junction:daikoku-jct",
  "road-junction:kawasaki-ukishima-jct",
  "road-junction:oi-jct",
  "road-junction:tatsumi-jct",
  "road-junction:tokyo-bay-distribution"
];

export interface RoadRouteSourceGateResult {
  ok: boolean;
  errors: string[];
}

export function validateRoadRouteSources(dataset: RoadOperationsDataset): RoadRouteSourceGateResult {
  const errors: string[] = [];

  for (const route of dataset.routes) {
    if (!route.version) errors.push(`${route.id}: version is required`);
    if (!route.direction) errors.push(`${route.id}: direction is required`);
    if (!route.geometrySourceId) errors.push(`${route.id}: geometrySourceId is required`);
    if (!route.geometryVersion) errors.push(`${route.id}: geometryVersion is required`);
    if (!route.geometryExtractedAt) errors.push(`${route.id}: geometryExtractedAt is required`);
    if (!route.geometrySourceUrl?.startsWith("https://www.openstreetmap.org/")) {
      errors.push(`${route.id}: OpenStreetMap geometry source URL is required`);
    }
    if (route.geometryLicense !== "ODbL-1.0") errors.push(`${route.id}: ODbL-1.0 is required`);
    if (route.attribution !== "© OpenStreetMap contributors") {
      errors.push(`${route.id}: OpenStreetMap attribution is required`);
    }
    if (route.redistributionPermitted !== true) {
      errors.push(`${route.id}: redistribution permission is required`);
    }

    const manifest = dataset.evidenceManifest;
    if (manifest.routeId !== route.id || manifest.routeVersion !== route.version) {
      errors.push(`${route.id}: evidence manifest does not match route version`);
    }
    if (
      manifest.directionClaim.direction !== route.direction ||
      manifest.directionClaim.reviewStatus !== "approved" ||
      !manifest.directionClaim.sourceUrl.startsWith("https://www.shutoko.jp/") ||
      !manifest.directionClaim.accessedAt ||
      !manifest.directionClaim.claim ||
      !manifest.directionClaim.directionEvidence
    ) {
      errors.push(`${route.id}: approved direction evidence is required`);
    }
    if (JSON.stringify(route.anchorIds) !== JSON.stringify(REQUIRED_ANCHOR_IDS)) {
      errors.push(`${route.id}: route anchors are incomplete or out of order`);
    }
    if (
      manifest.anchorClaims.length !== REQUIRED_ANCHOR_IDS.length ||
      manifest.anchorClaims.some((claim, index) => (
        claim.anchorId !== REQUIRED_ANCHOR_IDS[index] ||
        claim.reviewStatus !== "approved" ||
        !claim.sourceUrl.startsWith("https://www.shutoko.jp/") ||
        !claim.accessedAt ||
        !claim.claim ||
        !claim.directionEvidence
      ))
    ) {
      errors.push(`${route.id}: approved anchor-by-anchor evidence is required`);
    }
  }

  return { ok: errors.length === 0, errors };
}
