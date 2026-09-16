import type { LonLat } from "./route-geometry";

type CoordinateValidationOptions = {
  normalizeLongitude?: boolean;
};

function normalizeLongitude(longitude: number): number {
  if (longitude >= -180 && longitude <= 180) {
    return Object.is(longitude, -0) ? 0 : longitude;
  }
  const wrapped = ((longitude % 360) + 360) % 360;
  const normalized = wrapped === 180
    ? (longitude < 0 ? -180 : 180)
    : (wrapped > 180 ? wrapped - 360 : wrapped);
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function assertAndNormalizeLonLat(
  coordinate: readonly number[],
  context: string,
  options: CoordinateValidationOptions = {}
): LonLat {
  if (!Array.isArray(coordinate) || coordinate.length !== 2) {
    throw new Error(`${context} must contain exactly two coordinate values`);
  }
  if (!Number.isFinite(coordinate[0])) {
    throw new Error(`${context} longitude must be finite`);
  }
  if (!Number.isFinite(coordinate[1])) {
    throw new Error(`${context} latitude must be finite`);
  }
  if (coordinate[1] < -90 || coordinate[1] > 90) {
    throw new Error(`${context} latitude must be between -90 and 90`);
  }
  if (options.normalizeLongitude === false && (coordinate[0] < -180 || coordinate[0] > 180)) {
    throw new Error(`${context} longitude must be between -180 and 180`);
  }
  return [
    options.normalizeLongitude === false ? coordinate[0] : normalizeLongitude(coordinate[0]),
    coordinate[1]
  ];
}

function sameCoordinate(a: LonLat, b: LonLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function appendDistinct(part: LonLat[], coordinate: LonLat) {
  if (!sameCoordinate(part[part.length - 1], coordinate)) {
    part.push(coordinate);
  }
}

function emitIfLine(parts: LonLat[][], part: LonLat[]) {
  if (part.length < 2) return;
  const previousPart = parts.at(-1);
  if (previousPart && sameCoordinate(previousPart.at(-1)!, part[0])) {
    previousPart.push(...part.slice(1));
    return;
  }
  parts.push(part);
}

/**
 * Splits a normalized route into local line parts at the antimeridian.
 * Paired boundary points share one interpolated latitude, avoiding any
 * connector spanning the rendered world.
 */
export function splitRouteAtAntimeridian(
  coordinates: readonly (readonly [number, number])[]
): LonLat[][] {
  if (coordinates.length < 2) return [];

  const parts: LonLat[][] = [];
  let previous = assertAndNormalizeLonLat(coordinates[0], "Route coordinate 0");
  let currentPart: LonLat[] = [[...previous]];

  for (let index = 1; index < coordinates.length; index += 1) {
    const destination = assertAndNormalizeLonLat(coordinates[index], `Route coordinate ${index}`);
    const normalizedDelta = destination[0] - previous[0];

    if (Math.abs(normalizedDelta) <= 180) {
      appendDistinct(currentPart, [...destination]);
      previous = destination;
      continue;
    }

    const unwrappedDestinationLongitude = destination[0] + (normalizedDelta > 0 ? -360 : 360);
    const unwrappedDelta = unwrappedDestinationLongitude - previous[0];

    // +180 and -180 denote the same meridian. Switch representation without
    // introducing a 360-degree segment, retaining any movement in latitude.
    if (unwrappedDelta === 0) {
      appendDistinct(currentPart, [previous[0], destination[1]]);
      emitIfLine(parts, currentPart);
      currentPart = [[destination[0], destination[1]]];
      previous = destination;
      continue;
    }

    const closingLongitude = unwrappedDelta > 0 ? 180 : -180;
    const fraction = (closingLongitude - previous[0]) / unwrappedDelta;
    const boundaryLatitude = previous[1] + (destination[1] - previous[1]) * fraction;

    appendDistinct(currentPart, [closingLongitude, boundaryLatitude]);
    emitIfLine(parts, currentPart);

    currentPart = [[-closingLongitude, boundaryLatitude]];
    appendDistinct(currentPart, [...destination]);
    previous = destination;
  }

  emitIfLine(parts, currentPart);
  return parts;
}
