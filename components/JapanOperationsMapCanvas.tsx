"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import type { GeoJSONSourceSpecification } from "maplibre-gl";

import importedPrefectureLabelLayout from "../data/geo/japan-prefecture-labels.json";
import { buildPrefectureMetricFeatureCollection } from "../lib/geo/prefecture-map";
import {
  PREFECTURE_LABEL_FONT_SIZE,
  buildPrefectureLabelFeatureCollections,
  inspectProjectedPrefectureLabelLayout,
  type PrefectureLabelLayoutEntry
} from "../lib/geo/prefecture-label-layout";
import type { OperationMapMode } from "../lib/presentation/operations";
import type {
  JapanMapCanvasModel,
  JapanMapCorridor,
  JapanMapPoint,
  JapanMapRegion,
  JapanMapRoute,
  PrefectureBoundaryMapRegion,
  RepresentativeRadiusMapRegion
} from "../lib/presentation/map-canvas";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { buildMaritimeRouteCoordinates, densifyGeodesicPolyline, type LonLat } from "../lib/presentation/route-geometry";
import type { MapHoverViewModel, MapPopupAnchor } from "../types/presentation";
import { buildOperationsBasemapStyle } from "../lib/presentation/basemap-style";

interface JapanOperationsMapCanvasProps {
  activeId: string;
  command?: {
    nonce: number;
    type: "recenter" | "zoomIn" | "zoomOut";
  };
  focusTargetId: string | null;
  mapMode: OperationMapMode;
  model: JapanMapCanvasModel;
  onHover?: (hover: MapHoverViewModel | null) => void;
  onSelect: (id: string, anchor?: MapPopupAnchor) => void;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

const INITIAL_CENTER: [number, number] = [138.45, 36.25];
const INITIAL_ZOOM = 5.3;
const GLOBAL_CONTEXT_MAX_ZOOM = 3.6;
const DOMESTIC_CONTEXT_MIN_ZOOM = 3.2;
const PREFECTURE_POLYGON_FADE_START_ZOOM = 6.5;
const PREFECTURE_POLYGON_MAX_ZOOM = 9;
const PREFECTURE_LABEL_MAX_ZOOM = 9;
const PREFECTURE_SELECTED_LABEL_MAX_ZOOM = 10.5;
const GRAY_CANVAS_REFERENCE_LAYER_ID = "gray-canvas-reference";
const XL_DESKTOP_MEDIA_QUERY = "(min-width: 1280px)";
const MAP_ACCEPTANCE_FIXTURES_ENABLED = process.env.NODE_ENV !== "production"
  && process.env.NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES === "1";
const PREFECTURE_LABEL_LAYOUT = importedPrefectureLabelLayout as unknown as readonly PrefectureLabelLayoutEntry[];
const JA_NUMBER_FORMATTER = new Intl.NumberFormat("ja-JP");
const INTERACTIVE_SEMANTIC_LAYER_IDS = [
  "jp-point-circle",
  "jp-route-line",
  "jp-prefecture-fill",
  "jp-region-fill",
  "global-point-circle",
  "global-route-glow",
  "global-route-line",
  "live-logistics-route-glow",
  "live-logistics-route-pulse",
  "live-logistics-route-label",
  "logistics-impact-region-fill",
  "logistics-impact-corridor-fill",
  "logistics-impact-corridor-outline",
  "logistics-impact-corridor-label",
  "live-vessel-halo",
  "live-vessel-marker",
  "live-vessel-label"
];

export function JapanOperationsMapCanvas({
  activeId,
  command,
  focusTargetId,
  mapMode,
  model,
  onHover,
  onSelect,
  statusPalette,
  themePalette
}: JapanOperationsMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const prefectureSourceSignatureRef = useRef<string | null>(null);
  const latestModelRef = useRef(model);
  const latestActiveIdRef = useRef(activeId);
  const latestMapModeRef = useRef(mapMode);
  const zoomRef = useRef(INITIAL_ZOOM);
  const scanPhaseRef = useRef(0);
  const scanRafRef = useRef<number | null>(null);
  const handleHover = useEffectEvent((hover: MapHoverViewModel | null) => onHover?.(hover));
  const handleSelect = useEffectEvent(onSelect);
  latestModelRef.current = model;
  latestActiveIdRef.current = activeId;
  latestMapModeRef.current = mapMode;

  useEffect(() => {
    let disposed = false;
    let installedDiagnostics: PrefectureMapDiagnostics | null = null;
    let diagnosticsContainer: PrefectureMapDiagnosticsContainer | null = null;
    const interactionSubscriptions: Array<{ unsubscribe: () => void }> = [];
    const desktopLabelMedia = typeof window.matchMedia === "function"
      ? window.matchMedia(XL_DESKTOP_MEDIA_QUERY)
      : null;
    const handleClusterMouseEnter = () => {
      const map = mapRef.current;
      if (map) {
        map.getCanvas().style.cursor = "pointer";
      }
    };
    const handleClusterMouseLeave = () => {
      const map = mapRef.current;
      if (map) {
        map.getCanvas().style.cursor = "";
      }
    };

    async function mount() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (disposed || !containerRef.current) {
        return;
      }

      const map = new maplibre.Map({
        container: containerRef.current,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        maxZoom: 10.5,
        minZoom: 1.4,
        attributionControl: false,
        style: buildOperationsBasemapStyle(themePalette, {
          acceptance: MAP_ACCEPTANCE_FIXTURES_ENABLED
        }),
        ...(MAP_ACCEPTANCE_FIXTURES_ENABLED
          ? { localIdeographFontFamily: "Hiragino Kaku Gothic ProN, Yu Gothic, sans-serif" }
          : {})
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-left");

      mapRef.current = map;

      map.on("zoomend", () => {
        zoomRef.current = map.getZoom();
      });

      map.on("load", () => {
        map.addSource("jp-points", {
          type: "geojson",
          data: pointsToFeatureCollection(model.points, activeId)
        });

        map.addSource("jp-points-cluster", {
          type: "geojson",
          data: pointsToFeatureCollection(model.points, activeId),
          cluster: true,
          clusterRadius: 40
        });

        map.addSource("jp-routes", {
          type: "geojson",
          data: routesToFeatureCollection(model.routes, model.points, activeId)
        });

        map.addSource("jp-regions", {
          type: "geojson",
          data: representativeRadiusRegionsToFeatureCollection(model.regions, activeId)
        });

        const prefectureSourceSignature = getPrefectureSourceSignature(model.regions, activeId);
        map.addSource("jp-prefectures", {
          type: "geojson",
          data: prefectureRegionsToFeatureCollection(model.regions, activeId),
          attribution: "境界: Made with Natural Earth（加工）"
        });
        prefectureSourceSignatureRef.current = prefectureSourceSignature;

        const prefectureLabels = buildPrefectureLabelSources(model.regions, activeId);
        map.addSource("jp-prefecture-labels", {
          type: "geojson",
          data: prefectureLabels.labelPoints
        });
        map.addSource("jp-prefecture-leaders", {
          type: "geojson",
          data: prefectureLabels.leaderLines
        });

        map.addSource("global-points", {
          type: "geojson",
          data: pointsToFeatureCollection(model.globalPoints, activeId)
        });

        map.addSource("global-routes", {
          type: "geojson",
          data: routesToFeatureCollection(model.globalRoutes, model.globalPoints, activeId)
        });

        map.addSource("live-logistics-routes", {
          type: "geojson",
          data: routesToFeatureCollection(model.liveRoutes ?? [], model.livePoints ?? [], activeId)
        });

        map.addSource("logistics-impact-regions", {
          type: "geojson",
          data: representativeRadiusRegionsToFeatureCollection(model.logisticsImpactRegions ?? [], activeId)
        });

        map.addSource("logistics-impact-routes", {
          type: "geojson",
          data: routesToFeatureCollection(model.logisticsImpactRoutes ?? [], model.livePoints ?? [], activeId)
        });

        map.addSource("logistics-impact-corridors", {
          type: "geojson",
          data: corridorsToFeatureCollection(model.logisticsImpactCorridors ?? [], activeId)
        });

        map.addSource("live-vessels", {
          type: "geojson",
          data: pointsToFeatureCollection(model.liveVessels ?? [], activeId)
        });

        map.addLayer({
          id: "jp-prefecture-fill",
          type: "fill",
          source: "jp-prefectures",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_POLYGON_MAX_ZOOM,
          paint: {
            ...getPrefectureFillPaint(themePalette, statusPalette)
          }
        }, GRAY_CANVAS_REFERENCE_LAYER_ID);

        map.addLayer({
          id: "jp-prefecture-outline",
          type: "line",
          source: "jp-prefectures",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_POLYGON_MAX_ZOOM,
          paint: {
            ...getPrefectureOutlinePaint(themePalette)
          }
        }, GRAY_CANVAS_REFERENCE_LAYER_ID);

        map.addLayer({
          id: "jp-prefecture-selected-outline",
          type: "line",
          source: "jp-prefectures",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_POLYGON_MAX_ZOOM,
          filter: ["==", ["get", "selected"], true],
          paint: {
            ...getPrefectureSelectedOutlinePaint(statusPalette)
          }
        });

        map.addLayer({
          id: "jp-prefecture-leader-line",
          type: "line",
          source: "jp-prefecture-leaders",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_LABEL_MAX_ZOOM,
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getPrefectureLeaderLinePaint(themePalette, statusPalette)
          }
        }, "jp-prefecture-selected-outline");

        map.addLayer({
          id: "jp-prefecture-label",
          type: "symbol",
          source: "jp-prefecture-labels",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_LABEL_MAX_ZOOM,
          layout: {
            "text-field": ["get", "label"],
            "text-size": PREFECTURE_LABEL_FONT_SIZE,
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            ...getPrefectureLabelPaint(themePalette)
          }
        }, "jp-prefecture-selected-outline");

        map.addLayer({
          id: "jp-prefecture-selected-label",
          type: "symbol",
          source: "jp-prefecture-labels",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          maxzoom: PREFECTURE_SELECTED_LABEL_MAX_ZOOM,
          filter: ["==", ["get", "selected"], true],
          layout: {
            "text-field": ["get", "label"],
            "text-size": PREFECTURE_LABEL_FONT_SIZE + 1,
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            ...getPrefectureSelectedLabelPaint(statusPalette)
          }
        });

        map.addLayer({
          id: "global-route-glow",
          type: "line",
          source: "global-routes",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getGlobalRouteGlowPaint(themePalette, statusPalette, mapMode)
          }
        });

        map.addLayer({
          id: "global-route-line",
          type: "line",
          source: "global-routes",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getGlobalRoutePaint(themePalette, statusPalette, mapMode)
          }
        });

        map.addLayer({
          id: "global-route-highlight",
          type: "line",
          source: "global-routes",
          filter: ["boolean", ["get", "selected"], false],
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getGlobalRouteHighlightPaint(statusPalette, mapMode)
          }
        });

        map.addLayer({
          id: "global-route-direction",
          type: "symbol",
          source: "global-routes",
          layout: {
            "symbol-placement": "line",
            "text-field": "›",
            "text-size": 11,
            "symbol-spacing": 96,
            "text-keep-upright": false,
            "text-allow-overlap": true
          },
          paint: {
            "text-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              statusPalette.selected,
              themePalette.accent
            ],
            "text-halo-color": "rgba(6, 12, 20, 0.85)",
            "text-halo-width": 1.1,
            "text-opacity": mapMode === "route" ? 0.92 : 0.78
          }
        });

        map.addLayer({
          id: "live-logistics-route-glow",
          type: "line",
          source: "live-logistics-routes",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getLiveLogisticsRouteGlowPaint(statusPalette, mapMode, hasFilledLogisticsCorridors(model))
          }
        });

        map.addLayer({
          id: "live-logistics-route-pulse",
          type: "line",
          source: "live-logistics-routes",
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          paint: {
            ...getLiveLogisticsRoutePaint(statusPalette, mapMode, hasFilledLogisticsCorridors(model))
          }
        });

        map.addLayer({
          id: "live-logistics-route-label",
          type: "symbol",
          source: "live-logistics-routes",
          layout: {
            "symbol-placement": "line",
            "text-field": "SCAN",
            "text-size": 9,
            "symbol-spacing": 220,
            "text-letter-spacing": 0.18,
            "text-keep-upright": true,
            "text-allow-overlap": false
          },
          paint: {
            "text-color": statusPalette.monitoring,
            "text-halo-color": "rgba(6, 12, 20, 0.9)",
            "text-halo-width": 1.4,
            "text-opacity": hasFilledLogisticsCorridors(model) ? 0 : mapMode === "route" ? 0.82 : 0.62
          }
        });

        map.addLayer({
          id: "logistics-impact-region-fill",
          type: "fill",
          source: "logistics-impact-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "fill-color": statusPalette.watch,
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              35,
              0.08,
              100,
              0.22
            ]
          }
        });

        map.addLayer({
          id: "logistics-impact-region-outline",
          type: "line",
          source: "logistics-impact-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "line-color": statusPalette.watch,
            "line-opacity": 0.45,
            "line-width": 1.1
          }
        });

        map.addLayer({
          id: "logistics-impact-route-line",
          type: "line",
          source: "logistics-impact-routes",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "line-color": statusPalette.selected,
            "line-opacity": mapMode === "route" ? 0.18 : 0.1,
            "line-width": mapMode === "route" ? 1.6 : 1
          }
        });

        map.addLayer({
          id: "logistics-impact-corridor-fill",
          type: "fill",
          source: "logistics-impact-corridors",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "fill-color": getLogisticsCorridorFillColor(statusPalette),
            "fill-opacity": [
              "case",
              ["boolean", ["get", "selected"], false],
              0.42,
              0.27
            ]
          }
        });

        map.addLayer({
          id: "logistics-impact-corridor-outline",
          type: "line",
          source: "logistics-impact-corridors",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "line-color": getLogisticsCorridorOutlineColor(statusPalette),
            "line-opacity": [
              "case",
              ["boolean", ["get", "selected"], false],
              0.78,
              0.45
            ],
            "line-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              1.6,
              0.9
            ]
          }
        });

        map.addLayer({
          id: "logistics-impact-corridor-label",
          type: "symbol",
          source: "logistics-impact-corridors",
          minzoom: 5,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-anchor": "center"
          },
          paint: {
            "text-color": "#2d3a42",
            "text-halo-color": "rgba(250,252,255,0.92)",
            "text-halo-width": 1.3,
            "text-opacity": mapMode === "route" ? 0.78 : 0.52
          }
        });

        map.addLayer({
          id: "live-vessel-halo",
          type: "circle",
          source: "live-vessels",
          paint: {
            "circle-color": statusPalette.selected,
            "circle-opacity": 0.18,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              12,
              6,
              15,
              10,
              18
            ],
            "circle-stroke-color": "rgba(255,255,255,0.72)",
            "circle-stroke-opacity": 0.4,
            "circle-stroke-width": 1
          }
        });

        map.addLayer({
          id: "live-vessel-marker",
          type: "circle",
          source: "live-vessels",
          paint: {
            "circle-color": statusPalette.selected,
            "circle-opacity": 0.96,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              5.8,
              6,
              6.8,
              10,
              8
            ],
            "circle-stroke-color": "rgba(21, 30, 36, 0.92)",
            "circle-stroke-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              2.2,
              1.2
            ]
          }
        });

        map.addLayer({
          id: "live-vessel-label",
          type: "symbol",
          source: "live-vessels",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 11,
            "text-offset": [0.9, 0.1],
            "text-anchor": "left"
          },
          paint: {
            "text-color": "#e8f4fb",
            "text-halo-color": "rgba(6, 12, 20, 0.92)",
            "text-halo-width": 1.5,
            "text-opacity": mapMode === "route" ? 0.95 : 0.8
          }
        });

        map.addLayer({
          id: "global-point-circle",
          type: "circle",
          source: "global-points",
          paint: {
            "circle-color": [
              "match",
              ["get", "tone"],
              "critical",
              statusPalette.high,
              "watch",
              statusPalette.watch,
              statusPalette.normal
            ],
            "circle-stroke-color": "#27313a",
            "circle-stroke-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              1.8,
              0.7
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              ["case", ["boolean", ["get", "selected"], false], 7.5, 5.5],
              6,
              ["case", ["boolean", ["get", "selected"], false], 6.5, 4.8],
              10,
              ["case", ["boolean", ["get", "selected"], false], 5.4, 4.1]
            ],
            "circle-opacity": 0.92
          }
        });

        map.addLayer({
          id: "global-point-label",
          type: "symbol",
          source: "global-points",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 11,
            "text-offset": [0.9, 0.1],
            "text-anchor": "left"
          },
          paint: {
            "text-color": "#2a3440",
            "text-halo-color": "rgba(250,252,255,0.96)",
            "text-halo-width": 1.4
          }
        });

        map.addLayer({
          id: "jp-region-fill",
          type: "fill",
          source: "jp-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            ...getRegionFillPaint(themePalette)
          }
        });

        map.addLayer({
          id: "jp-region-outline",
          type: "line",
          source: "jp-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            ...getRegionOutlinePaint(themePalette, statusPalette)
          }
        });

        map.addLayer({
          id: "jp-route-line",
          type: "line",
          source: "jp-routes",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            ...getDomesticRoutePaint(themePalette, statusPalette, mapMode)
          }
        });

        map.addLayer({
          id: "jp-route-direction",
          type: "symbol",
          source: "jp-routes",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          layout: {
            "symbol-placement": "line",
            "text-field": "▶",
            "text-size": 11,
            "symbol-spacing": 110,
            "text-keep-upright": false
          },
          paint: {
            "text-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              statusPalette.selected,
              themePalette.accent
            ],
            "text-opacity": 0.82
          }
        });

        map.addLayer({
          id: "jp-point-circle",
          type: "circle",
          source: "jp-points",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "circle-color": [
              "match",
              ["get", "tone"],
              "critical",
              statusPalette.high,
              "watch",
              statusPalette.watch,
              statusPalette.normal
            ],
            "circle-stroke-color": "#27313a",
            "circle-stroke-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              2,
              0.8
            ],
            "circle-radius": [
              "case",
              ["boolean", ["get", "selected"], false],
              8,
              5
            ],
            "circle-opacity": 0.9
          }
        });

        map.addLayer({
          id: "jp-point-label",
          type: "symbol",
          source: "jp-points",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 13,
            "text-offset": [0.9, 0.1],
            "text-anchor": "left"
          },
          paint: {
            "text-color": "#23303b",
            "text-halo-color": "rgba(250,252,255,0.98)",
            "text-halo-width": 1.7
          }
        });

        map.addLayer({
          id: "jp-cluster-circle",
          type: "circle",
          source: "jp-points-cluster",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              statusPalette.monitoring,
              2,
              statusPalette.watch,
              4,
              statusPalette.high
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              2,
              24,
              4,
              32
            ],
            "circle-opacity": 0.9
          }
        });

        map.addLayer({
          id: "jp-cluster-count",
          type: "symbol",
          source: "jp-points-cluster",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 12
          },
          paint: {
            "text-color": "#f5f7fa"
          }
        });

        interactionSubscriptions.push(
          map.on("mouseenter", INTERACTIVE_SEMANTIC_LAYER_IDS, () => {
            map.getCanvas().style.cursor = "pointer";
          }),
          map.on("mousemove", INTERACTIVE_SEMANTIC_LAYER_IDS, (event: any) => {
            hoverFeature(event, handleHover);
          }),
          map.on("mouseleave", INTERACTIVE_SEMANTIC_LAYER_IDS, () => {
            map.getCanvas().style.cursor = "";
            handleHover(null);
          }),
          map.on("click", INTERACTIVE_SEMANTIC_LAYER_IDS, (event: any) => {
            selectFeatureId(event, handleSelect, map);
          })
        );

        interactionSubscriptions.push(map.on("click", "jp-cluster-circle", async (event: any) => {
          const feature = event.features?.[0];
          const source = map.getSource("jp-points-cluster") as
            | {
                getClusterExpansionZoom: (clusterId: number) => Promise<number>;
              }
            | undefined;

          if (!feature || !source) {
            return;
          }

          const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id);
          map.easeTo({
            center: feature.geometry.coordinates,
            zoom
          });
        }));
        map.on("mouseenter", "jp-cluster-circle", handleClusterMouseEnter);
        map.on("mouseleave", "jp-cluster-circle", handleClusterMouseLeave);

        const handleDesktopLabelViewportChange = () => {
          applyModeVisibility(map, latestMapModeRef.current, desktopLabelMedia?.matches ?? false);
        };
        desktopLabelMedia?.addEventListener("change", handleDesktopLabelViewportChange);
        interactionSubscriptions.push({
          unsubscribe: () => desktopLabelMedia?.removeEventListener("change", handleDesktopLabelViewportChange)
        });

        applyModeVisibility(map, mapMode, desktopLabelMedia?.matches ?? false);
        installedDiagnostics = installPrefectureMapDiagnostics(
          containerRef.current,
          map,
          latestModelRef,
          latestActiveIdRef
        );
        diagnosticsContainer = containerRef.current as PrefectureMapDiagnosticsContainer | null;
        startRouteScanAnimation(map, scanPhaseRef, scanRafRef);

        if (focusTargetId) {
          focusMapOnSelection(map, model, focusTargetId, mapMode, zoomRef.current);
        }
      });
    }

    mount();

    return () => {
      disposed = true;
      const map = mapRef.current;
      if (map) {
        map.off("mouseenter", "jp-cluster-circle", handleClusterMouseEnter);
        map.off("mouseleave", "jp-cluster-circle", handleClusterMouseLeave);
      }

      for (const subscription of interactionSubscriptions) {
        subscription.unsubscribe();
      }
      interactionSubscriptions.length = 0;

      if (scanRafRef.current !== null) {
        cancelAnimationFrame(scanRafRef.current);
        scanRafRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      if (diagnosticsContainer?.__prefectureMapDiagnostics === installedDiagnostics) {
        delete diagnosticsContainer.__prefectureMapDiagnostics;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty("ops-background", "background-color", themePalette.surfaceCanvas);
    applyPaintObject(map, "global-route-glow", getGlobalRouteGlowPaint(themePalette, statusPalette, mapMode));
    applyPaintObject(map, "global-route-line", getGlobalRoutePaint(themePalette, statusPalette, mapMode));
    applyPaintObject(map, "global-route-highlight", getGlobalRouteHighlightPaint(statusPalette, mapMode));
    map.setPaintProperty("global-route-direction", "text-color", [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ]);
    map.setPaintProperty("global-route-direction", "text-opacity", mapMode === "route" ? 0.92 : 0.78);
    applyPaintObject(
      map,
      "live-logistics-route-glow",
      getLiveLogisticsRouteGlowPaint(statusPalette, mapMode, hasFilledLogisticsCorridors(model))
    );
    applyPaintObject(
      map,
      "live-logistics-route-pulse",
      getLiveLogisticsRoutePaint(statusPalette, mapMode, hasFilledLogisticsCorridors(model))
    );
    map.setPaintProperty("live-logistics-route-label", "text-color", statusPalette.monitoring);
    map.setPaintProperty(
      "live-logistics-route-label",
      "text-opacity",
      hasFilledLogisticsCorridors(model) ? 0 : mapMode === "route" ? 0.82 : 0.62
    );
  map.setPaintProperty("logistics-impact-route-line", "line-color", statusPalette.selected);
  map.setPaintProperty("logistics-impact-route-line", "line-opacity", mapMode === "route" ? 0.18 : 0.1);
  map.setPaintProperty("logistics-impact-route-line", "line-width", mapMode === "route" ? 1.6 : 1);
  map.setPaintProperty("logistics-impact-corridor-fill", "fill-color", getLogisticsCorridorFillColor(statusPalette));
  map.setPaintProperty("logistics-impact-corridor-outline", "line-color", getLogisticsCorridorOutlineColor(statusPalette));
  map.setPaintProperty("logistics-impact-corridor-label", "text-opacity", mapMode === "route" ? 0.78 : 0.52);
  map.setPaintProperty("live-vessel-halo", "circle-color", statusPalette.selected);
    map.setPaintProperty("live-vessel-marker", "circle-color", statusPalette.selected);
    map.setPaintProperty("live-vessel-label", "text-opacity", mapMode === "route" ? 0.95 : 0.76);
    map.setPaintProperty("global-point-circle", "circle-color", [
      "match",
      ["get", "tone"],
      "critical",
      statusPalette.high,
      "watch",
      statusPalette.watch,
      statusPalette.normal
    ]);
    applyPaintObject(map, "jp-prefecture-fill", getPrefectureFillPaint(themePalette, statusPalette));
    applyPaintObject(map, "jp-prefecture-outline", getPrefectureOutlinePaint(themePalette));
    applyPaintObject(map, "jp-prefecture-selected-outline", getPrefectureSelectedOutlinePaint(statusPalette));
    applyPaintObject(map, "jp-prefecture-leader-line", getPrefectureLeaderLinePaint(themePalette, statusPalette));
    applyPaintObject(map, "jp-prefecture-label", getPrefectureLabelPaint(themePalette));
    applyPaintObject(map, "jp-prefecture-selected-label", getPrefectureSelectedLabelPaint(statusPalette));
    applyPaintObject(map, "jp-region-fill", getRegionFillPaint(themePalette));
    applyPaintObject(map, "jp-region-outline", getRegionOutlinePaint(themePalette, statusPalette));
    map.setPaintProperty("jp-route-line", "line-color", [
      ...(getDomesticRoutePaint(themePalette, statusPalette, mapMode)["line-color"] as unknown[])
    ]);
    map.setPaintProperty("jp-route-line", "line-width", getDomesticRoutePaint(themePalette, statusPalette, mapMode)["line-width"]);
    map.setPaintProperty("jp-route-line", "line-opacity", getDomesticRoutePaint(themePalette, statusPalette, mapMode)["line-opacity"]);
    map.setPaintProperty("jp-route-direction", "text-color", [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ]);
    map.setPaintProperty("jp-route-direction", "text-opacity", mapMode === "route" ? 0.9 : 0.82);
    map.setPaintProperty("jp-point-circle", "circle-color", [
      "match",
      ["get", "tone"],
      "critical",
      statusPalette.high,
      "watch",
      statusPalette.watch,
      statusPalette.normal
    ]);
    map.setPaintProperty("jp-cluster-circle", "circle-color", [
      "step",
      ["get", "point_count"],
      statusPalette.monitoring,
      2,
      statusPalette.watch,
      4,
      statusPalette.high
    ]);

    updateSource(map, "global-points", pointsToFeatureCollection(model.globalPoints, activeId));
    updateSource(map, "global-routes", routesToFeatureCollection(model.globalRoutes, model.globalPoints, activeId));
    updateSource(map, "live-logistics-routes", routesToFeatureCollection(model.liveRoutes ?? [], model.livePoints ?? [], activeId));
    updateSource(map, "logistics-impact-regions", representativeRadiusRegionsToFeatureCollection(model.logisticsImpactRegions ?? [], activeId));
    updateSource(map, "logistics-impact-routes", routesToFeatureCollection(model.logisticsImpactRoutes ?? [], model.livePoints ?? [], activeId));
    updateSource(map, "logistics-impact-corridors", corridorsToFeatureCollection(model.logisticsImpactCorridors ?? [], activeId));
    updateSource(map, "live-vessels", pointsToFeatureCollection(model.liveVessels ?? [], activeId));
    updateSource(map, "jp-points", pointsToFeatureCollection(model.points, activeId));
    updateSource(map, "jp-points-cluster", pointsToFeatureCollection(model.points, activeId));
    updateSource(map, "jp-routes", routesToFeatureCollection(model.routes, model.points, activeId));
    const prefectureSourceSignature = getPrefectureSourceSignature(model.regions, activeId);
    if (prefectureSourceSignature !== prefectureSourceSignatureRef.current) {
      const prefectureSource = map.getSource("jp-prefectures");
      if (prefectureSource && "setData" in prefectureSource) {
        prefectureSource.setData(prefectureRegionsToFeatureCollection(model.regions, activeId));
        prefectureSourceSignatureRef.current = prefectureSourceSignature;
      }
    }
    const prefectureLabels = buildPrefectureLabelSources(model.regions, activeId);
    updateSource(map, "jp-prefecture-labels", prefectureLabels.labelPoints);
    updateSource(map, "jp-prefecture-leaders", prefectureLabels.leaderLines);
    updateSource(map, "jp-regions", representativeRadiusRegionsToFeatureCollection(model.regions, activeId));
    applyModeVisibility(map, mapMode, isXlDesktopViewport());
  }, [activeId, mapMode, model, statusPalette, themePalette]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !focusTargetId) {
      return;
    }

    focusMapOnSelection(map, model, focusTargetId, mapMode, zoomRef.current);
  }, [focusTargetId, mapMode, model]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !command) {
      return;
    }

    if (command.type === "zoomIn") {
      map.zoomIn({ duration: 300 });
      return;
    }

    if (command.type === "zoomOut") {
      map.zoomOut({ duration: 300 });
      return;
    }

    map.easeTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      duration: 600
    });
  }, [command]);

  return <div ref={containerRef} data-testid="jp-operations-map-canvas" className="absolute inset-0" />;
}

function applyModeVisibility(map: any, mapMode: OperationMapMode, showPrefectureLabels: boolean) {
  const visibility = (show: boolean) => (show ? "visible" : "none");
  const { showClusters, showPoints, showRegions, showRoutes } = getModeVisibilityState(mapMode);

  map.setLayoutProperty("global-point-circle", "visibility", visibility(showPoints));
  map.setLayoutProperty("global-point-label", "visibility", visibility(showPoints));
  map.setLayoutProperty("global-route-glow", "visibility", visibility(showRoutes));
  map.setLayoutProperty("global-route-line", "visibility", visibility(showRoutes));
  map.setLayoutProperty("global-route-highlight", "visibility", visibility(showRoutes));
  map.setLayoutProperty("global-route-direction", "visibility", visibility(showRoutes));
  map.setLayoutProperty("live-logistics-route-glow", "visibility", visibility(showRoutes));
  map.setLayoutProperty("live-logistics-route-pulse", "visibility", visibility(showRoutes));
  map.setLayoutProperty("live-logistics-route-label", "visibility", visibility(showRoutes));
  map.setLayoutProperty("logistics-impact-route-line", "visibility", visibility(showRoutes));
  map.setLayoutProperty("logistics-impact-corridor-fill", "visibility", visibility(showRoutes || showRegions));
  map.setLayoutProperty("logistics-impact-corridor-outline", "visibility", visibility(showRoutes || showRegions));
  map.setLayoutProperty("logistics-impact-corridor-label", "visibility", visibility(showRoutes));
  map.setLayoutProperty("logistics-impact-region-fill", "visibility", visibility(showRoutes || showRegions));
  map.setLayoutProperty("logistics-impact-region-outline", "visibility", visibility(showRoutes || showRegions));
  map.setLayoutProperty("live-vessel-halo", "visibility", visibility(showRoutes));
  map.setLayoutProperty("live-vessel-marker", "visibility", visibility(showRoutes));
  map.setLayoutProperty("live-vessel-label", "visibility", visibility(showRoutes));

  map.setLayoutProperty("jp-point-circle", "visibility", visibility(showPoints));
  map.setLayoutProperty("jp-point-label", "visibility", visibility(showPoints));
  map.setLayoutProperty("jp-route-line", "visibility", visibility(showRoutes));
  map.setLayoutProperty("jp-route-direction", "visibility", visibility(showRoutes));
  map.setLayoutProperty("jp-prefecture-fill", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-prefecture-outline", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-prefecture-selected-outline", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-prefecture-leader-line", "visibility", visibility(showRegions && showPrefectureLabels));
  map.setLayoutProperty("jp-prefecture-label", "visibility", visibility(showRegions && showPrefectureLabels));
  map.setLayoutProperty("jp-prefecture-selected-label", "visibility", visibility(showRegions && showPrefectureLabels));
  map.setLayoutProperty("jp-region-fill", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-region-outline", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-cluster-circle", "visibility", visibility(showClusters));
  map.setLayoutProperty("jp-cluster-count", "visibility", visibility(showClusters));
}

type DiagnosticsRect = Readonly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;

type PrefectureMapDiagnostics = Readonly<{
  read: (exclusions?: readonly DiagnosticsRect[]) => {
    collisionReport: ReturnType<typeof inspectProjectedPrefectureLabelLayout>;
    renderedFeatures: Array<{
      entityId: string;
      layers: string[];
      value: number | null;
    }>;
    renderedLabelIds: string[];
    renderedPolygonIds: string[];
    zoom: number;
  };
  setPrefectureValueNull?: (entityId: string) => Promise<void>;
}>;

type PrefectureMapDiagnosticsContainer = HTMLDivElement & {
  __prefectureMapDiagnostics?: PrefectureMapDiagnostics;
};

function installPrefectureMapDiagnostics(
  container: HTMLDivElement | null,
  map: any,
  latestModelRef: { current: JapanMapCanvasModel },
  latestActiveIdRef: { current: string }
): PrefectureMapDiagnostics | null {
  if (!container) {
    return null;
  }

  const read = (absoluteExclusions: readonly DiagnosticsRect[] = []) => {
    const rect = container.getBoundingClientRect();
    const canvas = map.getCanvas();
    const viewport = {
      width: getCanvasDimension(canvas?.clientWidth, canvas?.width, rect.width || 1024),
      height: getCanvasDimension(canvas?.clientHeight, canvas?.height, rect.height || 720)
    };
    const center = map.getCenter();
    const localExclusions = absoluteExclusions.map((exclusion) => ({
      left: exclusion.left - rect.left,
      right: exclusion.right - rect.left,
      top: exclusion.top - rect.top,
      bottom: exclusion.bottom - rect.top
    }));
    const projected = inspectProjectedPrefectureLabelLayout(PREFECTURE_LABEL_LAYOUT, {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      viewport
    }, localExclusions);
    const collisionReport = {
      ...projected,
      boxes: projected.boxes.map((box) => ({
        ...box,
        left: box.left + rect.left,
        right: box.right + rect.left,
        top: box.top + rect.top,
        bottom: box.bottom + rect.top
      }))
    };
    const labelFeatures = queryRenderedLayerFeatures(map, [
      "jp-prefecture-label",
      "jp-prefecture-selected-label"
    ]);
    const polygonFeatures = queryRenderedLayerFeatures(map, ["jp-prefecture-fill"]);
    const renderedByEntityId = new Map<string, {
      entityId: string;
      layers: Set<string>;
      value: number | null;
    }>();

    for (const layerId of [
      "jp-prefecture-fill",
      "jp-prefecture-outline",
      "jp-prefecture-label",
      "jp-prefecture-selected-label"
    ]) {
      for (const feature of queryRenderedLayerFeatures(map, [layerId])) {
        const entityId = feature?.properties?.entityId;
        if (typeof entityId !== "string") {
          continue;
        }
        const current = renderedByEntityId.get(entityId) ?? {
          entityId,
          layers: new Set<string>(),
          value: null
        };
        current.layers.add(layerId);
        current.value = typeof feature?.properties?.value === "number"
          ? feature.properties.value
          : null;
        renderedByEntityId.set(entityId, current);
      }
    }

    return {
      collisionReport,
      renderedFeatures: [...renderedByEntityId.values()]
        .sort((left, right) => left.entityId.localeCompare(right.entityId))
        .map((feature) => ({
          entityId: feature.entityId,
          layers: [...feature.layers],
          value: feature.value
        })),
      renderedLabelIds: uniqueRenderedEntityIds(labelFeatures),
      renderedPolygonIds: uniqueRenderedEntityIds(polygonFeatures),
      zoom: map.getZoom()
    };
  };

  const diagnostics: PrefectureMapDiagnostics = {
    read,
    ...(MAP_ACCEPTANCE_FIXTURES_ENABLED
      ? {
          setPrefectureValueNull: async (entityId: string) => {
            const prefectures = prefectureRegionsToFeatureCollection(
              latestModelRef.current.regions,
              latestActiveIdRef.current
            ) as any;
            const missingValuePrefectures = {
              ...prefectures,
              features: prefectures.features.map((feature: any) => (
                feature.properties.entityId === entityId
                  ? {
                      ...feature,
                      properties: {
                        ...feature.properties,
                        neutral: true,
                        rawValue: null,
                        value: null
                      }
                    }
                  : feature
              ))
            };
            updateSource(map, "jp-prefectures", missingValuePrefectures);
            const labels = buildPrefectureLabelSources(
              latestModelRef.current.regions,
              latestActiveIdRef.current,
              new Map([[entityId, null]])
            );
            updateSource(map, "jp-prefecture-labels", labels.labelPoints);
            updateSource(map, "jp-prefecture-leaders", labels.leaderLines);
            await waitForMapIdle(map);
          }
        }
      : {})
  };

  (container as PrefectureMapDiagnosticsContainer).__prefectureMapDiagnostics = diagnostics;
  return diagnostics;
}

function queryRenderedLayerFeatures(map: any, layerIds: readonly string[]) {
  try {
    return map.queryRenderedFeatures(undefined, { layers: [...layerIds] }) ?? [];
  } catch {
    return [];
  }
}

function uniqueRenderedEntityIds(features: readonly any[]) {
  return [...new Set(features
    .map((feature) => feature?.properties?.entityId)
    .filter((entityId): entityId is string => typeof entityId === "string"))]
    .sort();
}

function waitForMapIdle(map: any) {
  return new Promise<void>((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      resolve();
    };
    map.once("idle", finish);
    window.setTimeout(finish, 2_000);
  });
}

function isXlDesktopViewport() {
  return typeof window.matchMedia === "function" && window.matchMedia(XL_DESKTOP_MEDIA_QUERY).matches;
}

export function getModeVisibilityState(mapMode: OperationMapMode) {
  return {
    showPoints: mapMode === "point" || mapMode === "route" || mapMode === "static",
    showRoutes: mapMode === "point" || mapMode === "route",
    showRegions: mapMode === "choropleth" || mapMode === "static",
    showClusters: mapMode === "cluster"
  };
}

function getGlobalRouteGlowPaint(themePalette: ThemePalette, statusPalette: StatusPalette, mapMode: OperationMapMode): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ],
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 14 : 11, routeFocused ? 10 : 7.5],
      6,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 11 : 8.5, routeFocused ? 7.5 : 5.8],
      10,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 8.5 : 6.5, routeFocused ? 5.8 : 4.4]
    ],
    "line-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["boolean", ["get", "selected"], false], 0.34, routeFocused ? 0.24 : 0.14],
      6,
      ["case", ["boolean", ["get", "selected"], false], 0.28, routeFocused ? 0.2 : 0.11],
      10,
      ["case", ["boolean", ["get", "selected"], false], 0.22, routeFocused ? 0.16 : 0.08]
    ],
    "line-blur": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      7.5,
      6,
      5.5,
      10,
      4
    ]
  };
}

function getGlobalRoutePaint(themePalette: ThemePalette, statusPalette: StatusPalette, mapMode: OperationMapMode): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ],
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 2.8 : 2.2, routeFocused ? 2 : 1.45],
      6,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 2.4 : 1.9, routeFocused ? 1.65 : 1.2],
      10,
      ["case", ["boolean", ["get", "selected"], false], routeFocused ? 2 : 1.55, routeFocused ? 1.35 : 1]
    ],
    "line-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["boolean", ["get", "selected"], false], 0.98, routeFocused ? 0.88 : 0.7],
      6,
      ["case", ["boolean", ["get", "selected"], false], 0.95, routeFocused ? 0.8 : 0.6],
      10,
      ["case", ["boolean", ["get", "selected"], false], 0.92, routeFocused ? 0.72 : 0.5]
    ],
    // Short ticks + long gaps = radar scan cadence.
    "line-dasharray": routeFocused ? [0.22, 1.35] : [0.18, 1.55]
  };
}

function getGlobalRouteHighlightPaint(statusPalette: StatusPalette, mapMode: OperationMapMode): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": statusPalette.selected,
    "line-width": ["interpolate", ["linear"], ["zoom"], 2, routeFocused ? 5.2 : 4.4, 6, routeFocused ? 4.4 : 3.6, 10, routeFocused ? 3.6 : 3],
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.28, 6, 0.22, 10, 0.16],
    "line-blur": 2.4
  };
}

function getLiveLogisticsRouteGlowPaint(
  statusPalette: StatusPalette,
  mapMode: OperationMapMode,
  hasCorridorFill = false
): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": statusPalette.monitoring,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      routeFocused ? 15 : 12,
      6,
      routeFocused ? 12 : 9.5,
      10,
      routeFocused ? 9 : 7
    ],
    "line-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      hasCorridorFill ? 0.05 : routeFocused ? 0.3 : 0.2,
      6,
      hasCorridorFill ? 0.04 : routeFocused ? 0.24 : 0.16,
      10,
      hasCorridorFill ? 0.03 : routeFocused ? 0.18 : 0.12
    ],
    "line-blur": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      8.5,
      6,
      6.5,
      10,
      4.5
    ]
  };
}

function getLiveLogisticsRoutePaint(
  statusPalette: StatusPalette,
  mapMode: OperationMapMode,
  hasCorridorFill = false
): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": statusPalette.monitoring,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      routeFocused ? 2.6 : 2,
      6,
      routeFocused ? 2.2 : 1.7,
      10,
      routeFocused ? 1.8 : 1.35
    ],
    "line-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      hasCorridorFill ? 0.12 : routeFocused ? 0.92 : 0.78,
      6,
      hasCorridorFill ? 0.1 : routeFocused ? 0.86 : 0.7,
      10,
      hasCorridorFill ? 0.08 : routeFocused ? 0.78 : 0.62
    ],
    // Scanner ticks: short bright segments with breathing gap.
    "line-dasharray": routeFocused ? [0.2, 1.2] : [0.16, 1.45]
  };
}

function applyPaintObject(map: any, layerId: string, paint: Record<string, unknown>) {
  for (const [key, value] of Object.entries(paint)) {
    map.setPaintProperty(layerId, key, value);
  }
}

function startRouteScanAnimation(
  map: any,
  phaseRef: { current: number },
  rafRef: { current: number | null }
) {
  if (rafRef.current !== null) {
    return;
  }

  let lastTick = 0;

  const tick = (now: number) => {
    if (!map || typeof map.getLayer !== "function") {
      rafRef.current = null;
      return;
    }

    // ~12fps is enough for a soft radar crawl without burning CPU.
    if (now - lastTick > 80) {
      lastTick = now;
      phaseRef.current = (phaseRef.current + 1) % 20;
      const phase = phaseRef.current;
      const dashOn = 0.14 + (phase % 10) * 0.018;
      const dashOff = 1.55 - (phase % 10) * 0.03;
      const glowBoost = 0.92 + Math.sin((phase / 20) * Math.PI * 2) * 0.08;

      try {
        if (map.getLayer("global-route-line")) {
          map.setPaintProperty("global-route-line", "line-dasharray", [dashOn, dashOff]);
        }
        if (map.getLayer("live-logistics-route-pulse")) {
          map.setPaintProperty("live-logistics-route-pulse", "line-dasharray", [dashOn * 0.95, dashOff * 0.95]);
        }
        if (map.getLayer("live-logistics-route-glow")) {
          const base = map.getPaintProperty?.("live-logistics-route-glow", "line-opacity");
          if (typeof base === "number") {
            map.setPaintProperty("live-logistics-route-glow", "line-opacity", Math.min(0.4, base * glowBoost));
          }
        }
      } catch {
        // Style may be mid-reload; skip this frame.
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  rafRef.current = requestAnimationFrame(tick);
}

function hasFilledLogisticsCorridors(model: JapanMapCanvasModel) {
  return Boolean(model.logisticsImpactCorridors?.length);
}

function getLogisticsCorridorFillColor(statusPalette: StatusPalette): any {
  return [
    "match",
    ["get", "kind"],
    "highway",
    statusPalette.watch,
    "rail",
    statusPalette.monitoring,
    "port-hinterland",
    statusPalette.selected,
    statusPalette.watch
  ];
}

function getLogisticsCorridorOutlineColor(statusPalette: StatusPalette): any {
  return [
    "match",
    ["get", "kind"],
    "highway",
    statusPalette.selected,
    "rail",
    statusPalette.monitoring,
    "port-hinterland",
    statusPalette.watch,
    statusPalette.selected
  ];
}

function getDomesticRoutePaint(themePalette: ThemePalette, statusPalette: StatusPalette, mapMode: OperationMapMode): any {
  const routeFocused = mapMode === "route";

  return {
    "line-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ],
    "line-width": [
      "case",
      ["boolean", ["get", "selected"], false],
      routeFocused ? 4.8 : 4,
      routeFocused ? 3 : 2.2
    ],
    "line-opacity": [
      "case",
      ["boolean", ["get", "selected"], false],
      0.98,
      routeFocused ? 0.82 : 0.62
    ]
  };
}

function getPrefectureFillPaint(themePalette: ThemePalette, statusPalette: StatusPalette): any {
  const visibleOpacity = [
    "case",
    ["boolean", ["get", "selected"], false],
    0.78,
    [
      "case",
      ["==", ["get", "value"], null],
      0.34,
      ["interpolate", ["linear"], ["get", "value"], 0, 0.18, 100, 0.62]
    ]
  ];

  return {
    "fill-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      ["==", ["get", "value"], null],
      "rgba(116, 126, 137, 0.28)",
      themePalette.accent
    ],
    "fill-opacity": getPrefectureZoomFadeOpacity(visibleOpacity)
  };
}

function getPrefectureOutlinePaint(themePalette: ThemePalette): any {
  return {
    "line-color": [
      "case",
      ["==", ["get", "value"], null],
      "rgba(125, 137, 149, 0.68)",
      themePalette.accent
    ],
    "line-opacity": getPrefectureZoomFadeOpacity(0.68),
    "line-width": 1.1
  };
}

function getPrefectureSelectedOutlinePaint(statusPalette: StatusPalette): any {
  return {
    "line-color": statusPalette.selected,
    "line-opacity": getPrefectureZoomFadeOpacity(1),
    "line-width": 3.2
  };
}

function getPrefectureLeaderLinePaint(themePalette: ThemePalette, statusPalette: StatusPalette): any {
  return {
    "line-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      ["==", ["get", "value"], null],
      "rgba(125, 137, 149, 0.72)",
      themePalette.accent
    ],
    "line-opacity": ["case", ["boolean", ["get", "selected"], false], 0.95, 0.68],
    "line-width": ["case", ["boolean", ["get", "selected"], false], 1.8, 1]
  };
}

function getPrefectureLabelPaint(themePalette: ThemePalette): any {
  return {
    "text-color": [
      "case",
      ["==", ["get", "value"], null],
      "#697580",
      themePalette.accent
    ],
    "text-halo-color": "rgba(250,252,255,0.98)",
    "text-halo-width": 1.8,
    "text-halo-blur": 0.25
  };
}

function getPrefectureSelectedLabelPaint(statusPalette: StatusPalette): any {
  return {
    "text-color": statusPalette.selected,
    "text-halo-color": "rgba(250,252,255,0.99)",
    "text-halo-width": 2.4,
    "text-halo-blur": 0.2
  };
}

function getPrefectureZoomFadeOpacity(visibleOpacity: unknown): any {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    DOMESTIC_CONTEXT_MIN_ZOOM,
    visibleOpacity,
    PREFECTURE_POLYGON_FADE_START_ZOOM,
    visibleOpacity,
    PREFECTURE_POLYGON_MAX_ZOOM,
    0
  ];
}

function getRegionFillPaint(themePalette: ThemePalette): any {
  return {
    "fill-color": [
      "case",
      ["boolean", ["get", "hasData"], false],
      themePalette.accent,
      "rgba(116, 126, 137, 0.28)"
    ],
    "fill-opacity": [
      "case",
      ["boolean", ["get", "hasData"], false],
      ["interpolate", ["linear"], ["get", "value"], 0, 0.18, 100, 0.62],
      0.34
    ]
  };
}

function getRegionOutlinePaint(themePalette: ThemePalette, statusPalette: StatusPalette): any {
  return {
    "line-color": [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      ["boolean", ["get", "hasData"], false],
      themePalette.accent,
      "rgba(125, 137, 149, 0.68)"
    ],
    "line-opacity": ["case", ["boolean", ["get", "selected"], false], 1, 0.68],
    "line-width": ["case", ["boolean", ["get", "selected"], false], 2.8, 1.1]
  };
}

function hoverFeature(event: any, onHover: (hover: MapHoverViewModel | null) => void) {
  const properties = event.features?.[0]?.properties;
  const selectionId = properties?.selectionId ?? properties?.id;
  const label = properties?.label;
  const x = typeof event?.point?.x === "number" ? Math.round(event.point.x) : null;
  const y = typeof event?.point?.y === "number" ? Math.round(event.point.y) : null;

  if (!selectionId || !label || x === null || y === null) {
    onHover(null);
    return;
  }

  const rawValue = typeof properties.rawValue === "number" ? properties.rawValue : null;
  const valueLabel = rawValue !== null
    ? JA_NUMBER_FORMATTER.format(rawValue)
    : typeof properties.valueLabel === "string" && properties.valueLabel.length > 0
      ? properties.valueLabel
      : undefined;
  const unitLabel = typeof properties.unit === "string" && properties.unit.length > 0
    ? properties.unit
    : undefined;
  const period = properties.period ?? properties.periodLabel;
  const periodLabel = typeof period === "string" && period.length > 0
    ? period
    : undefined;

  onHover({
    selectionId,
    label,
    ...(valueLabel ? { valueLabel } : {}),
    ...(unitLabel ? { unitLabel } : {}),
    ...(periodLabel ? { periodLabel } : {}),
    x,
    y
  });
}

function selectFeatureId(event: any, onSelect: (id: string, anchor?: MapPopupAnchor) => void, map: any) {
  const feature = event.features?.[0];
  const id = feature?.properties?.selectionId ?? feature?.properties?.id;

  if (id) {
    onSelect(id, resolveSelectionAnchor(event, map));
  }
}

function resolveSelectionAnchor(event: any, map: any): MapPopupAnchor | undefined {
  const x = typeof event?.point?.x === "number" ? Math.round(event.point.x) : null;
  const y = typeof event?.point?.y === "number" ? Math.round(event.point.y) : null;

  if (x === null || y === null) {
    return undefined;
  }

  const canvas = typeof map?.getCanvas === "function" ? map.getCanvas() : null;
  const width = getCanvasDimension(canvas?.clientWidth, canvas?.width, 1024);

  return {
    placement: x > width * 0.64 ? "left" : "right",
    x,
    y
  };
}

function pointsToFeatureCollection(points: JapanMapPoint[], activeId?: string) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.lon, point.lat]
      },
      properties: {
        id: point.id,
        kind: point.kind,
        label: point.label,
        metaLabel: point.metaLabel,
        valueLabel: point.metaLabel ?? null,
        selectionId: point.selectionId ?? point.id,
        selected: point.id === activeId || point.selectionId === activeId,
        tone: point.tone
      }
    }))
  };
}

function routesToFeatureCollection(routes: JapanMapRoute[], points: JapanMapPoint[], activeId: string) {
  const pointMap = new Map(points.map((point) => [point.id, point]));

  return {
    type: "FeatureCollection" as const,
    features: routes
      .map((route) => {
        const anchors = route.pointIds
          .map((pointId) => pointMap.get(pointId))
          .filter((point): point is JapanMapPoint => Boolean(point))
          .map((point) => [point.lon, point.lat] as LonLat);

        if (anchors.length < 2) {
          return null;
        }

        const coordinates = buildRouteCoordinates(route, anchors);

        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates
          },
          properties: {
            id: route.id,
            label: route.label,
            rawValue: null,
            unit: null,
            period: null,
            selectionId: resolveRouteSelectionId(route),
            selected:
              route.id === activeId ||
              route.pointIds.includes(activeId) ||
              Boolean(route.relatedIds?.includes(activeId))
          }
        };
      })
      .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))
  };
}

function buildRouteCoordinates(route: JapanMapRoute, anchors: LonLat[]): LonLat[] {
  // Ocean / tanker / energy corridors: sea-lane aware curves.
  // Domestic road/rail/coastal: geodesic densify only (no ocean detours).
  const haystack = `${route.id} ${route.label}`;
  const isDomesticLogistics =
    /road|rail|coastal|highway|hinterland|airport|air-cargo|航空|道路|鉄道|内航|港湾後続|配送/i.test(haystack) &&
    !/tanker|lng|maritime|ais|hormuz|malacca|crude|oil|gulf/i.test(haystack);

  const isMaritime =
    !isDomesticLogistics &&
    (/tanker|lng|maritime|ais|oil|hormuz|malacca|gulf|crude|carrier/i.test(haystack) ||
      route.id.startsWith("flow:") ||
      (route.id.startsWith("live-logistics:") && anchorsSpanOceanicDistance(anchors)));

  if (isMaritime) {
    return buildMaritimeRouteCoordinates(anchors, { samplesPerSegment: 20 });
  }

  return densifyGeodesicPolyline(anchors, 10);
}

function anchorsSpanOceanicDistance(anchors: LonLat[]): boolean {
  if (anchors.length < 2) {
    return false;
  }

  let maxKm = 0;
  for (let index = 1; index < anchors.length; index += 1) {
    const [lon1, lat1] = anchors[index - 1];
    const [lon2, lat2] = anchors[index];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const km = 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
    maxKm = Math.max(maxKm, km);
  }

  return maxKm > 1200;
}

function corridorsToFeatureCollection(corridors: JapanMapCorridor[], activeId: string) {
  return {
    type: "FeatureCollection" as const,
    features: corridors.map((corridor) => ({
      type: "Feature" as const,
      geometry: corridor.geometry,
      properties: {
        id: corridor.id,
        kind: corridor.kind,
        label: corridor.label,
        selectionId: corridor.selectionId,
        selected: corridor.id === activeId || corridor.selectionId === activeId,
        value: corridor.value,
        rawValue: corridor.value,
        unit: null,
        period: null,
        hasData: true
      }
    }))
  };
}

function buildPrefectureLabelSources(
  regions: readonly JapanMapRegion[],
  activeId: string,
  valueOverrides: ReadonlyMap<string, number | null> = new Map()
) {
  const values = new Map(
    regions
      .filter((region): region is PrefectureBoundaryMapRegion => region.geometryKind === "prefecture-boundary")
      .map((region) => [region.id, region.value] as const)
  );
  const collections = buildPrefectureLabelFeatureCollections(PREFECTURE_LABEL_LAYOUT, activeId);
  const addMetricState = <T extends { properties: Record<string, unknown> }>(feature: T) => {
    const entityId = feature.properties.entityId as string;
    const value = valueOverrides.has(entityId) ? valueOverrides.get(entityId)! : values.get(entityId) ?? null;
    return {
      ...feature,
      properties: {
        ...feature.properties,
        neutral: value === null,
        value
      }
    };
  };

  return {
    labelPoints: {
      ...collections.labelPoints,
      features: collections.labelPoints.features.map(addMetricState)
    },
    leaderLines: {
      ...collections.leaderLines,
      features: collections.leaderLines.features.map(addMetricState)
    }
  };
}

function prefectureRegionsToFeatureCollection(
  regions: JapanMapRegion[],
  activeId: string
): GeoJSONSourceSpecification["data"] {
  const prefectureRegions = regions.filter(
    (region): region is PrefectureBoundaryMapRegion => region.geometryKind === "prefecture-boundary"
  );

  if (prefectureRegions.length === 0) {
    return {
      type: "FeatureCollection" as const,
      features: []
    };
  }

  // MapLibre consumes source data without mutation, but its public type requires mutable GeoJSON arrays.
  return buildPrefectureMetricFeatureCollection(
    prefectureRegions,
    activeId
  ) as unknown as GeoJSONSourceSpecification["data"];
}

function getPrefectureSourceSignature(regions: JapanMapRegion[], activeId: string) {
  const presentationTuples = regions
    .filter((region): region is PrefectureBoundaryMapRegion => region.geometryKind === "prefecture-boundary")
    .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
    .map((region) => [
      region.geometryKind,
      region.prefectureCode,
      region.id,
      region.label,
      region.value,
      region.rawValue ?? null,
      region.unit ?? null,
      region.periodLabel ?? null,
      region.sourceIds ?? []
    ]);

  return JSON.stringify([activeId, presentationTuples]);
}

function representativeRadiusRegionsToFeatureCollection(regions: JapanMapRegion[], activeId: string) {
  const representativeRegions = regions.filter(
    (region): region is RepresentativeRadiusMapRegion => region.geometryKind === "representative-radius"
  );

  return {
    type: "FeatureCollection" as const,
    features: representativeRegions.map((region) => ({
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          createCirclePolygon(
            region.lon,
            region.lat,
            region.value === null ? 28 : 48 + region.value * 0.25
          )
        ]
      },
      properties: {
        id: region.id,
        label: region.label,
        selectionId: region.id,
        selected: region.id === activeId,
        value: region.value,
        rawValue: region.rawValue ?? null,
        unit: region.unit ?? null,
        period: region.periodLabel ?? null,
        hasData: region.rawValue !== undefined
      }
    }))
  };
}

function resolveRouteSelectionId(route: JapanMapRoute) {
  return route.id;
}

function createCirclePolygon(lon: number, lat: number, radiusKm: number) {
  const points: Array<[number, number]> = [];
  const steps = 40;

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const dx = (radiusKm / 111.32) * Math.cos(angle);
    const dy = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    points.push([lon + dy, lat + dx]);
  }

  return points;
}

function updateSource(map: any, sourceId: string, data: unknown) {
  const source = map.getSource(sourceId);

  if (source && "setData" in source) {
    source.setData(data);
  }
}

function getResponsiveFitPadding(map: any, prefersGlobal: boolean) {
  const canvas = typeof map.getCanvas === "function" ? map.getCanvas() : null;
  const width = getCanvasDimension(canvas?.clientWidth, canvas?.width, 1024);
  const height = getCanvasDimension(canvas?.clientHeight, canvas?.height, 720);
  const horizontal = Math.min(120, Math.max(32, Math.floor(width * 0.12)));
  const top = Math.min(180, Math.max(44, Math.floor(height * 0.16)));
  const bottom = Math.min(prefersGlobal ? 200 : 260, Math.max(56, Math.floor(height * 0.2)));

  return {
    top,
    right: horizontal,
    bottom,
    left: horizontal
  };
}

function getCanvasDimension(primary: unknown, secondary: unknown, fallback: number) {
  for (const value of [primary, secondary]) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return fallback;
}

function focusMapOnSelection(
  map: any,
  model: JapanMapCanvasModel,
  activeId: string,
  mapMode: OperationMapMode,
  currentZoom: number
) {
  const activeRoute = model.routes.find((route) => routeMatchesSelection(route, activeId));
  const activePoint = model.points.find((point) => point.id === activeId);
  const activeRegion = model.regions.find((region) => region.id === activeId);
  const activeGlobalRoute = model.globalRoutes.find((route) => routeMatchesSelection(route, activeId));
  const activeGlobalPoint = model.globalPoints.find((point) => point.id === activeId);
  const activeLiveRoute = model.liveRoutes?.find((route) => routeMatchesSelection(route, activeId));
  const activeLiveVessel = model.liveVessels?.find((point) => point.id === activeId || point.selectionId === activeId);
  const globalRoutePoints = activeGlobalRoute
    ? activeGlobalRoute.pointIds
        .map((pointId) => model.globalPoints.find((point) => point.id === pointId))
        .filter((point): point is JapanMapPoint => Boolean(point))
    : [];
  const liveRoutePoints = activeLiveRoute
    ? activeLiveRoute.pointIds
        .map((pointId) => model.livePoints?.find((point) => point.id === pointId))
        .filter((point): point is JapanMapPoint => Boolean(point))
    : [];
  const domesticRoutePoints = activeRoute
    ? activeRoute.pointIds
        .map((pointId) => model.points.find((point) => point.id === pointId))
        .filter((point): point is JapanMapPoint => Boolean(point))
    : [];
  const prefersGlobalRoute = mapMode === "route" && Boolean(activeGlobalRoute || activeLiveRoute || activeLiveVessel);
  const prefersGlobal = Boolean(
    prefersGlobalRoute ||
      (!activeRoute && !activePoint && !activeRegion && (activeGlobalRoute || activeGlobalPoint || activeLiveRoute || activeLiveVessel)) ||
      currentZoom <= GLOBAL_CONTEXT_MAX_ZOOM + 0.15
  );

  const focusPoints = liveRoutePoints.length > 0 || activeLiveVessel
    ? resolveLiveFocusPoints(model, activeLiveVessel, liveRoutePoints)
    : prefersGlobal
      ? resolveGlobalFocusPoints(model, activeGlobalPoint, globalRoutePoints)
    : resolveDomesticFocusPoints(model, activePoint, activeRegion, domesticRoutePoints);

  if (focusPoints.length === 0) {
    return;
  }

  if (focusPoints.length === 1) {
    const zoom = prefersGlobal
      ? mapMode === "route"
        ? 3.8
        : 4.2
      : mapMode === "route"
        ? 8.6
        : 7.2;

    map.easeTo({
      center: [focusPoints[0].lon, focusPoints[0].lat],
      zoom,
      duration: 700
    });
    return;
  }

  const bounds = focusPoints.reduce(
    (accumulator, point) => [
      [Math.min(accumulator[0][0], point.lon), Math.min(accumulator[0][1], point.lat)],
      [Math.max(accumulator[1][0], point.lon), Math.max(accumulator[1][1], point.lat)]
    ] as [[number, number], [number, number]],
    [
      [focusPoints[0].lon, focusPoints[0].lat],
      [focusPoints[0].lon, focusPoints[0].lat]
    ] as [[number, number], [number, number]]
  );

  map.fitBounds(bounds, {
    padding: getResponsiveFitPadding(map, prefersGlobal),
    maxZoom: prefersGlobal ? 4.4 : mapMode === "route" ? 8.4 : 7.6,
    duration: 700
  });
}

function routeMatchesSelection(route: JapanMapRoute, activeId: string) {
  return route.id === activeId || route.pointIds.includes(activeId) || route.relatedIds.includes(activeId);
}

function resolveDomesticFocusPoints(
  model: JapanMapCanvasModel,
  activePoint?: JapanMapPoint,
  activeRegion?: JapanMapRegion,
  routePoints: JapanMapPoint[] = []
) {
  if (routePoints.length > 0) {
    return routePoints;
  }

  if (activePoint) {
    return [activePoint];
  }

  if (activeRegion) {
    return [
      {
        id: activeRegion.id,
        kind: "Region",
        label: activeRegion.label,
        lat: activeRegion.lat,
        lon: activeRegion.lon,
        tone: "watch" as const
      }
    ];
  }

  return model.points;
}

function resolveGlobalFocusPoints(
  model: JapanMapCanvasModel,
  activeGlobalPoint?: JapanMapPoint,
  routePoints: JapanMapPoint[] = []
) {
  if (routePoints.length > 0) {
    return routePoints;
  }

  if (activeGlobalPoint) {
    return [activeGlobalPoint];
  }

  return model.globalPoints;
}

function resolveLiveFocusPoints(
  model: JapanMapCanvasModel,
  activeLiveVessel?: JapanMapPoint,
  routePoints: JapanMapPoint[] = []
) {
  if (routePoints.length > 0) {
    return activeLiveVessel ? [...routePoints, activeLiveVessel] : routePoints;
  }

  if (activeLiveVessel) {
    return [activeLiveVessel];
  }

  return [...(model.livePoints ?? []), ...(model.liveVessels ?? [])];
}
