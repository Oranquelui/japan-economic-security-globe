import type { RoadDirection, RoadOperationsDataset } from "../../types/road-operations";

const FIXED_DIRECTIONS = new Set<RoadDirection>([
  "東行き", "西行き", "北行き", "南行き", "上り", "下り", "内回り", "外回り",
  "eastbound", "westbound", "northbound", "southbound", "inbound", "outbound",
  "clockwise", "counterclockwise", "destination-bound", "general"
]);

export function isRoadDirection(value: unknown): value is RoadDirection {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) return false;
  if (FIXED_DIRECTIONS.has(value as RoadDirection)) return true;
  if (/^(destination|provider):\S+$/.test(value)) return true;
  return value.length > 2 && value.endsWith("方面");
}

export interface RoadRouteSourceGateResult {
  ok: boolean;
  errors: string[];
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateRoadRouteSources(dataset: RoadOperationsDataset): RoadRouteSourceGateResult {
  const errors: string[] = [];

  if (!dataset.licenseNoticePath?.startsWith("data/seed/licenses/") || !dataset.licenseNoticePath.endsWith(".md")) {
    errors.push("dataset: ODbL license notice path is required");
  }
  if (dataset.routes.length === 0) errors.push("dataset: at least one route is required");
  const manifestRouteIds = dataset.evidenceManifests?.map((item) => item.routeId) ?? [];
  if (
    manifestRouteIds.length !== dataset.routes.length ||
    new Set(manifestRouteIds).size !== manifestRouteIds.length
  ) {
    errors.push("dataset: exactly one evidence manifest is required for every route");
  }

  for (const route of dataset.routes) {
    if (!route.version) errors.push(`${route.id}: version is required`);
    if (!isRoadDirection(route.direction)) errors.push(`${route.id}: valid direction is required`);
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

    if (
      route.topologySourceIds.length === 0 ||
      route.topologySourceIds.some((sourceId) => !sourceId.startsWith("source:"))
    ) {
      errors.push(`${route.id}: topology source IDs are required`);
    }

    const manifest = dataset.evidenceManifests?.find((item) => item.routeId === route.id);
    if (!manifest) {
      errors.push(`${route.id}: route evidence manifest is required`);
      continue;
    }
    if (manifest.routeId !== route.id || manifest.routeVersion !== route.version) {
      errors.push(`${route.id}: evidence manifest does not match route version`);
    }
    if (JSON.stringify(manifest.topologySourceIds) !== JSON.stringify(route.topologySourceIds)) {
      errors.push(`${route.id}: manifest topology sources do not match route sources`);
    }
    if (
      !isRoadDirection(manifest.directionClaim.direction) ||
      manifest.directionClaim.direction !== route.direction ||
      manifest.directionClaim.reviewStatus !== "approved" ||
      !isHttpsUrl(manifest.directionClaim.sourceUrl) ||
      !manifest.directionClaim.accessedAt ||
      !manifest.directionClaim.claim ||
      !manifest.directionClaim.directionEvidence
    ) {
      errors.push(`${route.id}: approved direction evidence is required`);
    }
    if (
      route.anchorIds.length < 2 ||
      manifest.anchorClaims.length !== route.anchorIds.length ||
      manifest.anchorClaims.some((claim, index) => (
        claim.anchorId !== route.anchorIds[index] ||
        claim.reviewStatus !== "approved" ||
        !isHttpsUrl(claim.sourceUrl) ||
        !claim.accessedAt ||
        !claim.claim ||
        !claim.directionEvidence
      ))
    ) {
      errors.push(`${route.id}: approved anchor-by-anchor evidence is required`);
    }

    const declaredSegments = route.segmentIds.map((segmentId) => (
      (dataset.segments ?? []).find((segment) => segment.id === segmentId)
    ));
    const routeSegments = (dataset.segments ?? []).filter((segment) => segment.routeId === route.id);
    if (
      route.segmentIds.length !== route.anchorIds.length - 1 ||
      routeSegments.length !== route.segmentIds.length ||
      declaredSegments.some((segment) => !segment) ||
      declaredSegments.some((segment, index) => (
        segment?.routeId !== route.id ||
        !isRoadDirection(segment.direction) ||
        segment.direction !== route.direction ||
        segment.fromAnchorId !== route.anchorIds[index] ||
        segment.toAnchorId !== route.anchorIds[index + 1]
      ))
    ) {
      errors.push(`${route.id}: declared segments must completely connect the ordered anchors`);
    }
    if (declaredSegments.some((segment) => !segment?.sourceIds.includes(route.geometrySourceId))) {
      errors.push(`${route.id}: every segment must link to the route geometry source`);
    }
    if (declaredSegments.some((segment) => (
      !segment?.roadName ||
      !segment.routeNumber ||
      segment.geometrySourceId !== route.geometrySourceId ||
      segment.geometryVersion !== route.geometryVersion ||
      segment.geometryExtractedAt !== route.geometryExtractedAt ||
      segment.geometrySourceUrl !== route.geometrySourceUrl ||
      segment.geometryLicense !== route.geometryLicense ||
      segment.attribution !== route.attribution ||
      segment.redistributionPermitted !== true ||
      (segment.kilometerPostRange !== undefined && (
        !Number.isFinite(segment.kilometerPostRange.startKm) ||
        !Number.isFinite(segment.kilometerPostRange.endKm) ||
        segment.kilometerPostRange.startKm > segment.kilometerPostRange.endKm
      ))
    ))) {
      errors.push(`${route.id}: every segment requires road identity and matching geometry rights`);
    }

    const routeJunctions = (dataset.junctions ?? []).filter((junction) => junction.routeId === route.id);
    if (
      routeJunctions.length !== route.anchorIds.length ||
      route.anchorIds.some((anchorId) => !routeJunctions.some((junction) => junction.id === anchorId))
    ) {
      errors.push(`${route.id}: every anchor must have a declared junction`);
    }
    if (routeJunctions.some((junction) => (
      !junction.sourceIds.includes(route.geometrySourceId) ||
      !junction.sourceIds.some((sourceId) => route.topologySourceIds.includes(sourceId))
    ))) {
      errors.push(`${route.id}: every junction must link geometry and topology sources`);
    }
  }

  return { ok: errors.length === 0, errors };
}
