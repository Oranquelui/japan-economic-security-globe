import type {
  BackgroundLayerSpecification,
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  RasterLayerSpecification,
  RasterSourceSpecification,
  StyleSpecification
} from "maplibre-gl";
import { feature, mesh } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";

import type { ThemePalette } from "./palette";

const landFeature = feature(countries110m as any, (countries110m as any).objects.land);
const borderMesh = mesh(countries110m as any, (countries110m as any).objects.countries, (a: unknown, b: unknown) => a !== b);

export function buildOperationsBasemapStyle(themePalette: ThemePalette) {
  const sources: Record<string, GeoJSONSourceSpecification | RasterSourceSpecification> = {
    "world-land": {
      type: "geojson",
      data: landFeature
    },
    "world-borders": {
      type: "geojson",
      data: borderMesh
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
    },
    "gsi-pale": {
      type: "raster",
      tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "地理院タイル"
    }
  };

  const layers: Array<
    BackgroundLayerSpecification | FillLayerSpecification | LineLayerSpecification | RasterLayerSpecification
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
        "raster-opacity": 0.88,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gray-canvas-reference",
      type: "raster",
      source: "gray-canvas-reference",
      paint: {
        "raster-opacity": 0.92,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gsi-pale",
      type: "raster",
      source: "gsi-pale",
      minzoom: 3.8,
      paint: {
        "raster-opacity": 0.95,
        "raster-fade-duration": 0
      }
    },
    {
      id: "world-land-fill",
      type: "fill",
      source: "world-land",
      paint: {
        "fill-color": "rgba(228,233,238,0.16)",
        "fill-opacity": 1
      }
    },
    {
      id: "world-borders-line",
      type: "line",
      source: "world-borders",
      paint: {
        "line-color": "rgba(104, 115, 125, 0.48)",
        "line-width": 0.9,
        "line-opacity": 0.92
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
