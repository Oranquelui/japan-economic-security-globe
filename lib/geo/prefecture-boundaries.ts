/// <reference types="vite/client" />

import importedBoundaryCollectionText from "../../data/geo/japan-prefectures-natural-earth-5.1.1.geojson?raw" with {
  turbopackModuleType: "raw"
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
    labelJa: string;
  }>;
  geometry: PolygonGeometry | MultiPolygonGeometry;
}>;

export type PrefectureBoundaryCollection = Readonly<{
  type: "FeatureCollection";
  features: readonly PrefectureBoundaryFeature[];
}>;

export type PrefectureBoundaryProvenance = Readonly<{
  artifactVersion: string;
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
    name: string;
    version: string;
  }>;
  command: string;
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

function assertBoundaryCollection(value: unknown): asserts value is PrefectureBoundaryCollection {
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
    const { prefectureCode, entityId, labelJa } = candidate.properties;
    if (
      typeof prefectureCode !== "string" ||
      typeof entityId !== "string" ||
      typeof labelJa !== "string" ||
      labelJa.trim().length === 0
    ) {
      throw new Error(`Invalid prefecture boundary artifact: feature ${index} has invalid properties`);
    }
    if (entityIds.has(entityId)) {
      throw new Error(`Duplicate prefecture boundary entityId: ${entityId}`);
    }
    codes.push(prefectureCode);
    entityIds.add(entityId);

    assertRecord(candidate.geometry, `feature ${prefectureCode} geometry`);
    if (
      (candidate.geometry.type !== "Polygon" && candidate.geometry.type !== "MultiPolygon") ||
      !Array.isArray(candidate.geometry.coordinates)
    ) {
      throw new Error(`Invalid prefecture boundary geometry for ${prefectureCode}`);
    }
  }

  if (codes.some((code, index) => code !== expectedCodes[index])) {
    throw new Error(
      `Missing, duplicate, or unsorted prefecture boundary code: expected ${expectedCodes.join(",")}, received ${codes.join(",")}`
    );
  }
}

function ringsForGeometry(geometry: PolygonGeometry | MultiPolygonGeometry): readonly LinearRing[] {
  return geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
}

function assertDevelopmentGeometry(collection: PrefectureBoundaryCollection): void {
  for (const feature of collection.features) {
    for (const ring of ringsForGeometry(feature.geometry)) {
      if (ring.length < 4) {
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

function assertProvenance(value: unknown): asserts value is PrefectureBoundaryProvenance {
  assertRecord(value, "provenance");
  if (
    value.upstreamVersion !== "5.1.1" ||
    value.upstreamSha256 !== "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05" ||
    value.license !== "Public domain"
  ) {
    throw new Error("Invalid prefecture boundary provenance pin");
  }
}

const importedBoundaryCollection: unknown = JSON.parse(importedBoundaryCollectionText);
const boundaryCandidate: unknown = immutableJsonClone(importedBoundaryCollection);
assertBoundaryCollection(boundaryCandidate);

export const prefectureBoundaryCollection = boundaryCandidate;

if (process.env.NODE_ENV !== "production") {
  assertDevelopmentGeometry(prefectureBoundaryCollection);
}

const codeIndex = new Map<string, PrefectureBoundaryFeature>();
const entityIndex = new Map<string, PrefectureBoundaryFeature>();
for (const feature of prefectureBoundaryCollection.features) {
  const { prefectureCode, entityId } = feature.properties;
  if (codeIndex.has(prefectureCode) || entityIndex.has(entityId)) {
    throw new Error(`Duplicate prefecture boundary mapping: ${prefectureCode} / ${entityId}`);
  }
  codeIndex.set(prefectureCode, feature);
  entityIndex.set(entityId, feature);
}

if (codeIndex.size !== 47 || entityIndex.size !== 47) {
  throw new Error("Missing prefecture boundary mapping");
}

export const prefectureBoundaryByCode: ReadonlyMap<string, PrefectureBoundaryFeature> = codeIndex;
export const prefectureBoundaryByEntityId: ReadonlyMap<string, PrefectureBoundaryFeature> =
  entityIndex;

const provenanceCandidate: unknown = immutableJsonClone(importedProvenance);
assertProvenance(provenanceCandidate);
export const prefectureBoundaryProvenance = provenanceCandidate;
