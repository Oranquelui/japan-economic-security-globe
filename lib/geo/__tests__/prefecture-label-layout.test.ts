import { describe, expect, test } from "vitest";

import labelData from "../../../data/geo/japan-prefecture-labels.json";
import { prefectureBoundaryCollection } from "../prefecture-boundaries";
import {
  buildPrefectureLabelFeatureCollections,
  loadPrefectureLabelLayout,
  prefectureLabelLayout
} from "../prefecture-label-layout";

describe("prefecture label layout", () => {
  test("loads a cloned deeply frozen layout aligned to the canonical prefecture boundary tuples", () => {
    const loaded = loadPrefectureLabelLayout(labelData);

    expect(loaded).toEqual(labelData);
    expect(loaded).not.toBe(labelData);
    expect(loaded[0]).not.toBe(labelData[0]);
    expect(loaded[0].anchor).not.toBe(labelData[0].anchor);
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded[0])).toBe(true);
    expect(Object.isFrozen(loaded[0].anchor)).toBe(true);
    expect(prefectureLabelLayout).toEqual(loaded);
    expect(prefectureLabelLayout.map(({ prefectureCode, entityId, label }) => [
      prefectureCode,
      entityId,
      label
    ])).toEqual(prefectureBoundaryCollection.features.map(({ properties }) => [
      properties.prefectureCode,
      properties.entityId,
      properties.label
    ]));
  });

  test.each([
    ["entityId", "prefectureCode JP-01 entityId mismatch"],
    ["label", "prefectureCode JP-01 label mismatch"],
    ["prefectureCode", "entry 0 prefectureCode mismatch"]
  ] as const)("rejects rows with uniquely swapped %s values", (field, expectedMessage) => {
    const swapped = structuredClone(labelData);
    const first = swapped[0][field];
    swapped[0][field] = swapped[1][field] as never;
    swapped[1][field] = first as never;

    expect(() => loadPrefectureLabelLayout(swapped)).toThrow(expectedMessage);
  });

  test("rejects missing and duplicate layout entries explicitly", () => {
    expect(() => loadPrefectureLabelLayout(labelData.slice(0, -1))).toThrow(
      "expected exactly 47 entries, received 46"
    );

    const duplicate = structuredClone(labelData);
    duplicate[1].entityId = duplicate[0].entityId;
    expect(() => loadPrefectureLabelLayout(duplicate)).toThrow(
      "duplicate entityId prefecture:hokkaido"
    );
  });

  test.each([
    ["anchor", [Number.NaN, 43.06], "prefectureCode JP-01 anchor must contain finite coordinates"],
    ["anchor", [155, 40.718], "prefectureCode JP-01 anchor must stay within Japan bounds"],
    ["anchor", [141.35], "prefectureCode JP-01 anchor must be a two-coordinate tuple"]
  ] as const)("rejects malformed %s coordinates", (field, coordinates, expectedMessage) => {
    const malformed = structuredClone(labelData);
    malformed[0][field] = [...coordinates];

    expect(() => loadPrefectureLabelLayout(malformed)).toThrow(expectedMessage);
  });

  test("pins all 47 full Japanese prefecture names to stable explicit anchors", () => {
    expect(prefectureLabelLayout).toHaveLength(47);
    expect(prefectureLabelLayout.map((entry) => entry.prefectureCode)).toEqual(
      Array.from({ length: 47 }, (_, index) => `JP-${String(index + 1).padStart(2, "0")}`)
    );
    expect(new Set(prefectureLabelLayout.map((entry) => entry.entityId)).size).toBe(47);
    expect(new Set(prefectureLabelLayout.map((entry) => entry.label)).size).toBe(47);

    for (const entry of prefectureLabelLayout) {
      expect(entry.entityId).toMatch(/^prefecture:[a-z-]+$/);
      expect(entry.label).toMatch(/[都道府県]$/);
      expect(entry.label.length).toBeGreaterThanOrEqual(3);
      expect(entry.anchor).toHaveLength(2);
      expect(entry.anchor.every(Number.isFinite)).toBe(true);
      const geometry = prefectureBoundaryCollection.features.find(
        (feature) => feature.properties.entityId === entry.entityId
      )!.geometry;
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      expect(polygons.some((rings) => pointInRing(entry.anchor, rings[0])
        && !rings.slice(1).some((ring) => pointInRing(entry.anchor, ring))), entry.label).toBe(true);
    }
  });

  test("keeps ordinary and selected labels at the same in-region anchor", () => {
    const selectedId = "prefecture:tokyo";
    const collections = buildPrefectureLabelFeatureCollections(prefectureLabelLayout, selectedId);

    expect(collections.labelPoints.type).toBe("FeatureCollection");
    expect(collections.labelPoints.features).toHaveLength(47);
    expect(collections.selectedLabelPoints.features).toEqual([
      expect.objectContaining({
        geometry: { type: "Point", coordinates: prefectureLabelLayout[12].anchor },
        properties: expect.objectContaining({
          entityId: selectedId,
          selected: true
        })
      })
    ]);
    expect(collections.labelPoints.features[12]).toMatchObject({
      geometry: { type: "Point", coordinates: prefectureLabelLayout[12].anchor },
      properties: {
        id: "prefecture:tokyo",
        entityId: "prefecture:tokyo",
        prefectureCode: "JP-13",
        label: "東京都",
        selected: true
      }
    });
  });
});

function pointInRing(point: readonly number[], ring: readonly (readonly number[])[]) {
  const [x, y] = point;
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [ax, ay] = ring[index];
    const [bx, by] = ring[previous];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) {
      inside = !inside;
    }
  }
  return inside;
}
