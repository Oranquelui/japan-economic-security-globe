import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import seedEntities from "../../../data/seed/entities.json";
import {
  prefectureBoundaryByCode,
  prefectureBoundaryByEntityId,
  prefectureBoundaryCollection,
  prefectureBoundaryProvenance,
  type LinearRing,
  type Position
} from "../prefecture-boundaries";

const artifactPath = "data/geo/japan-prefectures-natural-earth-5.1.1.geojson";

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
    expect(prefectureBoundaryProvenance.processing).toContain("mapshaper");
    expect(prefectureBoundaryProvenance.processing).toContain("adm0_a3 == JPN");
    expect(prefectureBoundaryProvenance.command).toContain("mapshaper");
    expect(prefectureBoundaryProvenance.limitation.trim().length).toBeGreaterThan(0);
    expect(prefectureBoundaryProvenance.license).toBe("Public domain");
  });

  test("stays within raw and gzip transfer budgets", () => {
    const artifact = readFileSync(artifactPath);

    expect(artifact.byteLength).toBeLessThanOrEqual(700 * 1024);
    expect(gzipSync(artifact).byteLength).toBeLessThanOrEqual(250 * 1024);
  });
});
