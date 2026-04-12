import { describe, expect, test } from "vitest";

import { getModeVisibilityState } from "../JapanOperationsMapCanvas";

describe("map visibility state", () => {
  test("keeps dependency lines visible in point mode so relationships stay legible", () => {
    expect(getModeVisibilityState("point")).toMatchObject({
      showPoints: true,
      showRoutes: true,
      showRegions: false
    });
  });

  test("still uses cluster mode for aggregated point views", () => {
    expect(getModeVisibilityState("cluster")).toMatchObject({
      showPoints: false,
      showRoutes: false,
      showClusters: true
    });
  });
});
