import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { prefectureBoundaryCollection } from "../prefecture-boundaries";
import {
  PrefectureMetricValidationError,
  buildPrefectureMetricFeatureCollection
} from "../prefecture-map";
import type { PrefectureMetricRegion } from "../prefecture-map";
import { NATURAL_EARTH_PREFECTURE_SOURCE_ID } from "../prefecture-source";

const METRIC_SOURCE_ID = "source:estat-rice-prefecture-harvest-r5";
const testDirectory = dirname(fileURLToPath(import.meta.url));

function collectLocalModuleDependencies(entryPath: string): Set<string> {
  const dependencies = new Set<string>();

  function visit(modulePath: string): void {
    if (dependencies.has(modulePath)) {
      return;
    }

    dependencies.add(modulePath);
    const source = readFileSync(modulePath, "utf8");
    const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) {
        continue;
      }

      const dependencyPath = resolveLocalModulePath(modulePath, specifier);
      if (!dependencyPath) {
        throw new Error(`Cannot resolve local dependency ${specifier} from ${modulePath}`);
      }
      visit(dependencyPath);
    }
  }

  visit(entryPath);
  return dependencies;
}

function resolveLocalModulePath(fromPath: string, specifier: string): string | null {
  const cleanSpecifier = specifier.split("?")[0];
  const unresolvedPath = resolve(dirname(fromPath), cleanSpecifier);
  const candidates = extname(unresolvedPath)
    ? [unresolvedPath]
    : [
        `${unresolvedPath}.ts`,
        `${unresolvedPath}.tsx`,
        `${unresolvedPath}.js`,
        `${unresolvedPath}.json`,
        resolve(unresolvedPath, "index.ts"),
        resolve(unresolvedPath, "index.tsx")
      ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function metricRegions(): PrefectureMetricRegion[] {
  return prefectureBoundaryCollection.features
    .map((feature, index) => ({
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
    } as PrefectureMetricRegion))
    .reverse();
}

function replaceHokkaido(
  regions: PrefectureMetricRegion[],
  replacement: (region: PrefectureMetricRegion) => PrefectureMetricRegion
): PrefectureMetricRegion[] {
  return regions.map((region) =>
    region.id === "prefecture:hokkaido" ? replacement(region) : region
  );
}

function expectPrefectureMetricValidationError(
  operation: () => unknown,
  expectedMessage: string | RegExp
) {
  let thrown: unknown;
  try {
    operation();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(PrefectureMetricValidationError);
  expect(thrown).toMatchObject({ name: "PrefectureMetricValidationError" });
  if (typeof expectedMessage === "string") {
    expect((thrown as Error).message).toBe(expectedMessage);
  } else {
    expect((thrown as Error).message).toMatch(expectedMessage);
  }
}

describe("prefecture metric feature collection", () => {
  test("keeps presentation-only workspace lookup independent from boundary artifact modules", () => {
    const workspacePath = resolve(testDirectory, "../../presentation/workspace.ts");
    const prefectureMapPath = resolve(testDirectory, "../prefecture-map.ts");
    const prefectureBoundariesPath = resolve(testDirectory, "../prefecture-boundaries.ts");
    const prefectureSourcePath = resolve(testDirectory, "../prefecture-source.ts");
    const workspaceDependencies = collectLocalModuleDependencies(workspacePath);

    expect(workspaceDependencies).not.toContain(prefectureMapPath);
    expect(workspaceDependencies).not.toContain(prefectureBoundariesPath);
    expect(existsSync(prefectureSourcePath)).toBe(true);
    expect([...collectLocalModuleDependencies(prefectureSourcePath)]).toEqual([
      prefectureSourcePath
    ]);
  });

  test("joins all 47 boundaries by entityId rather than display label", () => {
    const originalRegions = metricRegions();
    const originalTokyo = originalRegions.find((region) => region.id === "prefecture:tokyo")!;
    const originalOsaka = originalRegions.find((region) => region.id === "prefecture:osaka")!;
    const regions = originalRegions.map((region) => ({
      ...region,
      label: region.id === originalTokyo.id
        ? originalOsaka.label
        : region.id === originalOsaka.id
          ? originalTokyo.label
          : region.label
    } as PrefectureMetricRegion));
    const tokyoRegion = regions.find((region) => region.id === "prefecture:tokyo")!;

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

  test.each([
    {
      name: "missing prefectureCode",
      replacement: (region: PrefectureMetricRegion) => {
        const withoutCode = { ...region } as Record<string, unknown>;
        delete withoutCode.prefectureCode;
        return withoutCode as unknown as PrefectureMetricRegion;
      },
      error: "Missing prefectureCode for entityId: prefecture:hokkaido"
    },
    {
      name: "mismatched prefectureCode",
      replacement: (region: PrefectureMetricRegion) => ({
        ...region,
        prefectureCode: "JP-02"
      } as PrefectureMetricRegion),
      error: "Mismatched prefectureCode for entityId: prefecture:hokkaido; expected JP-01, received JP-02"
    },
    {
      name: "representative-radius geometry",
      replacement: (region: PrefectureMetricRegion) => ({
        ...region,
        geometryKind: "representative-radius"
      } as unknown as PrefectureMetricRegion),
      error: "Invalid prefecture geometryKind for entityId: prefecture:hokkaido; expected prefecture-boundary, received representative-radius"
    }
  ])("rejects $name at the builder boundary", ({ replacement, error }) => {
    const regions = replaceHokkaido(metricRegions(), replacement);

    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(regions, "prefecture:tokyo"),
      error
    );
  });

  test.each([
    {
      name: "normalized value without rawValue",
      replacement: (region: PrefectureMetricRegion) => ({
        ...region,
        value: 50
      } as unknown as PrefectureMetricRegion),
      error: "Invalid prefecture metric state for entityId: prefecture:hokkaido; finite value requires finite rawValue"
    },
    {
      name: "rawValue attached to null",
      replacement: (region: PrefectureMetricRegion) => ({
        ...region,
        rawValue: 10
      } as unknown as PrefectureMetricRegion),
      error: "Invalid prefecture metric state for entityId: prefecture:hokkaido; null value forbids rawValue"
    }
  ])("rejects $name", ({ replacement, error }) => {
    const regions = replaceHokkaido(metricRegions(), replacement);

    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(regions, "prefecture:tokyo"),
      error
    );
  });

  test.each([
    { name: "NaN normalized value", value: Number.NaN, rawValue: 10, field: "value" },
    { name: "infinite normalized value", value: Number.POSITIVE_INFINITY, rawValue: 10, field: "value" },
    { name: "NaN raw value", value: 50, rawValue: Number.NaN, field: "rawValue" },
    { name: "infinite raw value", value: 50, rawValue: Number.NEGATIVE_INFINITY, field: "rawValue" }
  ])("rejects $name", ({ value, rawValue, field }) => {
    const regions = replaceHokkaido(metricRegions(), (region) => ({
      ...region,
      value,
      rawValue
    } as unknown as PrefectureMetricRegion));

    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(regions, "prefecture:tokyo"),
      `Invalid prefecture metric ${field} for entityId: prefecture:hokkaido; expected a finite number`
    );
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

    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(unmatched, "prefecture:tokyo"),
      "Unmatched prefecture metric entityId: prefecture:not-in-boundaries"
    );
    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(duplicate, "prefecture:tokyo"),
      `Duplicate prefecture metric entityId: ${regions[1].id}`
    );
    expectPrefectureMetricValidationError(
      () => buildPrefectureMetricFeatureCollection(regions.slice(1), "prefecture:tokyo"),
      /Missing prefecture metric entity for boundary: prefecture:/
    );
  });
});
