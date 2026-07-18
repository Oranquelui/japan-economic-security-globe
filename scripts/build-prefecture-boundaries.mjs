#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const UPSTREAM_VERSION = "5.1.1";
const UPSTREAM_URL =
  "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip";
const UPSTREAM_SHA256 = "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05";
const MAPSHAPER_VERSION = "0.7.45";
const ARTIFACT_VERSION = "natural-earth-5.1.1-japan-prefectures-v1";
const ARTIFACT_NAME = "japan-prefectures-natural-earth-5.1.1.geojson";
const PROVENANCE_NAME = "japan-prefectures-natural-earth-5.1.1.provenance.json";

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

const MAPSHAPER_ARGS = [
  "<source.zip>",
  "-target",
  "ne_10m_admin_1_states_provinces",
  "-filter",
  'adm0_a3 == "JPN"',
  "-filter-fields",
  "iso_3166_2,name_ja",
  "-clean",
  "-o",
  "format=geojson",
  "precision=0.00001",
  "<processed.geojson>"
];

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

async function assertLocalMapshaper(mapshaperBinary) {
  await access(mapshaperBinary);
  const packageJson = JSON.parse(
    await readFile(path.join(repositoryRoot, "node_modules/mapshaper/package.json"), "utf8")
  );
  if (packageJson.version !== MAPSHAPER_VERSION) {
    throw new Error(
      `Local mapshaper version mismatch: expected ${MAPSHAPER_VERSION}, received ${packageJson.version}`
    );
  }
}

function normalizeFeatures(processedCollection) {
  if (processedCollection?.type !== "FeatureCollection") {
    throw new Error("Mapshaper did not produce a GeoJSON FeatureCollection");
  }

  const sourceByCode = new Map();
  for (const feature of processedCollection.features) {
    const code = feature?.properties?.iso_3166_2;
    if (typeof code !== "string" || sourceByCode.has(code)) {
      throw new Error(`Natural Earth has a missing or duplicate prefecture code: ${String(code)}`);
    }
    if (feature.geometry?.type !== "Polygon" && feature.geometry?.type !== "MultiPolygon") {
      throw new Error(`Natural Earth ${code} has unsupported geometry: ${feature.geometry?.type}`);
    }
    sourceByCode.set(code, feature);
  }

  const features = PREFECTURES.map(({ prefectureCode, entityId, label }) => {
    const sourceFeature = sourceByCode.get(prefectureCode);
    if (!sourceFeature) {
      throw new Error(`Natural Earth is missing ${prefectureCode}`);
    }
    return {
      type: "Feature",
      properties: { prefectureCode, entityId, label },
      geometry: sourceFeature.geometry
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

  const mapshaperBinary = path.join(repositoryRoot, "node_modules/.bin/mapshaper");
  await assertLocalMapshaper(mapshaperBinary);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "jp-prefecture-boundaries-"));
  const sourcePath = path.join(temporaryDirectory, "natural-earth.zip");
  const processedPath = path.join(temporaryDirectory, "processed.geojson");

  try {
    await writeFile(sourcePath, source);
    await execFileAsync(
      mapshaperBinary,
      MAPSHAPER_ARGS.map((argument) => {
        if (argument === "<source.zip>") return sourcePath;
        if (argument === "<processed.geojson>") return processedPath;
        return argument;
      }),
      { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 }
    );

    const processedCollection = JSON.parse(await readFile(processedPath, "utf8"));
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
        name: "mapshaper",
        version: MAPSHAPER_VERSION
      },
      command:
        "./node_modules/.bin/mapshaper <source.zip> -target ne_10m_admin_1_states_provinces -filter 'adm0_a3 == \"JPN\"' -filter-fields iso_3166_2,name_ja -clean -o format=geojson precision=0.00001 <processed.geojson>",
      processing:
        "Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成",
      limitation:
        "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
    };

    const outputDirectory = path.join(repositoryRoot, "data/geo");
    await mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      writeFile(path.join(outputDirectory, ARTIFACT_NAME), `${JSON.stringify(boundaryCollection)}\n`),
      writeFile(path.join(outputDirectory, PROVENANCE_NAME), `${JSON.stringify(provenance)}\n`)
    ]);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

await main();
