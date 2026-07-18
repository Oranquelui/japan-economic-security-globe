/// <reference types="vite/client" />

import importedBoundaryCollectionText from "../../data/geo/japan-prefectures-natural-earth-5.1.1.geojson?raw" with {
  turbopackLoader: "raw-loader",
  turbopackAs: "*.js"
};
import importedProvenance from "../../data/geo/japan-prefectures-natural-earth-5.1.1.provenance.json";

export type Position = readonly [longitude: number, latitude: number];
export type LinearRing = readonly Position[];

export type PolygonGeometry = Readonly<{
  type: "Polygon";
  coordinates: readonly LinearRing[];
}>;

export type MultiPolygonGeometry = Readonly<{
  type: "MultiPolygon";
  coordinates: readonly (readonly LinearRing[])[];
}>;

export type PrefectureBoundaryFeature = Readonly<{
  type: "Feature";
  properties: Readonly<{
    prefectureCode: `JP-${string}`;
    entityId: `prefecture:${string}`;
    label: string;
  }>;
  geometry: PolygonGeometry | MultiPolygonGeometry;
}>;

export type PrefectureBoundaryCollection = Readonly<{
  type: "FeatureCollection";
  features: readonly PrefectureBoundaryFeature[];
}>;

export type PrefectureBoundaryProvenance = Readonly<{
  artifactVersion: "natural-earth-5.1.1-japan-prefectures-v2";
  upstreamDataset: string;
  upstreamVersion: string;
  immutableUrl: string;
  upstreamSha256: string;
  termsUrl: string;
  license: string;
  worldview: Readonly<{
    status: string;
    boundaryType: string;
  }>;
  processingDate: string;
  processor: Readonly<{
    name: "repository-local shapefile + fflate";
    version: "shapefile@0.6.6; fflate@0.8.3";
  }>;
  command: "node scripts/build-prefecture-boundaries.mjs --input <source.zip>";
  processing: string;
  limitation: string;
}>;

const expectedCodes = Array.from(
  { length: 47 },
  (_, index) => `JP-${String(index + 1).padStart(2, "0")}`
);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function immutableJsonClone<T>(value: T): T {
  return deepFreeze(JSON.parse(JSON.stringify(value)) as T);
}

function assertRecord(value: unknown, description: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid prefecture boundary artifact: ${description} must be an object`);
  }
}

export function assertPrefectureBoundaryCollection(
  value: unknown
): asserts value is PrefectureBoundaryCollection {
  assertRecord(value, "root");
  if (value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    throw new Error("Invalid prefecture boundary artifact: expected a FeatureCollection");
  }
  if (value.features.length !== 47) {
    throw new Error(
      `Invalid prefecture boundary artifact: expected 47 features, received ${value.features.length}`
    );
  }

  const codes: string[] = [];
  const entityIds = new Set<string>();
  for (const [index, candidate] of value.features.entries()) {
    assertRecord(candidate, `feature ${index}`);
    assertRecord(candidate.properties, `feature ${index} properties`);
    const { prefectureCode, entityId, label } = candidate.properties;
    if (
      typeof prefectureCode !== "string" ||
      typeof entityId !== "string" ||
      typeof label !== "string" ||
      label.trim().length === 0
    ) {
      throw new Error(`Invalid prefecture boundary artifact: feature ${index} has invalid properties`);
    }
    if (entityIds.has(entityId)) {
      throw new Error(`Duplicate prefecture boundary entityId: ${entityId}`);
    }
    codes.push(prefectureCode);
    entityIds.add(entityId);

    assertRecord(candidate.geometry, `feature ${prefectureCode} geometry`);
    if (candidate.geometry.type === "Polygon") {
      if (
        !Array.isArray(candidate.geometry.coordinates) ||
        candidate.geometry.coordinates.length < 1
      ) {
        throw new Error(`Invalid prefecture boundary geometry for ${prefectureCode}: missing ring`);
      }
    } else if (candidate.geometry.type === "MultiPolygon") {
      if (
        !Array.isArray(candidate.geometry.coordinates) ||
        candidate.geometry.coordinates.length < 1 ||
        candidate.geometry.coordinates.some(
          (polygon) => !Array.isArray(polygon) || polygon.length < 1
        )
      ) {
        throw new Error(
          `Invalid prefecture boundary geometry for ${prefectureCode}: missing polygon or ring`
        );
      }
    } else {
      throw new Error(`Invalid prefecture boundary geometry for ${prefectureCode}`);
    }
  }

  if (codes.some((code, index) => code !== expectedCodes[index])) {
    throw new Error(
      `Missing, duplicate, or unsorted prefecture boundary code: expected ${expectedCodes.join(",")}, received ${codes.join(",")}`
    );
  }

  assertGeometryCoordinates(value as unknown as PrefectureBoundaryCollection);
}

function ringsForGeometry(geometry: PolygonGeometry | MultiPolygonGeometry): readonly LinearRing[] {
  return geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
}

function assertGeometryCoordinates(collection: PrefectureBoundaryCollection): void {
  for (const feature of collection.features) {
    for (const ring of ringsForGeometry(feature.geometry)) {
      if (!Array.isArray(ring) || ring.length < 4) {
        throw new Error(`Invalid prefecture boundary ring for ${feature.properties.prefectureCode}`);
      }

      for (const position of ring) {
        if (
          !Array.isArray(position) ||
          position.length < 2 ||
          !Number.isFinite(position[0]) ||
          !Number.isFinite(position[1]) ||
          position[0] < 122 ||
          position[0] > 154 ||
          position[1] < 20 ||
          position[1] > 46
        ) {
          throw new Error(
            `Invalid prefecture boundary coordinate for ${feature.properties.prefectureCode}`
          );
        }
      }

      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        throw new Error(`Unclosed prefecture boundary ring for ${feature.properties.prefectureCode}`);
      }
    }
  }
}

export function assertPrefectureBoundaryProvenance(
  value: unknown
): asserts value is PrefectureBoundaryProvenance {
  assertRecord(value, "provenance");
  assertRecord(value.worldview, "provenance worldview");
  assertRecord(value.processor, "provenance processor");
  if (
    value.artifactVersion !== "natural-earth-5.1.1-japan-prefectures-v2" ||
    value.upstreamDataset !== "Natural Earth Admin 1 – States, Provinces" ||
    value.upstreamVersion !== "5.1.1" ||
    value.immutableUrl !==
      "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip" ||
    value.upstreamSha256 !== "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05" ||
    value.termsUrl !== "https://www.naturalearthdata.com/about/terms-of-use/" ||
    value.license !== "Public domain" ||
    value.worldview.status !== "beta" ||
    value.worldview.boundaryType !== "de facto" ||
    value.processingDate !== "2026-07-18" ||
    value.processor.name !== "repository-local shapefile + fflate" ||
    value.processor.version !== "shapefile@0.6.6; fflate@0.8.3" ||
    value.command !== "node scripts/build-prefecture-boundaries.mjs --input <source.zip>" ||
    value.processing !==
      "Natural Earth 5.1.1 Admin-1 States, Provinces から日本の47都道府県を抽出し、座標を小数点以下5桁へ丸め、リングの向きと始点を決定論的に正規化して作成" ||
    value.limitation !==
      "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
  ) {
    throw new Error("Invalid prefecture boundary provenance pin");
  }
}

const importedBoundaryCollection: unknown = JSON.parse(importedBoundaryCollectionText);
const boundaryCandidate: unknown = immutableJsonClone(importedBoundaryCollection);
assertPrefectureBoundaryCollection(boundaryCandidate);

export const prefectureBoundaryCollection = boundaryCandidate;

function createReadonlyMap<K, V>(entries: Iterable<readonly [K, V]>): ReadonlyMap<K, V> {
  const backing = new Map<K, V>(entries);
  let facade: ReadonlyMap<K, V>;
  facade = Object.freeze({
    get size() {
      return backing.size;
    },
    get: (key: K) => backing.get(key),
    has: (key: K) => backing.has(key),
    entries: () => backing.entries(),
    keys: () => backing.keys(),
    values: () => backing.values(),
    forEach: (
      callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
      thisArg?: unknown
    ) => {
      backing.forEach((value, key) => callback.call(thisArg, value, key, facade));
    },
    [Symbol.iterator]: () => backing[Symbol.iterator]()
  });
  return facade;
}

type BoundaryCode = PrefectureBoundaryFeature["properties"]["prefectureCode"];
type BoundaryEntityId = PrefectureBoundaryFeature["properties"]["entityId"];

const codeFeatureEntries: Array<readonly [BoundaryCode, PrefectureBoundaryFeature]> = [];
const entityFeatureEntries: Array<readonly [BoundaryEntityId, PrefectureBoundaryFeature]> = [];
const codeEntityEntries: Array<readonly [BoundaryCode, BoundaryEntityId]> = [];
const seenCodes = new Set<BoundaryCode>();
const seenEntityIds = new Set<BoundaryEntityId>();
for (const feature of prefectureBoundaryCollection.features) {
  const { prefectureCode, entityId } = feature.properties;
  if (seenCodes.has(prefectureCode) || seenEntityIds.has(entityId)) {
    throw new Error(`Duplicate prefecture boundary mapping: ${prefectureCode} / ${entityId}`);
  }
  seenCodes.add(prefectureCode);
  seenEntityIds.add(entityId);
  codeFeatureEntries.push([prefectureCode, feature]);
  entityFeatureEntries.push([entityId, feature]);
  codeEntityEntries.push([prefectureCode, entityId]);
}

if (
  codeFeatureEntries.length !== 47 ||
  entityFeatureEntries.length !== 47 ||
  codeEntityEntries.length !== 47
) {
  throw new Error("Missing prefecture boundary mapping");
}

export const prefectureBoundaryByCode = createReadonlyMap(codeFeatureEntries);
export const prefectureBoundaryByEntityId = createReadonlyMap(entityFeatureEntries);
export const prefectureEntityIdByCode = createReadonlyMap(codeEntityEntries);

const provenanceCandidate: unknown = immutableJsonClone(importedProvenance);
assertPrefectureBoundaryProvenance(provenanceCandidate);
export const prefectureBoundaryProvenance = provenanceCandidate;
