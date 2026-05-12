import { describe, expect, test } from "vitest";

import { getThemePalette } from "../palette";
import { buildOperationsBasemapStyle } from "../basemap-style";

describe("operations basemap style", () => {
  test("uses a terrain-aware gray canvas basemap with local geography fallback", () => {
    const style = buildOperationsBasemapStyle(getThemePalette("energy"));
    expect(style.sources).toHaveProperty("world-land");
    expect(style.sources).toHaveProperty("terrain-shaded-relief");
    expect(style.sources).toHaveProperty("terrain-contours");
    expect(style.sources).toHaveProperty("gray-canvas-base");
    expect(style.sources).toHaveProperty("gray-canvas-reference");
    expect(style.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining([
        "ops-background",
        "terrain-shaded-relief",
        "terrain-contours",
        "world-land-fill",
        "gray-canvas-base",
        "gray-canvas-reference"
      ])
    );
    expect(style.layers.map((layer) => layer.id).indexOf("terrain-shaded-relief")).toBeLessThan(
      style.layers.map((layer) => layer.id).indexOf("gray-canvas-base")
    );
    expect(style.layers.find((layer) => layer.id === "terrain-shaded-relief")).toMatchObject({
      paint: { "raster-opacity": 0.46 }
    });
    expect(style.layers.find((layer) => layer.id === "terrain-contours")).toMatchObject({
      minzoom: 2.4,
      paint: { "raster-opacity": 0.34 }
    });
    expect(style.layers.find((layer) => layer.id === "gray-canvas-base")).toMatchObject({
      paint: { "raster-opacity": 0.58 }
    });
    expect(style.layers.find((layer) => layer.id === "world-land-fill")).toMatchObject({
      paint: { "fill-color": "rgba(218,229,224,0.16)" }
    });
  });
});
