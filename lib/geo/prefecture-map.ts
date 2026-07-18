import {
  prefectureBoundaryByEntityId,
  prefectureBoundaryCollection
} from "./prefecture-boundaries";
import type { PrefectureBoundaryFeature } from "./prefecture-boundaries";

export const NATURAL_EARTH_PREFECTURE_SOURCE_ID =
  "source:natural-earth-admin1-japan-5-1-1";

export type PrefectureMetricRegion = Readonly<{
  id: string;
  label: string;
  value: number | null;
  rawValue?: number;
  unit?: string;
  periodLabel?: string;
  sourceIds?: readonly string[];
}>;

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
    if (!prefectureBoundaryByEntityId.has(region.id as `prefecture:${string}`)) {
      throw new Error(`Unmatched prefecture metric entityId: ${region.id}`);
    }
    regionByEntityId.set(region.id, region);
  }

  return regionByEntityId;
}
