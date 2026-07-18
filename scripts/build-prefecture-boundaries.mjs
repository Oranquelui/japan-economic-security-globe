#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import shapefile from "shapefile";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const UPSTREAM_VERSION = "5.1.1";
const UPSTREAM_URL =
  "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip";
const UPSTREAM_SHA256 = "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05";
const SHAPEFILE_VERSION = "0.6.6";
const FFLATE_VERSION = "0.8.3";
const ARTIFACT_VERSION = "natural-earth-5.1.1-japan-prefectures-v2";
const ARTIFACT_NAME = "japan-prefectures-natural-earth-5.1.1.geojson";
const PROVENANCE_NAME = "japan-prefectures-natural-earth-5.1.1.provenance.json";
const SHAPEFILE_BASENAME = "ne_10m_admin_1_states_provinces";
const COORDINATE_PRECISION = 5;

const PREFECTURES = [
  ["JP-01", "prefecture:hokkaido", "北海道"],
  ["JP-02", "prefecture:aomori", "青森県"],
  ["JP-03", "prefecture:iwate", "岩手県"],
  ["JP-04", "prefecture:miyagi", "宮城県"],
  ["JP-05", "prefecture:akita", "秋田県"],
  ["JP-06", "prefecture:yamagata", "山形県"],
  ["JP-07", "prefecture:fukushima", "福島県"],
  ["JP-08", "prefecture:ibaraki", "茨城県"],
  ["JP-09", "prefecture:tochigi", "栃木県"],
  ["JP-10", "prefecture:gunma", "群馬県"],
  ["JP-11", "prefecture:saitama", "埼玉県"],
  ["JP-12", "prefecture:chiba", "千葉県"],
  ["JP-13", "prefecture:tokyo", "東京都"],
  ["JP-14", "prefecture:kanagawa", "神奈川県"],
  ["JP-15", "prefecture:niigata", "新潟県"],
  ["JP-16", "prefecture:toyama", "富山県"],
  ["JP-17", "prefecture:ishikawa", "石川県"],
  ["JP-18", "prefecture:fukui", "福井県"],
  ["JP-19", "prefecture:yamanashi", "山梨県"],
  ["JP-20", "prefecture:nagano", "長野県"],
  ["JP-21", "prefecture:gifu", "岐阜県"],
  ["JP-22", "prefecture:shizuoka", "静岡県"],
  ["JP-23", "prefecture:aichi", "愛知県"],
  ["JP-24", "prefecture:mie", "三重県"],
  ["JP-25", "prefecture:shiga", "滋賀県"],
  ["JP-26", "prefecture:kyoto", "京都府"],
  ["JP-27", "prefecture:osaka", "大阪府"],
  ["JP-28", "prefecture:hyogo", "兵庫県"],
  ["JP-29", "prefecture:nara", "奈良県"],
  ["JP-30", "prefecture:wakayama", "和歌山県"],
  ["JP-31", "prefecture:tottori", "鳥取県"],
  ["JP-32", "prefecture:shimane", "島根県"],
  ["JP-33", "prefecture:okayama", "岡山県"],
  ["JP-34", "prefecture:hiroshima", "広島県"],
  ["JP-35", "prefecture:yamaguchi", "山口県"],
  ["JP-36", "prefecture:tokushima", "徳島県"],
  ["JP-37", "prefecture:kagawa", "香川県"],
  ["JP-38", "prefecture:ehime", "愛媛県"],
  ["JP-39", "prefecture:kochi", "高知県"],
  ["JP-40", "prefecture:fukuoka", "福岡県"],
  ["JP-41", "prefecture:saga", "佐賀県"],
  ["JP-42", "prefecture:nagasaki", "長崎県"],
  ["JP-43", "prefecture:kumamoto", "熊本県"],
  ["JP-44", "prefecture:oita", "大分県"],
  ["JP-45", "prefecture:miyazaki", "宮崎県"],
  ["JP-46", "prefecture:kagoshima", "鹿児島県"],
  ["JP-47", "prefecture:okinawa", "沖縄県"]
].map(([prefectureCode, entityId, label]) => ({ prefectureCode, entityId, label }));

function parseLocalInput(args) {
  if (args.length === 0) return null;
  if (args.length === 2 && args[0] === "--input") return path.resolve(args[1]);
  if (args.length === 1 && args[0].startsWith("--input=")) {
    return path.resolve(args[0].slice("--input=".length));
  }

  throw new Error("Usage: npm run build:prefecture-boundaries -- [--input /path/to/upstream.zip]");
}

async function loadUpstream(localInput) {
  if (localInput) {
    return readFile(localInput);
  }

  const response = await fetch(UPSTREAM_URL);
  if (!response.ok) {
    throw new Error(`Natural Earth download failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function assertPinnedSha(source) {
  const actualSha256 = createHash("sha256").update(source).digest("hex");
  if (actualSha256 !== UPSTREAM_SHA256) {
    throw new Error(
      `Natural Earth SHA-256 mismatch: expected ${UPSTREAM_SHA256}, received ${actualSha256}`
    );
  }
}

async function assertLocalProcessorPackages() {
  for (const [packageName, expectedVersion] of [
    ["shapefile", SHAPEFILE_VERSION],
    ["fflate", FFLATE_VERSION]
  ]) {
    const packageJson = JSON.parse(
      await readFile(path.join(repositoryRoot, "node_modules", packageName, "package.json"), "utf8")
    );
    if (packageJson.version !== expectedVersion) {
      throw new Error(
        `Local ${packageName} version mismatch: expected ${expectedVersion}, received ${packageJson.version}`
      );
    }
  }
}

function cleanDbfString(value) {
  return typeof value === "string" ? value.replaceAll("\0", "").trim() : value;
}

function positionsEqual(first, second) {
  return first[0] === second[0] && first[1] === second[1];
}

function comparePositions(first, second) {
  return first[0] - second[0] || first[1] - second[1];
}

function compareRingRotations(positions, firstIndex, secondIndex) {
  for (let offset = 0; offset < positions.length; offset += 1) {
    const comparison = comparePositions(
      positions[(firstIndex + offset) % positions.length],
      positions[(secondIndex + offset) % positions.length]
    );
    if (comparison !== 0) return comparison;
  }
  return 0;
}

function signedRingArea(positions) {
  let twiceArea = 0;
  for (let index = 0; index < positions.length; index += 1) {
    const current = positions[index];
    const next = positions[(index + 1) % positions.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return twiceArea / 2;
}

function roundCoordinate(value, code) {
  if (!Number.isFinite(value)) {
    throw new Error(`Natural Earth ${code} has a non-finite coordinate`);
  }
  const rounded = Number(value.toFixed(COORDINATE_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalizeRing(sourceRing, isExterior, code) {
  if (!Array.isArray(sourceRing) || sourceRing.length < 4) {
    throw new Error(`Natural Earth ${code} has an invalid ring`);
  }

  const positions = [];
  for (const sourcePosition of sourceRing) {
    if (!Array.isArray(sourcePosition) || sourcePosition.length < 2) {
      throw new Error(`Natural Earth ${code} has an invalid position`);
    }
    const position = [
      roundCoordinate(sourcePosition[0], code),
      roundCoordinate(sourcePosition[1], code)
    ];
    if (positions.length === 0 || !positionsEqual(positions.at(-1), position)) {
      positions.push(position);
    }
  }

  if (positions.length > 1 && positionsEqual(positions[0], positions.at(-1))) {
    positions.pop();
  }
  if (positions.length < 3) {
    throw new Error(`Natural Earth ${code} ring collapsed after coordinate normalization`);
  }

  const area = signedRingArea(positions);
  if (area === 0) {
    throw new Error(`Natural Earth ${code} has a zero-area ring`);
  }
  if ((area > 0) !== isExterior) {
    positions.reverse();
  }

  let canonicalStart = 0;
  for (let index = 1; index < positions.length; index += 1) {
    if (compareRingRotations(positions, index, canonicalStart) < 0) {
      canonicalStart = index;
    }
  }
  const canonical = [
    ...positions.slice(canonicalStart),
    ...positions.slice(0, canonicalStart)
  ];
  canonical.push([...canonical[0]]);
  return canonical;
}

function normalizeGeometry(sourceGeometry, code) {
  if (sourceGeometry?.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: sourceGeometry.coordinates.map((ring, index) =>
        normalizeRing(ring, index === 0, code)
      )
    };
  }
  if (sourceGeometry?.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: sourceGeometry.coordinates.map((polygon) =>
        polygon.map((ring, index) => normalizeRing(ring, index === 0, code))
      )
    };
  }
  throw new Error(`Natural Earth ${code} has unsupported geometry: ${sourceGeometry?.type}`);
}

function extractArchiveEntries(source) {
  const archive = unzipSync(source);
  const shape = archive[`${SHAPEFILE_BASENAME}.shp`];
  const database = archive[`${SHAPEFILE_BASENAME}.dbf`];
  if (!shape || !database) {
    throw new Error("Natural Earth archive is missing the pinned shapefile or dBASE entry");
  }
  return { shape, database };
}

function normalizeFeatures(sourceCollection) {
  if (sourceCollection?.type !== "FeatureCollection") {
    throw new Error("Shapefile parser did not produce a GeoJSON FeatureCollection");
  }

  const sourceByCode = new Map();
  for (const feature of sourceCollection.features) {
    if (cleanDbfString(feature?.properties?.adm0_a3) !== "JPN") continue;
    const code = cleanDbfString(feature?.properties?.iso_3166_2);
    if (typeof code !== "string" || sourceByCode.has(code)) {
      throw new Error(`Natural Earth has a missing or duplicate prefecture code: ${String(code)}`);
    }
    sourceByCode.set(code, normalizeGeometry(feature.geometry, code));
  }

  const features = PREFECTURES.map(({ prefectureCode, entityId, label }) => {
    const sourceFeature = sourceByCode.get(prefectureCode);
    if (!sourceFeature) {
      throw new Error(`Natural Earth is missing ${prefectureCode}`);
    }
    return {
      type: "Feature",
      properties: { prefectureCode, entityId, label },
      geometry: sourceFeature
    };
  });

  if (features.length !== 47 || sourceByCode.size !== 47) {
    throw new Error(
      `Expected exactly 47 Natural Earth prefectures, received ${sourceByCode.size}`
    );
  }

  return { type: "FeatureCollection", features };
}

async function main() {
  const localInput = parseLocalInput(process.argv.slice(2));
  const source = await loadUpstream(localInput);
  assertPinnedSha(source);
  await assertLocalProcessorPackages();
  const { shape, database } = extractArchiveEntries(source);
  const processedCollection = await shapefile.read(shape, database, { encoding: "utf-8" });
  const boundaryCollection = normalizeFeatures(processedCollection);
  const provenance = {
    artifactVersion: ARTIFACT_VERSION,
    upstreamDataset: "Natural Earth Admin 1 – States, Provinces",
    upstreamVersion: UPSTREAM_VERSION,
    immutableUrl: UPSTREAM_URL,
    upstreamSha256: UPSTREAM_SHA256,
    termsUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
    license: "Public domain",
    worldview: {
      status: "beta",
      boundaryType: "de facto"
    },
    processingDate: "2026-07-18",
    processor: {
      name: "repository-local shapefile + fflate",
      version: `shapefile@${SHAPEFILE_VERSION}; fflate@${FFLATE_VERSION}`
    },
    command: "node scripts/build-prefecture-boundaries.mjs --input <source.zip>",
    processing:
      "Natural Earth 5.1.1 Admin-1 States, Provinces から日本の47都道府県を抽出し、座標を小数点以下5桁へ丸め、リングの向きと始点を決定論的に正規化して作成",
    limitation:
      "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
    };

  const outputDirectory = path.join(repositoryRoot, "data/geo");
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, ARTIFACT_NAME), `${JSON.stringify(boundaryCollection)}\n`),
    writeFile(path.join(outputDirectory, PROVENANCE_NAME), `${JSON.stringify(provenance)}\n`)
  ]);
}

await main();
