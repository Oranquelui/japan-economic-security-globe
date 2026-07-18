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

export function buildOperationsBasemapStyle(
  themePalette: ThemePalette,
  options: Readonly<{ acceptance?: boolean }> = {}
) {
  if (options.acceptance) {
    const acceptanceStyle: StyleSpecification = {
      version: 8,
      sources: {
        "world-land": {
          type: "geojson",
          data: landFeature
        }
      },
      layers: [
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
            "fill-color": "rgba(92, 128, 148, 0.12)",
            "fill-opacity": 1
          }
        },
        {
          id: "gray-canvas-reference",
          type: "fill",
          source: "world-land",
          paint: {
            "fill-opacity": 0
          }
        }
      ]
    };

    return acceptanceStyle;
  }

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
        "raster-opacity": 0.34,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.82,
        "raster-saturation": -0.28,
        "raster-fade-duration": 0
      }
    },
    {
      id: "terrain-contours",
      type: "raster",
      source: "terrain-contours",
      minzoom: 2.4,
      paint: {
        "raster-opacity": 0.22,
        "raster-brightness-min": 0.1,
        "raster-brightness-max": 0.78,
        "raster-saturation": -0.35,
        "raster-fade-duration": 0
      }
    },
    {
      id: "gray-canvas-base",
      type: "raster",
      source: "gray-canvas-base",
      paint: {
        "raster-opacity": 0.28,
        "raster-brightness-min": 0.05,
        "raster-brightness-max": 0.72,
        "raster-saturation": -0.45,
        "raster-fade-duration": 0
      }
    },
    {
      id: "world-land-fill",
      type: "fill",
      source: "world-land",
      paint: {
        "fill-color": "rgba(92, 128, 148, 0.12)",
        "fill-opacity": 1
      }
    },
    {
      id: "gray-canvas-reference",
      type: "raster",
      source: "gray-canvas-reference",
      minzoom: 6.6,
      paint: {
        "raster-opacity": 0.28,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.8,
        "raster-saturation": -0.3,
        "raster-fade-duration": 0
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
