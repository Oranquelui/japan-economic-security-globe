/**
 * Maritime-aware route densification.
 * Converts sparse waypoint polylines into curved, water-biased paths so
 * tanker/energy routes no longer read as ruler-straight lines across land.
 */

export type LonLat = [number, number];

/** Named open-water control points for common Japan-bound corridors. */
const SEA_LANE_NODES: Record<string, LonLat> = {
  "gulf-exit": [57.8, 24.8],
  "arabian-sea": [64.5, 14.0],
  "maldives-east": [76.0, 4.8],
  "sri-lanka-south": [81.2, 5.2],
  "andaman-sea": [94.5, 8.5],
  "malacca-west": [99.2, 5.0],
  "malacca": [101.5, 2.8],
  "singapore": [104.0, 1.2],
  "south-china-sea": [112.5, 13.5],
  "luzon-strait": [121.0, 20.5],
  "east-china-sea": [128.0, 29.5],
  "japan-south-approaches": [134.5, 32.5],
  "japan-east-approaches": [141.0, 34.5],
  "timor-sea": [128.0, -11.0],
  "celebes-sea": [123.0, 3.0],
  "philippine-sea-south": [132.0, 18.0],
  "pacific-mid-lat": [165.0, 32.0],
  "ne-pacific": [-165.0, 38.0],
  "us-west-approaches": [-128.0, 36.0],
  "panama-pacific": [-82.0, 7.0],
  "caribbean": [-75.0, 18.0],
  "us-gulf": [-90.0, 27.0]
};

const ME_TO_JAPAN_CHAIN: LonLat[] = [
  SEA_LANE_NODES["gulf-exit"],
  SEA_LANE_NODES["arabian-sea"],
  SEA_LANE_NODES["maldives-east"],
  SEA_LANE_NODES["sri-lanka-south"],
  SEA_LANE_NODES["andaman-sea"],
  SEA_LANE_NODES["malacca-west"],
  SEA_LANE_NODES["malacca"],
  SEA_LANE_NODES["singapore"],
  SEA_LANE_NODES["south-china-sea"],
  SEA_LANE_NODES["luzon-strait"],
  SEA_LANE_NODES["east-china-sea"],
  SEA_LANE_NODES["japan-south-approaches"]
];

const AUS_TO_JAPAN_CHAIN: LonLat[] = [
  SEA_LANE_NODES["timor-sea"],
  SEA_LANE_NODES["celebes-sea"],
  SEA_LANE_NODES["philippine-sea-south"],
  SEA_LANE_NODES["japan-east-approaches"]
];

const US_TO_JAPAN_CHAIN: LonLat[] = [
  SEA_LANE_NODES["us-west-approaches"],
  SEA_LANE_NODES["ne-pacific"],
  SEA_LANE_NODES["pacific-mid-lat"],
  SEA_LANE_NODES["japan-east-approaches"]
];

const US_GULF_TO_JAPAN_CHAIN: LonLat[] = [
  SEA_LANE_NODES["us-gulf"],
  SEA_LANE_NODES["caribbean"],
  SEA_LANE_NODES["panama-pacific"],
  SEA_LANE_NODES["ne-pacific"],
  SEA_LANE_NODES["pacific-mid-lat"],
  SEA_LANE_NODES["japan-east-approaches"]
];

export function buildMaritimeRouteCoordinates(
  anchors: LonLat[],
  options?: {
    /** Samples per geodesic segment after corridor expansion. */
    samplesPerSegment?: number;
  }
): LonLat[] {
  if (anchors.length < 2) {
    return anchors.slice();
  }

  const samplesPerSegment = options?.samplesPerSegment ?? 18;
  const expanded = expandWithSeaLanes(anchors);
  return densifyGeodesicPolyline(expanded, samplesPerSegment);
}

export function densifyGeodesicPolyline(coordinates: LonLat[], samplesPerSegment = 16): LonLat[] {
  if (coordinates.length < 2) {
    return coordinates.slice();
  }

  const result: LonLat[] = [];

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    const distanceKm = haversineKm(start, end);
    const samples = Math.max(2, Math.min(48, Math.round(samplesPerSegment * Math.min(2.5, Math.max(0.35, distanceKm / 1200)))));
    const segment = interpolateGeodesic(start, end, samples);

    if (index === 0) {
      result.push(...segment);
    } else {
      // Skip duplicated joint point.
      result.push(...segment.slice(1));
    }
  }

  return result;
}

/**
 * Insert open-water corridor control points when a long segment would otherwise
 * cut across land (e.g. Arabian Peninsula → Japan as a single chord).
 */
export function expandWithSeaLanes(anchors: LonLat[]): LonLat[] {
  if (anchors.length < 2) {
    return anchors.slice();
  }

  const expanded: LonLat[] = [anchors[0]];

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];
    const distanceKm = haversineKm(start, end);

    if (distanceKm > 900) {
      const corridor = pickCorridorBridge(start, end);
      for (const node of corridor) {
        const previous = expanded[expanded.length - 1];
        if (haversineKm(previous, node) > 180 && haversineKm(node, end) > 180) {
          expanded.push(node);
        }
      }
    }

    expanded.push(end);
  }

  return dedupeNearPoints(expanded, 90);
}

export function interpolateGeodesic(start: LonLat, end: LonLat, samples: number): LonLat[] {
  if (samples <= 1) {
    return [start, end];
  }

  const [lon1, lat1] = toRadians(start);
  const [lon2, lat2] = toRadians(end);
  const delta =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
        )
      )
    );

  if (!Number.isFinite(delta) || delta < 1e-9) {
    return [start, end];
  }

  const points: LonLat[] = [];

  for (let step = 0; step <= samples; step += 1) {
    const fraction = step / samples;
    const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const B = Math.sin(fraction * delta) / Math.sin(delta);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    points.push(normalizeLonLat([toDegrees(lon), toDegrees(lat)]));
  }

  return points;
}

export function haversineKm(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = toRadians(a);
  const [lon2, lat2] = toRadians(b);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pickCorridorBridge(start: LonLat, end: LonLat): LonLat[] {
  const startRegion = classifyRegion(start);
  const endRegion = classifyRegion(end);

  if (
    (startRegion === "middle-east" && endRegion === "japan") ||
    (startRegion === "japan" && endRegion === "middle-east") ||
    (startRegion === "middle-east" && endRegion === "se-asia") ||
    (startRegion === "se-asia" && endRegion === "middle-east") ||
    (startRegion === "middle-east" && endRegion === "east-asia") ||
    (startRegion === "east-asia" && endRegion === "middle-east")
  ) {
    return orderChain(start, end, ME_TO_JAPAN_CHAIN);
  }

  if (
    (startRegion === "australia" && (endRegion === "japan" || endRegion === "east-asia")) ||
    ((startRegion === "japan" || startRegion === "east-asia") && endRegion === "australia")
  ) {
    return orderChain(start, end, AUS_TO_JAPAN_CHAIN);
  }

  if (
    (startRegion === "us-west" && (endRegion === "japan" || endRegion === "east-asia")) ||
    ((startRegion === "japan" || startRegion === "east-asia") && endRegion === "us-west")
  ) {
    return orderChain(start, end, US_TO_JAPAN_CHAIN);
  }

  if (
    (startRegion === "us-gulf" && (endRegion === "japan" || endRegion === "east-asia")) ||
    ((startRegion === "japan" || startRegion === "east-asia") && endRegion === "us-gulf")
  ) {
    return orderChain(start, end, US_GULF_TO_JAPAN_CHAIN);
  }

  // Generic long-haul: pull the chord slightly toward open ocean south of land masses.
  return [biasMidpointOffshore(start, end)];
}

function orderChain(start: LonLat, end: LonLat, chain: LonLat[]): LonLat[] {
  const forwardScore = corridorAlignmentScore(start, end, chain);
  const reverse = [...chain].reverse();
  const reverseScore = corridorAlignmentScore(start, end, reverse);
  const ordered = reverseScore < forwardScore ? reverse : chain;

  // Keep only the interior bridge between nearest nodes to start/end.
  const startIndex = nearestIndex(ordered, start);
  const endIndex = nearestIndex(ordered, end);

  if (startIndex === endIndex) {
    return [ordered[startIndex]];
  }

  const low = Math.min(startIndex, endIndex);
  const high = Math.max(startIndex, endIndex);
  const slice = ordered.slice(low, high + 1);
  return startIndex <= endIndex ? slice : [...slice].reverse();
}

function corridorAlignmentScore(start: LonLat, end: LonLat, chain: LonLat[]): number {
  const first = chain[0];
  const last = chain[chain.length - 1];
  return haversineKm(start, first) + haversineKm(last, end);
}

function nearestIndex(points: LonLat[], target: LonLat): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const distance = haversineKm(points[index], target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function biasMidpointOffshore(start: LonLat, end: LonLat): LonLat {
  const midLon = averageLongitude(start[0], end[0]);
  const midLat = (start[1] + end[1]) / 2;

  // If the chord sits over South/SE Asia land, pull south into open water.
  if (midLon > 60 && midLon < 130 && midLat > 5 && midLat < 40) {
    return normalizeLonLat([midLon, Math.min(midLat, 7) - 2.5]);
  }

  // Pacific chords: keep near great-circle mid, slightly lower latitude.
  if (Math.abs(midLon) > 130 || midLon < -100) {
    return normalizeLonLat([midLon, midLat - 1.5]);
  }

  return normalizeLonLat([midLon, midLat]);
}

function classifyRegion(point: LonLat): string {
  const [lon, lat] = point;

  if (lon >= 32 && lon <= 62 && lat >= 10 && lat <= 42) {
    return "middle-east";
  }
  if (lon >= 95 && lon <= 120 && lat >= -5 && lat <= 22) {
    return "se-asia";
  }
  if (lon >= 120 && lon <= 150 && lat >= 20 && lat <= 48) {
    return "japan";
  }
  if (lon >= 110 && lon <= 150 && lat >= 15 && lat <= 45) {
    return "east-asia";
  }
  if (lon >= 110 && lon <= 155 && lat >= -45 && lat <= -8) {
    return "australia";
  }
  if (lon >= -130 && lon <= -115 && lat >= 30 && lat <= 50) {
    return "us-west";
  }
  if (lon >= -98 && lon <= -80 && lat >= 24 && lat <= 32) {
    return "us-gulf";
  }

  return "open";
}

function dedupeNearPoints(points: LonLat[], minSeparationKm: number): LonLat[] {
  if (points.length === 0) {
    return [];
  }

  const result: LonLat[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    if (haversineKm(result[result.length - 1], points[index]) >= minSeparationKm) {
      result.push(points[index]);
    }
  }

  // Always keep the true final anchor.
  const last = points[points.length - 1];
  if (haversineKm(result[result.length - 1], last) > 1) {
    result.push(last);
  }

  return result;
}

function averageLongitude(a: number, b: number): number {
  const aRad = (a * Math.PI) / 180;
  const bRad = (b * Math.PI) / 180;
  const x = Math.cos(aRad) + Math.cos(bRad);
  const y = Math.sin(aRad) + Math.sin(bRad);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function normalizeLonLat([lon, lat]: LonLat): LonLat {
  let normalizedLon = lon;
  while (normalizedLon > 180) {
    normalizedLon -= 360;
  }
  while (normalizedLon < -180) {
    normalizedLon += 360;
  }
  return [normalizedLon, Math.max(-85, Math.min(85, lat))];
}

function toRadians([lon, lat]: LonLat): [number, number] {
  return [(lon * Math.PI) / 180, (lat * Math.PI) / 180];
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
