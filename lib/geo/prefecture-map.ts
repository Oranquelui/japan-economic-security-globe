import {
  prefectureBoundaryByEntityId,
  prefectureBoundaryCollection
} from "./prefecture-boundaries";
import type { PrefectureBoundaryFeature } from "./prefecture-boundaries";
import type { PrefectureBoundaryMapRegion } from "../presentation/map-canvas";

export type PrefectureMetricRegion = PrefectureBoundaryMapRegion;

export type PrefectureMetricFeature = Readonly<{
  type: "Feature";
  geometry: PrefectureBoundaryFeature["geometry"];
  properties: Readonly<{
    id: string;
    entityId: string;
    prefectureCode: PrefectureBoundaryFeature["properties"]["prefectureCode"];
    label: string;
    value: number | null;
    rawValue: number | null;
    unit: string | null;
    periodLabel: string | null;
    sourceIds: readonly string[];
    selected: boolean;
  }>;
}>;

export type PrefectureMetricFeatureCollection = Readonly<{
  type: "FeatureCollection";
  features: readonly PrefectureMetricFeature[];
}>;

export function buildPrefectureMetricFeatureCollection(
  regions: readonly PrefectureMetricRegion[],
  activeId: string
): PrefectureMetricFeatureCollection {
  const regionByEntityId = validatePrefectureMetricRegions(regions);
  const features = prefectureBoundaryCollection.features.map((boundary) => {
    const { entityId, prefectureCode } = boundary.properties;
    const region = regionByEntityId.get(entityId);

    if (!region) {
      throw new Error(`Missing prefecture metric entity for boundary: ${entityId}`);
    }

    const properties = Object.freeze({
      id: entityId,
      entityId,
      prefectureCode,
      label: region.label,
      value: region.value,
      rawValue: region.rawValue ?? null,
      unit: region.unit ?? null,
      periodLabel: region.periodLabel ?? null,
      sourceIds: Object.freeze([...(region.sourceIds ?? [])]),
      selected: entityId === activeId
    });

    return Object.freeze({
      type: "Feature" as const,
      geometry: boundary.geometry,
      properties
    });
  });

  return Object.freeze({
    type: "FeatureCollection" as const,
    features: Object.freeze(features)
  });
}

function validatePrefectureMetricRegions(
  regions: readonly PrefectureMetricRegion[]
): ReadonlyMap<string, PrefectureMetricRegion> {
  const regionByEntityId = new Map<string, PrefectureMetricRegion>();

  for (const region of regions) {
    if (regionByEntityId.has(region.id)) {
      throw new Error(`Duplicate prefecture metric entityId: ${region.id}`);
    }
    regionByEntityId.set(region.id, region);
  }

  for (const region of regions) {
    const boundary = prefectureBoundaryByEntityId.get(region.id as `prefecture:${string}`);
    if (!boundary) {
      throw new Error(`Unmatched prefecture metric entityId: ${region.id}`);
    }
    validatePrefectureGeometry(region, boundary);
    validatePrefectureMetricState(region);
  }

  return regionByEntityId;
}

function validatePrefectureGeometry(
  region: PrefectureMetricRegion,
  boundary: PrefectureBoundaryFeature
): void {
  const candidate = region as unknown as Record<string, unknown>;
  const geometryKind = candidate.geometryKind;
  if (geometryKind !== "prefecture-boundary") {
    throw new Error(
      `Invalid prefecture geometryKind for entityId: ${region.id}; expected prefecture-boundary, received ${String(geometryKind)}`
    );
  }

  const prefectureCode = candidate.prefectureCode;
  if (typeof prefectureCode !== "string") {
    throw new Error(`Missing prefectureCode for entityId: ${region.id}`);
  }
  if (prefectureCode !== boundary.properties.prefectureCode) {
    throw new Error(
      `Mismatched prefectureCode for entityId: ${region.id}; expected ${boundary.properties.prefectureCode}, received ${prefectureCode}`
    );
  }
}

function validatePrefectureMetricState(region: PrefectureMetricRegion): void {
  const candidate = region as unknown as Record<string, unknown>;
  const value = candidate.value;
  const hasRawValue = Object.prototype.hasOwnProperty.call(candidate, "rawValue");

  if (value === null) {
    if (hasRawValue) {
      throw new Error(
        `Invalid prefecture metric state for entityId: ${region.id}; null value forbids rawValue`
      );
    }
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Invalid prefecture metric value for entityId: ${region.id}; expected a finite number`
    );
  }
  if (!hasRawValue) {
    throw new Error(
      `Invalid prefecture metric state for entityId: ${region.id}; finite value requires finite rawValue`
    );
  }

  const rawValue = candidate.rawValue;
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    throw new Error(
      `Invalid prefecture metric rawValue for entityId: ${region.id}; expected a finite number`
    );
  }
}
