import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import seedEntities from "../../../data/seed/entities.json";
import {
  assertPrefectureBoundaryCollection,
  assertPrefectureBoundaryProvenance,
  prefectureBoundaryByCode,
  prefectureBoundaryByEntityId,
  prefectureBoundaryCollection,
  prefectureBoundaryProvenance,
  prefectureEntityIdByCode,
  type LinearRing,
  type Position
} from "../prefecture-boundaries";

const artifactPath = "data/geo/japan-prefectures-natural-earth-5.1.1.geojson";

function mutableJsonClone(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const expectedCodeEntityPairs = [
  ["JP-01", "prefecture:hokkaido"],
  ["JP-02", "prefecture:aomori"],
  ["JP-03", "prefecture:iwate"],
  ["JP-04", "prefecture:miyagi"],
  ["JP-05", "prefecture:akita"],
  ["JP-06", "prefecture:yamagata"],
  ["JP-07", "prefecture:fukushima"],
  ["JP-08", "prefecture:ibaraki"],
  ["JP-09", "prefecture:tochigi"],
  ["JP-10", "prefecture:gunma"],
  ["JP-11", "prefecture:saitama"],
  ["JP-12", "prefecture:chiba"],
  ["JP-13", "prefecture:tokyo"],
  ["JP-14", "prefecture:kanagawa"],
  ["JP-15", "prefecture:niigata"],
  ["JP-16", "prefecture:toyama"],
  ["JP-17", "prefecture:ishikawa"],
  ["JP-18", "prefecture:fukui"],
  ["JP-19", "prefecture:yamanashi"],
  ["JP-20", "prefecture:nagano"],
  ["JP-21", "prefecture:gifu"],
  ["JP-22", "prefecture:shizuoka"],
  ["JP-23", "prefecture:aichi"],
  ["JP-24", "prefecture:mie"],
  ["JP-25", "prefecture:shiga"],
  ["JP-26", "prefecture:kyoto"],
  ["JP-27", "prefecture:osaka"],
  ["JP-28", "prefecture:hyogo"],
  ["JP-29", "prefecture:nara"],
  ["JP-30", "prefecture:wakayama"],
  ["JP-31", "prefecture:tottori"],
  ["JP-32", "prefecture:shimane"],
  ["JP-33", "prefecture:okayama"],
  ["JP-34", "prefecture:hiroshima"],
  ["JP-35", "prefecture:yamaguchi"],
  ["JP-36", "prefecture:tokushima"],
  ["JP-37", "prefecture:kagawa"],
  ["JP-38", "prefecture:ehime"],
  ["JP-39", "prefecture:kochi"],
  ["JP-40", "prefecture:fukuoka"],
  ["JP-41", "prefecture:saga"],
  ["JP-42", "prefecture:nagasaki"],
  ["JP-43", "prefecture:kumamoto"],
  ["JP-44", "prefecture:oita"],
  ["JP-45", "prefecture:miyazaki"],
  ["JP-46", "prefecture:kagoshima"],
  ["JP-47", "prefecture:okinawa"]
] as const;

function ringsForGeometry(
  geometry: (typeof prefectureBoundaryCollection.features)[number]["geometry"]
): readonly LinearRing[] {
  return geometry.type === "Polygon"
    ? geometry.coordinates
    : geometry.coordinates.flat();
}

function orientation(a: Position, b: Position, c: Position): number {
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return Math.abs(cross) < Number.EPSILON ? 0 : Math.sign(cross);
}

function pointOnSegment(point: Position, start: Position, end: Position): boolean {
  return (
    orientation(start, end, point) === 0 &&
    point[0] >= Math.min(start[0], end[0]) &&
    point[0] <= Math.max(start[0], end[0]) &&
    point[1] >= Math.min(start[1], end[1]) &&
    point[1] <= Math.max(start[1], end[1])
  );
}

function segmentsIntersect(
  firstStart: Position,
  firstEnd: Position,
  secondStart: Position,
  secondEnd: Position
): boolean {
  const firstOrientation = orientation(firstStart, firstEnd, secondStart);
  const secondOrientation = orientation(firstStart, firstEnd, secondEnd);
  const thirdOrientation = orientation(secondStart, secondEnd, firstStart);
  const fourthOrientation = orientation(secondStart, secondEnd, firstEnd);

  if (
    firstOrientation !== secondOrientation &&
    thirdOrientation !== fourthOrientation
  ) {
    return true;
  }

  return (
    pointOnSegment(secondStart, firstStart, firstEnd) ||
    pointOnSegment(secondEnd, firstStart, firstEnd) ||
    pointOnSegment(firstStart, secondStart, secondEnd) ||
    pointOnSegment(firstEnd, secondStart, secondEnd)
  );
}

function positionsEqual(first: Position, second: Position): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

function adjacentSegmentsOnlyShareEndpoint(
  firstStart: Position,
  firstEnd: Position,
  secondStart: Position,
  secondEnd: Position
): boolean {
  const shared = [firstStart, firstEnd].filter((firstPoint) =>
    [secondStart, secondEnd].some((secondPoint) => positionsEqual(firstPoint, secondPoint))
  );
  if (shared.length !== 1) return false;

  const sharedEndpoint = shared[0];
  const firstOther = positionsEqual(firstStart, sharedEndpoint) ? firstEnd : firstStart;
  const secondOther = positionsEqual(secondStart, sharedEndpoint) ? secondEnd : secondStart;

  return (
    !pointOnSegment(firstOther, secondStart, secondEnd) &&
    !pointOnSegment(secondOther, firstStart, firstEnd)
  );
}

function selfIntersectionCount(ring: LinearRing): number {
  const segmentCount = ring.length - 1;
  let count = 0;

  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 1; second < segmentCount; second += 1) {
      const adjacent = second === first + 1 || (first === 0 && second === segmentCount - 1);
      if (adjacent) {
        if (
          !adjacentSegmentsOnlyShareEndpoint(
            ring[first],
            ring[first + 1],
            ring[second],
            ring[second + 1]
          )
        ) {
          count += 1;
        }
        continue;
      }

      if (
        segmentsIntersect(
          ring[first],
          ring[first + 1],
          ring[second],
          ring[second + 1]
        )
      ) {
        count += 1;
      }
    }
  }

  return count;
}

describe("verified prefecture boundary artifact", () => {
  test("contains exactly one normalized feature for each prefecture code", () => {
    const expectedCodes = Array.from(
      { length: 47 },
      (_, index) => `JP-${String(index + 1).padStart(2, "0")}`
    );
    const actualCodes = prefectureBoundaryCollection.features.map(
      ({ properties }) => properties.prefectureCode
    );

    expect(prefectureBoundaryCollection.type).toBe("FeatureCollection");
    expect(prefectureBoundaryCollection.features).toHaveLength(47);
    expect(actualCodes).toEqual(expectedCodes);
    expect(new Set(actualCodes).size).toBe(47);
    expect([...prefectureBoundaryByCode.keys()]).toEqual(expectedCodes);
  });

  test("has unique repository entity IDs and complete Japanese labels", () => {
    const entityIds = prefectureBoundaryCollection.features.map(
      ({ properties }) => properties.entityId
    );
    const labels = prefectureBoundaryCollection.features.map(
      ({ properties }) => properties.labelJa
    );

    expect(new Set(entityIds).size).toBe(47);
    expect(new Set(labels).size).toBe(47);
    expect(entityIds.every((entityId) => entityId.startsWith("prefecture:"))).toBe(true);
    expect(labels.every((label) => label.trim().length > 0)).toBe(true);
  });

  test("contains only valid, bounded Polygon or MultiPolygon rings", () => {
    for (const feature of prefectureBoundaryCollection.features) {
      expect(["Polygon", "MultiPolygon"]).toContain(feature.geometry.type);

      for (const ring of ringsForGeometry(feature.geometry)) {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring.at(-1)).toEqual(ring[0]);

        for (const [longitude, latitude] of ring) {
          expect(Number.isFinite(longitude)).toBe(true);
          expect(Number.isFinite(latitude)).toBe(true);
          expect(longitude).toBeGreaterThanOrEqual(122);
          expect(longitude).toBeLessThanOrEqual(154);
          expect(latitude).toBeGreaterThanOrEqual(20);
          expect(latitude).toBeLessThanOrEqual(46);
        }
      }
    }
  });

  test("runtime collection validation rejects empty Polygon and MultiPolygon containers", () => {
    expect(() => assertPrefectureBoundaryCollection(prefectureBoundaryCollection)).not.toThrow();

    const emptyPolygon = mutableJsonClone(prefectureBoundaryCollection);
    emptyPolygon.features[0].geometry = { type: "Polygon", coordinates: [] };

    const emptyMultiPolygon = mutableJsonClone(prefectureBoundaryCollection);
    emptyMultiPolygon.features[0].geometry = { type: "MultiPolygon", coordinates: [] };

    const ringlessMultiPolygon = mutableJsonClone(prefectureBoundaryCollection);
    ringlessMultiPolygon.features[0].geometry = { type: "MultiPolygon", coordinates: [[]] };

    for (const fixture of [emptyPolygon, emptyMultiPolygon, ringlessMultiPolygon]) {
      expect(() => assertPrefectureBoundaryCollection(fixture)).toThrow(/geometry|ring/i);
    }
  });

  test("has no ring segment intersections beyond adjacent shared endpoints", () => {
    for (const feature of prefectureBoundaryCollection.features) {
      for (const ring of ringsForGeometry(feature.geometry)) {
        expect(
          selfIntersectionCount(ring),
          `${feature.properties.prefectureCode} contains a self-intersecting ring`
        ).toBe(0);
      }
    }
  });

  test("maps all repository prefecture seed entities one-to-one", () => {
    const seedPrefectureIds = seedEntities
      .filter(({ kind }) => kind === "Prefecture")
      .map(({ id }) => id)
      .sort();
    const featureEntityIds = prefectureBoundaryCollection.features
      .map(({ properties }) => properties.entityId)
      .sort();

    expect(seedPrefectureIds).toHaveLength(47);
    expect(featureEntityIds).toEqual(seedPrefectureIds);
    expect(prefectureBoundaryByEntityId.size).toBe(47);
    expect([...prefectureBoundaryByEntityId.keys()].sort()).toEqual(seedPrefectureIds);
  });

  test("exports every normalized prefecture code to repository entity ID pair", () => {
    expect([...prefectureEntityIdByCode]).toEqual(expectedCodeEntityPairs);
  });

  test("exposes iterable indexes without runtime mutation methods", () => {
    expect(prefectureEntityIdByCode.size).toBe(47);
    expect(prefectureEntityIdByCode.has("JP-13")).toBe(true);
    expect(prefectureEntityIdByCode.get("JP-13")).toBe("prefecture:tokyo");
    expect([...prefectureEntityIdByCode]).toEqual(expectedCodeEntityPairs);

    expect(prefectureBoundaryByEntityId.size).toBe(47);
    expect(prefectureBoundaryByEntityId.has("prefecture:tokyo")).toBe(true);
    expect(prefectureBoundaryByEntityId.get("prefecture:tokyo")?.properties.prefectureCode).toBe(
      "JP-13"
    );

    for (const index of [
      prefectureBoundaryByCode,
      prefectureBoundaryByEntityId,
      prefectureEntityIdByCode
    ]) {
      const forciblyMutable = index as unknown as {
        set: (key: unknown, value: unknown) => unknown;
        delete: (key: unknown) => unknown;
        clear: () => unknown;
      };

      expect(Object.isFrozen(index)).toBe(true);
      expect(forciblyMutable.set).toBeUndefined();
      expect(forciblyMutable.delete).toBeUndefined();
      expect(forciblyMutable.clear).toBeUndefined();
      expect(() => forciblyMutable.set("invalid", "invalid")).toThrow(TypeError);
    }
  });

  test("pins reproducible Natural Earth provenance and licensing context", () => {
    expect(prefectureBoundaryProvenance).toMatchObject({
      upstreamVersion: "5.1.1",
      immutableUrl:
        "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip",
      upstreamSha256: "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05",
      termsUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
      worldview: {
        boundaryType: "de facto",
        status: "beta"
      },
      processingDate: "2026-07-18",
      artifactVersion: "natural-earth-5.1.1-japan-prefectures-v1"
    });
    expect(prefectureBoundaryProvenance.processing).toBe(
      "Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成"
    );
    expect(prefectureBoundaryProvenance.command).toContain("mapshaper");
    expect(prefectureBoundaryProvenance.limitation).toBe(
      "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
    );
    expect(prefectureBoundaryProvenance.license).toBe("Public domain");
  });

  test("runtime provenance validation rejects missing, nested, scalar, and pin drift", () => {
    expect(() => assertPrefectureBoundaryProvenance(prefectureBoundaryProvenance)).not.toThrow();

    const missingProcessor = mutableJsonClone(prefectureBoundaryProvenance);
    delete missingProcessor.processor;

    const badNestedField = mutableJsonClone(prefectureBoundaryProvenance);
    badNestedField.worldview.status = "stable";

    const badScalarField = mutableJsonClone(prefectureBoundaryProvenance);
    badScalarField.processingDate = 20260718;

    const badPinnedField = mutableJsonClone(prefectureBoundaryProvenance);
    badPinnedField.upstreamVersion = "5.1.2";

    for (const fixture of [
      missingProcessor,
      badNestedField,
      badScalarField,
      badPinnedField
    ]) {
      expect(() => assertPrefectureBoundaryProvenance(fixture)).toThrow(/provenance/i);
    }
  });

  test("stays within raw and gzip transfer budgets", () => {
    const artifact = readFileSync(artifactPath);

    expect(artifact.byteLength).toBeLessThanOrEqual(700 * 1024);
    expect(gzipSync(artifact).byteLength).toBeLessThanOrEqual(250 * 1024);
  });
});
