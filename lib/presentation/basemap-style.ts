import type {
  BackgroundLayerSpecification,
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  RasterLayerSpecification,
  RasterSourceSpecification,
  StyleSpecification
} from "maplibre-gl";
import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";

import type { ThemePalette } from "./palette";

const landFeature = feature(countries110m as any, (countries110m as any).objects.land);

export function buildOperationsBasemapStyle(themePalette: ThemePalette) {
  const sources: Record<string, GeoJSONSourceSpecification | RasterSourceSpecification> = {
    "world-land": {
      type: "geojson",
      data: landFeature
    },
    "gray-canvas-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Esri, HERE, Garmin, FAO, NOAA, USGS"
    },
    "gray-canvas-reference": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Esri, HERE, Garmin"
    }
  };

  const layers: Array<
    BackgroundLayerSpecification | FillLayerSpecification | RasterLayerSpecification
  > = [
    {
      id: "ops-background",
      type: "background",
      paint: {
        "background-color": themePalette.surfaceCanvas
      }
    },
    {
      id: "gray-canvas-base",
      type: "raster",
      source: "gray-canvas-base",
      paint: {
        "raster-opacity": 1,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gray-canvas-reference",
      type: "raster",
      source: "gray-canvas-reference",
      minzoom: 6.6,
      paint: {
        "raster-opacity": 0.48,
        "raster-fade-duration": 0
      }
    },
    {
      id: "world-land-fill",
      type: "fill",
      source: "world-land",
      paint: {
        "fill-color": "rgba(232,236,240,0.12)",
        "fill-opacity": 1
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
