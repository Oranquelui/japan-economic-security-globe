import { describe, expect, test } from "vitest";

import { getThemePalette } from "../palette";
import { buildOperationsBasemapStyle } from "../basemap-style";

describe("operations basemap style", () => {
  test("uses a night-atlas terrain basemap with local geography fallback", () => {
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
    expect(style.layers.map((layer) => layer.id).indexOf("world-land-fill")).toBeLessThan(
      style.layers.map((layer) => layer.id).indexOf("gray-canvas-reference")
    );
    expect(style.layers.find((layer) => layer.id === "ops-background")).toMatchObject({
      paint: { "background-color": "#0a121c" }
    });
    expect(style.layers.find((layer) => layer.id === "terrain-shaded-relief")).toMatchObject({
      paint: { "raster-opacity": 0.34 }
    });
    expect(style.layers.find((layer) => layer.id === "terrain-contours")).toMatchObject({
      minzoom: 2.4,
      paint: { "raster-opacity": 0.22 }
    });
    expect(style.layers.find((layer) => layer.id === "gray-canvas-base")).toMatchObject({
      paint: { "raster-opacity": 0.28 }
    });
    expect(style.layers.find((layer) => layer.id === "world-land-fill")).toMatchObject({
      paint: { "fill-color": "rgba(92, 128, 148, 0.12)" }
    });
  });
});
