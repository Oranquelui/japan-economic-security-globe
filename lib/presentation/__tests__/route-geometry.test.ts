import { describe, expect, test } from "vitest";

import {
  buildMaritimeRouteCoordinates,
  densifyGeodesicPolyline,
  expandWithSeaLanes,
  haversineKm,
  type LonLat
} from "../route-geometry";

describe("route geometry", () => {
  test("densifies geodesic segments so routes are not two-point chords", () => {
    const start: LonLat = [45.0, 23.0];
    const end: LonLat = [139.7, 35.4];
    const densified = densifyGeodesicPolyline([start, end], 20);

    expect(densified.length).toBeGreaterThan(10);
    expect(densified[0][0]).toBeCloseTo(start[0], 3);
    expect(densified[densified.length - 1][1]).toBeCloseTo(end[1], 3);
  });

  test("routes Middle East to Japan via southern open-water corridor instead of over India", () => {
    const rasTanura: LonLat = [50.1, 26.6];
    const kashima: LonLat = [140.7, 35.9];
    const expanded = expandWithSeaLanes([rasTanura, kashima]);
    const coords = buildMaritimeRouteCoordinates([rasTanura, kashima]);

    expect(expanded.length).toBeGreaterThan(4);
    // Southern Indian Ocean bias: at least one control near Sri Lanka / open water south.
    expect(expanded.some(([lon, lat]) => lon > 70 && lon < 95 && lat < 12)).toBe(true);

    // Densified path should stay much longer than the pure chord (detour + sampling).
    const chord = haversineKm(rasTanura, kashima);
    let pathLength = 0;
    for (let index = 1; index < coords.length; index += 1) {
      pathLength += haversineKm(coords[index - 1], coords[index]);
    }
    expect(pathLength).toBeGreaterThan(chord * 1.05);
    expect(coords.length).toBeGreaterThan(30);

    // Mid-path sample should not sit on the Indian peninsula core.
    const mid = coords[Math.floor(coords.length / 2)];
    const overIndianCore = mid[0] > 72 && mid[0] < 88 && mid[1] > 12 && mid[1] < 28;
    expect(overIndianCore).toBe(false);
  });

  test("keeps short domestic segments mostly local without ocean detours", () => {
    const yokohama: LonLat = [139.67, 35.44];
    const tokyo: LonLat = [139.69, 35.68];
    const coords = buildMaritimeRouteCoordinates([yokohama, tokyo]);

    expect(coords.length).toBeGreaterThan(2);
    // All points remain near Tokyo Bay.
    expect(coords.every(([lon, lat]) => lon > 138.5 && lon < 141 && lat > 34.5 && lat < 36.5)).toBe(true);
  });
});
