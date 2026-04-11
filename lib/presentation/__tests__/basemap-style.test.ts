import { describe, expect, test } from "vitest";

import { getThemePalette } from "../palette";
import { buildOperationsBasemapStyle } from "../basemap-style";

describe("operations basemap style", () => {
  test("does not depend on CARTO raster tiles and uses local geography sources", () => {
    const style = buildOperationsBasemapStyle(getThemePalette("energy"));
    const sourceEntries = Object.entries(style.sources);

    expect(sourceEntries.every(([, source]) => source.type === "geojson")).toBe(true);
    expect(style.sources).toHaveProperty("world-land");
    expect(style.sources).toHaveProperty("world-borders");
    expect(style.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining(["ops-background", "world-land-fill", "world-borders-line"])
    );
  });
});
