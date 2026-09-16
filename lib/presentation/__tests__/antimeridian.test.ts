import { describe, expect, test } from "vitest";

import { splitRouteAtAntimeridian } from "../antimeridian";
import type { LonLat } from "../route-geometry";

function expectValidParts(parts: LonLat[][]) {
  for (const part of parts) {
    expect(part.length).toBeGreaterThanOrEqual(2);
    for (let index = 1; index < part.length; index += 1) {
      expect(Math.abs(part[index][0] - part[index - 1][0])).toBeLessThanOrEqual(180);
    }
  }
}

describe("splitRouteAtAntimeridian", () => {
  test.each([
    {
      label: "eastbound",
      route: [[179, 10], [-179, 14]] as LonLat[],
      closingLongitude: 180,
      openingLongitude: -180
    },
    {
      label: "westbound",
      route: [[-179, 10], [179, 14]] as LonLat[],
      closingLongitude: -180,
      openingLongitude: 180
    }
  ])("splits an $label crossing at paired boundary points", ({ route, closingLongitude, openingLongitude }) => {
    const parts = splitRouteAtAntimeridian(route);

    expect(parts).toHaveLength(2);
    expect(parts[0].at(-1)?.[0]).toBe(closingLongitude);
    expect(parts[1][0][0]).toBe(openingLongitude);
    expect(parts[0].at(-1)?.[1]).toBeCloseTo(12, 12);
    expect(parts[1][0][1]).toBe(parts[0].at(-1)?.[1]);
    expectValidParts(parts);
  });

  test.each([
    { route: [[-179.66, 45.2], [178.92, 45.8]] as LonLat[] },
    { route: [[-179.26, 37.4], [179.41, 38.1]] as LonLat[] }
  ])("splits a confirmed North Pacific longitude jump $route", ({ route }) => {
    const parts = splitRouteAtAntimeridian(route);

    expect(parts).toHaveLength(2);
    expect(parts[0].at(-1)?.[0]).toBe(-180);
    expect(parts[1][0][0]).toBe(180);
    expect(parts[0].at(-1)?.[1]).toBe(parts[1][0][1]);
    expectValidParts(parts);
  });

  test("handles multiple crossings deterministically", () => {
    const route = [[170, 0], [-170, 10], [170, 20], [-170, 30]] as const;

    const first = splitRouteAtAntimeridian(route);
    const second = splitRouteAtAntimeridian(route);

    expect(first).toEqual(second);
    expect(first).toEqual([
      [[170, 0], [180, 5]],
      [[-180, 5], [-170, 10], [-180, 15]],
      [[180, 15], [170, 20], [180, 25]],
      [[-180, 25], [-170, 30]]
    ]);
    expectValidParts(first);
  });

  test("keeps non-crossing routes together and normalizes longitudes", () => {
    const parts = splitRouteAtAntimeridian([[190, 1], [200, 2], [210, 3]]);

    expect(parts).toEqual([[[-170, 1], [-160, 2], [-150, 3]]]);
  });

  test("preserves already-normalized decimal longitudes exactly", () => {
    const route = [[50.1, 10], [139.7, 20]] as const;

    expect(splitRouteAtAntimeridian(route)).toEqual([[...route]]);
  });

  test.each([
    {
      route: [[179, 0], [-180, 1]] as LonLat[],
      expected: [[[179, 0], [180, 1]]] as LonLat[][]
    },
    {
      route: [[-179, 0], [180, 1]] as LonLat[],
      expected: [[[-179, 0], [-180, 1]]] as LonLat[][]
    }
  ])("uses the local boundary representation for an endpoint on the antimeridian", ({ route, expected }) => {
    expect(splitRouteAtAntimeridian(route)).toEqual(expected);
  });

  test("handles duplicate opposite-sign boundary inputs without a 360-degree connector", () => {
    const route: LonLat[] = [[179, 0], [180, 1], [-180, 1], [-179, 2]];
    const parts = splitRouteAtAntimeridian(route);

    expect(parts).toEqual([
      [[179, 0], [180, 1]],
      [[-180, 1], [-179, 2]]
    ]);
    expectValidParts(parts);
  });

  test("does not leave a false split when a duplicate boundary input reverses direction", () => {
    const route: LonLat[] = [[179, 0], [180, 1], [-180, 1], [179, 2]];

    expect(splitRouteAtAntimeridian(route)).toEqual([[
      [179, 0],
      [180, 1],
      [179, 2]
    ]]);
  });

  test("does not emit parts for routes shorter than two points", () => {
    expect(splitRouteAtAntimeridian([])).toEqual([]);
    expect(splitRouteAtAntimeridian([[12, 34]])).toEqual([]);
  });

  test.each([
    [[[Number.NaN, 0], [1, 1]], /longitude must be finite/],
    [[[0, 91], [1, 1]], /latitude.*-90.*90/]
  ] as const)("rejects invalid coordinates with an actionable error", (route, message) => {
    expect(() => splitRouteAtAntimeridian(route as unknown as LonLat[])).toThrow(message);
  });

  test("does not mutate the input or share its coordinate tuples", () => {
    const route: LonLat[] = [[179, 10], [-179, 14], [-170, 20]];
    const before = structuredClone(route);
    const parts = splitRouteAtAntimeridian(route);

    expect(route).toEqual(before);
    parts[0][0][0] = 0;
    expect(route).toEqual(before);
  });
});
