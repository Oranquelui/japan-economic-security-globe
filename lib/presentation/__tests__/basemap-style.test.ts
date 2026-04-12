import { describe, expect, test } from "vitest";

import { getThemePalette } from "../palette";
import { buildOperationsBasemapStyle } from "../basemap-style";

describe("operations basemap style", () => {
  test("uses a gray canvas raster basemap with local geography fallback", () => {
    const style = buildOperationsBasemapStyle(getThemePalette("energy"));
    expect(style.sources).toHaveProperty("world-land");
    expect(style.sources).toHaveProperty("gray-canvas-base");
    expect(style.sources).toHaveProperty("gray-canvas-reference");
    expect(style.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining([
        "ops-background",
        "world-land-fill",
        "gray-canvas-base",
        "gray-canvas-reference"
      ])
    );
  });
});
