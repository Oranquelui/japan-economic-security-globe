import { describe, expect, test } from "vitest";

import labelData from "../../../data/geo/japan-prefecture-labels.json";
import {
  PREFECTURE_LABEL_FONT_SIZE,
  buildPrefectureLabelFeatureCollections,
  inspectProjectedPrefectureLabelLayout,
  projectPrefectureLabelAnchor,
  type PrefectureLabelLayoutEntry
} from "../prefecture-label-layout";

const DEFAULT_CENTER: [number, number] = [138.45, 36.25];
const DEFAULT_ZOOM = 5.3;
const typedLabelData = labelData as unknown as readonly PrefectureLabelLayoutEntry[];
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
  test("pins all 47 full Japanese prefecture names to stable explicit anchors", () => {
    expect(labelData).toHaveLength(47);
    expect(labelData.map((entry) => entry.prefectureCode)).toEqual(
      Array.from({ length: 47 }, (_, index) => `JP-${String(index + 1).padStart(2, "0")}`)
    );
    expect(new Set(labelData.map((entry) => entry.entityId)).size).toBe(47);

    for (const entry of labelData) {
      expect(entry.entityId).toMatch(/^prefecture:[a-z-]+$/);
      expect(entry.label).toMatch(/[都道府県]$/);
      expect(entry.label.length).toBeGreaterThanOrEqual(3);
      expect(entry.targetAnchor).toHaveLength(2);
      expect(entry.displayAnchor).toHaveLength(2);
      expect([...entry.targetAnchor, ...entry.displayAnchor].every(Number.isFinite)).toBe(true);
    }

    for (const prefectureCode of REQUIRED_CURATED_CODES) {
      const entry = labelData.find((candidate) => candidate.prefectureCode === prefectureCode);
      expect(entry, prefectureCode).toBeDefined();
      expect(entry?.displayAnchor, prefectureCode).not.toEqual(entry?.targetAnchor);
    }
  });

  test("builds deterministic semantic label points and leader lines for every material displacement", () => {
    const selectedId = "prefecture:tokyo";
    const collections = buildPrefectureLabelFeatureCollections(typedLabelData, selectedId, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      viewport: { width: 1440, height: 900 }
    });

    expect(collections.labelPoints.type).toBe("FeatureCollection");
    expect(collections.labelPoints.features).toHaveLength(47);
    expect(collections.labelPoints.features[12]).toMatchObject({
      geometry: { type: "Point", coordinates: labelData[12].displayAnchor },
      properties: {
        id: "prefecture:tokyo",
        entityId: "prefecture:tokyo",
        prefectureCode: "JP-13",
        label: "東京都",
        selected: true
      }
    });

    const expectedLeaderIds = typedLabelData
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
        coordinates: [labelData[12].targetAnchor, labelData[12].displayAnchor]
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
    const report = inspectProjectedPrefectureLabelLayout(typedLabelData, {
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
