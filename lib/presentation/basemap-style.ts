import type {
  BackgroundLayerSpecification,
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  StyleSpecification
} from "maplibre-gl";
import { feature, mesh } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";

import type { ThemePalette } from "./palette";

const landFeature = feature(countries110m as any, (countries110m as any).objects.land);
const borderMesh = mesh(countries110m as any, (countries110m as any).objects.countries, (a: unknown, b: unknown) => a !== b);

export function buildOperationsBasemapStyle(themePalette: ThemePalette) {
  const sources: Record<string, GeoJSONSourceSpecification> = {
    "world-land": {
      type: "geojson",
      data: landFeature
    },
    "world-borders": {
      type: "geojson",
      data: borderMesh
    }
  };

  const layers: Array<BackgroundLayerSpecification | FillLayerSpecification | LineLayerSpecification> = [
    {
      id: "ops-background",
      type: "background",
      paint: {
        "background-color": themePalette.surfaceCanvas
      }
    },
    {
      id: "world-land-fill",
      type: "fill",
      source: "world-land",
      paint: {
        "fill-color": "#0b1522",
        "fill-opacity": 0.92
      }
    },
    {
      id: "world-borders-line",
      type: "line",
      source: "world-borders",
      paint: {
        "line-color": "rgba(161, 180, 204, 0.18)",
        "line-width": 0.8,
        "line-opacity": 0.72
      }
    }
  ];

  const style: StyleSpecification = {
    version: 8 as const,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources,
    layers
  };

  return style;
}
