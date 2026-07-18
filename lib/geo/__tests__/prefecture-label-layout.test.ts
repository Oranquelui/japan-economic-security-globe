import { describe, expect, test } from "vitest";

import labelData from "../../../data/geo/japan-prefecture-labels.json";
import { prefectureBoundaryCollection } from "../prefecture-boundaries";
import {
  PREFECTURE_LABEL_FONT_SIZE,
  buildPrefectureLabelFeatureCollections,
  inspectProjectedPrefectureLabelLayout,
  loadPrefectureLabelLayout,
  prefectureLabelLayout,
  projectPrefectureLabelAnchor
} from "../prefecture-label-layout";

const DEFAULT_CENTER: [number, number] = [138.45, 35];
const DEFAULT_ZOOM = 5;
const REQUIRED_CURATED_CODES = [
  "JP-01",
  "JP-11",
  "JP-12",
  "JP-13",
  "JP-14",
  "JP-23",
  "JP-26",
  "JP-27",
  "JP-28",
  "JP-42",
  "JP-46",
  "JP-47"
] as const;

describe("prefecture label layout", () => {
  test("loads a cloned deeply frozen layout aligned to the canonical prefecture boundary tuples", () => {
    const loaded = loadPrefectureLabelLayout(labelData);

    expect(loaded).toEqual(labelData);
    expect(loaded).not.toBe(labelData);
    expect(loaded[0]).not.toBe(labelData[0]);
    expect(loaded[0].targetAnchor).not.toBe(labelData[0].targetAnchor);
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded[0])).toBe(true);
    expect(Object.isFrozen(loaded[0].targetAnchor)).toBe(true);
    expect(Object.isFrozen(loaded[0].displayAnchor)).toBe(true);
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
    ["targetAnchor", [Number.NaN, 43.06], "prefectureCode JP-01 targetAnchor must contain finite coordinates"],
    ["displayAnchor", [155, 40.718], "prefectureCode JP-01 displayAnchor must stay within Japan bounds"],
    ["targetAnchor", [141.35], "prefectureCode JP-01 targetAnchor must be a two-coordinate tuple"]
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
      expect(entry.targetAnchor).toHaveLength(2);
      expect(entry.displayAnchor).toHaveLength(2);
      expect([...entry.targetAnchor, ...entry.displayAnchor].every(Number.isFinite)).toBe(true);
    }

    for (const prefectureCode of REQUIRED_CURATED_CODES) {
      const entry = prefectureLabelLayout.find((candidate) => candidate.prefectureCode === prefectureCode);
      expect(entry, prefectureCode).toBeDefined();
      expect(entry?.displayAnchor, prefectureCode).not.toEqual(entry?.targetAnchor);
    }
  });

  test("builds deterministic semantic label points and leader lines for every material displacement", () => {
    const selectedId = "prefecture:tokyo";
    const collections = buildPrefectureLabelFeatureCollections(prefectureLabelLayout, selectedId, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      viewport: { width: 1440, height: 900 }
    });

    expect(collections.labelPoints.type).toBe("FeatureCollection");
    expect(collections.labelPoints.features).toHaveLength(47);
    expect(collections.selectedLabelPoints.features).toEqual([
      expect.objectContaining({
        geometry: { type: "Point", coordinates: prefectureLabelLayout[12].targetAnchor },
        properties: expect.objectContaining({
          entityId: selectedId,
          selected: true
        })
      })
    ]);
    expect(collections.labelPoints.features[12]).toMatchObject({
      geometry: { type: "Point", coordinates: prefectureLabelLayout[12].displayAnchor },
      properties: {
        id: "prefecture:tokyo",
        entityId: "prefecture:tokyo",
        prefectureCode: "JP-13",
        label: "東京都",
        selected: true
      }
    });

    const expectedLeaderIds = prefectureLabelLayout
      .filter((entry) => {
        const target = projectPrefectureLabelAnchor(entry.targetAnchor, DEFAULT_CENTER, DEFAULT_ZOOM, {
          width: 1440,
          height: 900
        });
        const display = projectPrefectureLabelAnchor(entry.displayAnchor, DEFAULT_CENTER, DEFAULT_ZOOM, {
          width: 1440,
          height: 900
        });
        return Math.hypot(display.x - target.x, display.y - target.y) >= 28;
      })
      .map((entry) => entry.entityId);
    const actualLeaderIds = collections.leaderLines.features.map((feature) => feature.properties.entityId);

    expect(actualLeaderIds).toEqual(expectedLeaderIds);
    expect(actualLeaderIds).toEqual(expect.arrayContaining([
      "prefecture:saitama",
      "prefecture:chiba",
      "prefecture:tokyo",
      "prefecture:kanagawa",
      "prefecture:aichi",
      "prefecture:kyoto",
      "prefecture:osaka",
      "prefecture:hyogo",
      "prefecture:okinawa"
    ]));
    expect(collections.leaderLines.features.find((feature) => feature.properties.entityId === selectedId)).toMatchObject({
      geometry: {
        type: "LineString",
        coordinates: [prefectureLabelLayout[12].targetAnchor, prefectureLabelLayout[12].displayAnchor]
      },
      properties: {
        id: selectedId,
        entityId: selectedId,
        prefectureCode: "JP-13",
        label: "東京都",
        selected: true
      }
    });
  });

  test.each([
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1680, height: 900 }
  ])("has no estimated overlap or clipping at $width x $height", (viewport) => {
    const report = inspectProjectedPrefectureLabelLayout(prefectureLabelLayout, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      viewport
    });

    expect(PREFECTURE_LABEL_FONT_SIZE).toBe(12);
    expect(report.boxes).toHaveLength(47);
    expect(report.overlaps).toEqual([]);
    expect(report.clipped).toEqual([]);
  });
});
