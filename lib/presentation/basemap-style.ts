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
    "terrain-shaded-relief": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Esri, USGS, NOAA"
    },
    "terrain-contours": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Esri, USGS, NOAA"
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
      id: "terrain-shaded-relief",
      type: "raster",
      source: "terrain-shaded-relief",
      paint: {
        "raster-opacity": 0.46,
        "raster-fade-duration": 0
      }
    },
    {
      id: "terrain-contours",
      type: "raster",
      source: "terrain-contours",
      minzoom: 2.4,
      paint: {
        "raster-opacity": 0.34,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gray-canvas-base",
      type: "raster",
      source: "gray-canvas-base",
      paint: {
        "raster-opacity": 0.58,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gray-canvas-reference",
      type: "raster",
      source: "gray-canvas-reference",
      minzoom: 6.6,
      paint: {
        "raster-opacity": 0.42,
        "raster-fade-duration": 0
      }
    },
    {
      id: "world-land-fill",
      type: "fill",
      source: "world-land",
      paint: {
        "fill-color": "rgba(218,229,224,0.16)",
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
