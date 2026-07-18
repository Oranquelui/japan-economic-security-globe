import importedPrefectureLabelLayout from "../../data/geo/japan-prefecture-labels.json";
import { prefectureBoundaryCollection } from "./prefecture-boundaries";

export const PREFECTURE_LABEL_FONT_SIZE = 12;
export const PREFECTURE_LABEL_LINE_HEIGHT = 18;
export const PREFECTURE_LABEL_LEADER_THRESHOLD_PX = 28;

type Coordinate = readonly [number, number];

export type PrefectureLabelLayoutEntry = Readonly<{
  prefectureCode: `JP-${string}`;
  entityId: `prefecture:${string}`;
  label: string;
  targetAnchor: Coordinate;
  displayAnchor: Coordinate;
}>;

export type PrefectureLabelProjection = Readonly<{
  center: Coordinate;
  zoom: number;
  viewport: Readonly<{ width: number; height: number }>;
}>;

export type ProjectedLabelBox = Readonly<{
  entityId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type ExclusionRect = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

type LabelProperties = Readonly<{
  id: string;
  entityId: string;
  selectionId: string;
  prefectureCode: string;
  label: string;
  selected: boolean;
}>;

const DEFAULT_PROJECTION: PrefectureLabelProjection = {
  center: [138.45, 35],
  zoom: 5,
  viewport: { width: 1440, height: 900 }
};

const JAPAN_LAYOUT_BOUNDS = Object.freeze({
  minLongitude: 122,
  maxLongitude: 154,
  minLatitude: 20,
  maxLatitude: 46
});

export function assertPrefectureLabelLayout(
  value: unknown
): asserts value is readonly PrefectureLabelLayoutEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid prefecture label layout: root must be an array");
  }
  if (value.length !== 47) {
    throw new Error(
      `Invalid prefecture label layout: expected exactly 47 entries, received ${value.length}`
    );
  }

  const seenCodes = new Set<string>();
  const seenEntityIds = new Set<string>();
  const seenLabels = new Set<string>();

  for (const [index, candidate] of value.entries()) {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error(`Invalid prefecture label layout: entry ${index} must be an object`);
    }

    const record = candidate as Record<string, unknown>;
    const { prefectureCode, entityId, label } = record;
    if (typeof prefectureCode !== "string") {
      throw new Error(`Invalid prefecture label layout: entry ${index} prefectureCode must be a string`);
    }
    if (typeof entityId !== "string" || !/^prefecture:[a-z-]+$/.test(entityId)) {
      throw new Error(`Invalid prefecture label layout: prefectureCode ${prefectureCode} entityId is malformed`);
    }
    if (typeof label !== "string" || label.trim() !== label || !/[都道府県]$/.test(label)) {
      throw new Error(`Invalid prefecture label layout: prefectureCode ${prefectureCode} label is not a full Japanese prefecture name`);
    }
    if (seenCodes.has(prefectureCode)) {
      throw new Error(`Invalid prefecture label layout: duplicate prefectureCode ${prefectureCode}`);
    }
    if (seenEntityIds.has(entityId)) {
      throw new Error(`Invalid prefecture label layout: duplicate entityId ${entityId}`);
    }
    if (seenLabels.has(label)) {
      throw new Error(`Invalid prefecture label layout: duplicate label ${label}`);
    }
    seenCodes.add(prefectureCode);
    seenEntityIds.add(entityId);
    seenLabels.add(label);

    const expectedCode = `JP-${String(index + 1).padStart(2, "0")}`;
    if (prefectureCode !== expectedCode) {
      throw new Error(
        `Invalid prefecture label layout: entry ${index} prefectureCode mismatch; expected ${expectedCode}, received ${prefectureCode}`
      );
    }

    const canonical = prefectureBoundaryCollection.features[index]?.properties;
    if (!canonical || canonical.prefectureCode !== prefectureCode) {
      throw new Error(`Invalid prefecture label layout: missing canonical boundary for ${prefectureCode}`);
    }
    if (entityId !== canonical.entityId) {
      throw new Error(
        `Invalid prefecture label layout: prefectureCode ${prefectureCode} entityId mismatch; expected ${canonical.entityId}, received ${entityId}`
      );
    }
    if (label !== canonical.label) {
      throw new Error(
        `Invalid prefecture label layout: prefectureCode ${prefectureCode} label mismatch; expected ${canonical.label}, received ${label}`
      );
    }

    assertLayoutCoordinate(record.targetAnchor, prefectureCode, "targetAnchor");
    assertLayoutCoordinate(record.displayAnchor, prefectureCode, "displayAnchor");
  }
}

export function loadPrefectureLabelLayout(value: unknown): readonly PrefectureLabelLayoutEntry[] {
  assertPrefectureLabelLayout(value);
  const cloned = value.map((entry): PrefectureLabelLayoutEntry => {
    const targetAnchor: Coordinate = Object.freeze([entry.targetAnchor[0], entry.targetAnchor[1]]);
    const displayAnchor: Coordinate = Object.freeze([entry.displayAnchor[0], entry.displayAnchor[1]]);
    return Object.freeze({
      prefectureCode: entry.prefectureCode,
      entityId: entry.entityId,
      label: entry.label,
      targetAnchor,
      displayAnchor
    });
  });
  return Object.freeze(cloned);
}

export const prefectureLabelLayout = loadPrefectureLabelLayout(importedPrefectureLabelLayout);

export function buildPrefectureLabelFeatureCollections(
  entries: readonly PrefectureLabelLayoutEntry[],
  activeId: string,
  projection: PrefectureLabelProjection = DEFAULT_PROJECTION
) {
  const labelPoints = entries.map((entry) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [...entry.displayAnchor] as [number, number]
    },
    properties: buildProperties(entry, activeId)
  }));
  const selectedLabelPoints = entries
    .filter((entry) => entry.entityId === activeId)
    .map((entry) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [...entry.targetAnchor] as [number, number]
      },
      properties: buildProperties(entry, activeId)
    }));
  const leaderLines = entries
    .filter((entry) => projectedDisplacement(entry, projection) >= PREFECTURE_LABEL_LEADER_THRESHOLD_PX)
    .map((entry) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [...entry.targetAnchor] as [number, number],
          [...entry.displayAnchor] as [number, number]
        ]
      },
      properties: buildProperties(entry, activeId)
    }));

  return {
    labelPoints: {
      type: "FeatureCollection" as const,
      features: labelPoints
    },
    selectedLabelPoints: {
      type: "FeatureCollection" as const,
      features: selectedLabelPoints
    },
    leaderLines: {
      type: "FeatureCollection" as const,
      features: leaderLines
    }
  };
}

export function inspectProjectedPrefectureLabelLayout(
  entries: readonly PrefectureLabelLayoutEntry[],
  projection: PrefectureLabelProjection,
  exclusions: readonly ExclusionRect[] = []
) {
  const boxes = entries.map((entry) => {
    const point = projectPrefectureLabelAnchor(
      entry.displayAnchor,
      projection.center,
      projection.zoom,
      projection.viewport
    );
    const width = estimateLabelWidth(entry.label);
    return {
      entityId: entry.entityId,
      left: point.x - width / 2,
      right: point.x + width / 2,
      top: point.y - PREFECTURE_LABEL_LINE_HEIGHT / 2,
      bottom: point.y + PREFECTURE_LABEL_LINE_HEIGHT / 2
    };
  });
  const overlaps: Array<{ first: string; second: string }> = [];

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      if (rectanglesOverlap(boxes[leftIndex], boxes[rightIndex])) {
        overlaps.push({
          first: boxes[leftIndex].entityId,
          second: boxes[rightIndex].entityId
        });
      }
    }
  }

  const clipped = boxes
    .filter((box) => (
      box.left < 0
      || box.top < 0
      || box.right > projection.viewport.width
      || box.bottom > projection.viewport.height
      || exclusions.some((exclusion) => rectanglesOverlap(box, exclusion))
    ))
    .map((box) => box.entityId);

  return { boxes, clipped, overlaps };
}

export function projectPrefectureLabelAnchor(
  coordinate: Coordinate,
  center: Coordinate,
  zoom: number,
  viewport: Readonly<{ width: number; height: number }>
) {
  const projected = projectMercatorWorld(coordinate, zoom);
  const projectedCenter = projectMercatorWorld(center, zoom);
  return {
    x: projected.x - projectedCenter.x + viewport.width / 2,
    y: projected.y - projectedCenter.y + viewport.height / 2
  };
}

function projectedDisplacement(entry: PrefectureLabelLayoutEntry, projection: PrefectureLabelProjection) {
  const target = projectPrefectureLabelAnchor(
    entry.targetAnchor,
    projection.center,
    projection.zoom,
    projection.viewport
  );
  const display = projectPrefectureLabelAnchor(
    entry.displayAnchor,
    projection.center,
    projection.zoom,
    projection.viewport
  );
  return Math.hypot(display.x - target.x, display.y - target.y);
}

function assertLayoutCoordinate(
  value: unknown,
  prefectureCode: string,
  anchorName: "targetAnchor" | "displayAnchor"
): asserts value is Coordinate {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(
      `Invalid prefecture label layout: prefectureCode ${prefectureCode} ${anchorName} must be a two-coordinate tuple`
    );
  }
  const [longitude, latitude] = value;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error(
      `Invalid prefecture label layout: prefectureCode ${prefectureCode} ${anchorName} must contain finite coordinates`
    );
  }
  if (
    longitude < JAPAN_LAYOUT_BOUNDS.minLongitude
    || longitude > JAPAN_LAYOUT_BOUNDS.maxLongitude
    || latitude < JAPAN_LAYOUT_BOUNDS.minLatitude
    || latitude > JAPAN_LAYOUT_BOUNDS.maxLatitude
  ) {
    throw new Error(
      `Invalid prefecture label layout: prefectureCode ${prefectureCode} ${anchorName} must stay within Japan bounds`
    );
  }
}

function buildProperties(entry: PrefectureLabelLayoutEntry, activeId: string): LabelProperties {
  return {
    id: entry.entityId,
    entityId: entry.entityId,
    selectionId: entry.entityId,
    prefectureCode: entry.prefectureCode,
    label: entry.label,
    selected: entry.entityId === activeId
  };
}

function projectMercatorWorld(coordinate: Coordinate, zoom: number) {
  const worldSize = 512 * 2 ** zoom;
  const longitude = coordinate[0];
  const latitude = Math.max(-85.051129, Math.min(85.051129, coordinate[1]));
  const latitudeRadians = latitude * Math.PI / 180;
  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (
      1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI
    ) / 2 * worldSize
  };
}

function estimateLabelWidth(label: string) {
  return Array.from(label).length * PREFECTURE_LABEL_FONT_SIZE * 0.95 + 8;
}

function rectanglesOverlap(left: ExclusionRect, right: ExclusionRect) {
  return left.left < right.right
    && left.right > right.left
    && left.top < right.bottom
    && left.bottom > right.top;
}
