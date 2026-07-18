import { describe, expect, test } from "vitest";

import type { JapanMapRegion } from "../../presentation/map-canvas";
import { prefectureBoundaryCollection } from "../prefecture-boundaries";
import {
  NATURAL_EARTH_PREFECTURE_SOURCE_ID,
  buildPrefectureMetricFeatureCollection
} from "../prefecture-map";

const METRIC_SOURCE_ID = "source:estat-rice-prefecture-harvest-r5";

function metricRegions(): JapanMapRegion[] {
  return prefectureBoundaryCollection.features
    .map((feature, index): JapanMapRegion => ({
      id: feature.properties.entityId,
      label: `表示名-${47 - index}`,
      lat: 20 + index,
      lon: 120 + index,
      geometryKind: "prefecture-boundary",
      prefectureCode: feature.properties.prefectureCode,
      value: index === 0 ? null : index,
      ...(index === 0 ? {} : { rawValue: index * 1_000 }),
      unit: "トン",
      periodLabel: "令和5年産",
      sourceIds: [METRIC_SOURCE_ID, NATURAL_EARTH_PREFECTURE_SOURCE_ID]
    }))
    .reverse();
}

describe("prefecture metric feature collection", () => {
  test("joins all 47 boundaries by entityId rather than display label", () => {
    const regions = metricRegions();
    const tokyoRegion = regions.find((region) => region.id === "prefecture:tokyo")!;
    const osakaRegion = regions.find((region) => region.id === "prefecture:osaka")!;
    [tokyoRegion.label, osakaRegion.label] = [osakaRegion.label, tokyoRegion.label];

    const collection = buildPrefectureMetricFeatureCollection(
      regions,
      "prefecture:tokyo"
    );
    const tokyo = collection.features.find(
      (feature) => feature.properties.entityId === "prefecture:tokyo"
    )!;
    const sourceBoundary = prefectureBoundaryCollection.features.find(
      (feature) => feature.properties.entityId === "prefecture:tokyo"
    )!;

    expect(collection.features).toHaveLength(47);
    expect(tokyo.geometry).toBe(sourceBoundary.geometry);
    expect(tokyo.properties).toEqual({
      id: "prefecture:tokyo",
      entityId: "prefecture:tokyo",
      prefectureCode: "JP-13",
      label: tokyoRegion.label,
      value: tokyoRegion.value,
      rawValue: tokyoRegion.rawValue,
      unit: "トン",
      periodLabel: "令和5年産",
      sourceIds: [METRIC_SOURCE_ID, NATURAL_EARTH_PREFECTURE_SOURCE_ID],
      selected: true
    });
    expect(tokyo.properties.label).not.toBe(sourceBoundary.properties.labelJa);
  });

  test("retains a boundary with null typed metric values", () => {
    const regions = metricRegions();
    const missingRegion = regions.find((region) => region.id === "prefecture:hokkaido")!;

    const collection = buildPrefectureMetricFeatureCollection(regions, "prefecture:tokyo");
    const missingFeature = collection.features.find(
      (feature) => feature.properties.entityId === missingRegion.id
    )!;

    expect(collection.features).toHaveLength(47);
    expect(missingFeature.properties).toMatchObject({
      entityId: "prefecture:hokkaido",
      value: null,
      rawValue: null,
      selected: false
    });
  });

  test("does not mutate metric inputs or the immutable boundary artifact", () => {
    const regions = metricRegions();
    const regionsBefore = structuredClone(regions);
    const artifactBefore = JSON.stringify(prefectureBoundaryCollection);

    const collection = buildPrefectureMetricFeatureCollection(regions, "prefecture:tokyo");

    expect(regions).toEqual(regionsBefore);
    expect(JSON.stringify(prefectureBoundaryCollection)).toBe(artifactBefore);
    expect(collection.features[0].properties.sourceIds).not.toBe(regions[46].sourceIds);
    expect(Object.isFrozen(collection)).toBe(true);
    expect(Object.isFrozen(collection.features[0].properties)).toBe(true);
  });

  test("throws explicit validation errors for unmatched, duplicate, and missing entities", () => {
    const regions = metricRegions();
    const unmatched = regions.map((region, index) =>
      index === 0 ? { ...region, id: "prefecture:not-in-boundaries" } : region
    );
    const duplicate = regions.map((region, index) =>
      index === 0 ? { ...region, id: regions[1].id } : region
    );

    expect(() => buildPrefectureMetricFeatureCollection(unmatched, "prefecture:tokyo")).toThrow(
      "Unmatched prefecture metric entityId: prefecture:not-in-boundaries"
    );
    expect(() => buildPrefectureMetricFeatureCollection(duplicate, "prefecture:tokyo")).toThrow(
      `Duplicate prefecture metric entityId: ${regions[1].id}`
    );
    expect(() => buildPrefectureMetricFeatureCollection(regions.slice(1), "prefecture:tokyo")).toThrow(
      /Missing prefecture metric entity for boundary: prefecture:/
    );
  });
});
