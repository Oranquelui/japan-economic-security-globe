"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import type { OperationMapMode } from "../lib/presentation/operations";
import type { JapanMapCanvasModel, JapanMapPoint, JapanMapRegion, JapanMapRoute } from "../lib/presentation/map-canvas";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { buildOperationsBasemapStyle } from "../lib/presentation/basemap-style";

interface JapanOperationsMapCanvasProps {
  activeId: string;
  command?: {
    nonce: number;
    type: "recenter" | "zoomIn" | "zoomOut";
  };
  mapMode: OperationMapMode;
  model: JapanMapCanvasModel;
  onSelect: (id: string) => void;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

const INITIAL_CENTER: [number, number] = [138.45, 36.25];
const INITIAL_ZOOM = 4.9;
const GLOBAL_CONTEXT_MAX_ZOOM = 3.6;
const DOMESTIC_CONTEXT_MIN_ZOOM = 3.2;

export function JapanOperationsMapCanvas({
  activeId,
  command,
  mapMode,
  model,
  onSelect,
  statusPalette,
  themePalette
}: JapanOperationsMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const zoomRef = useRef(INITIAL_ZOOM);
  const handleSelect = useEffectEvent(onSelect);

  useEffect(() => {
    let disposed = false;

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
        style: buildOperationsBasemapStyle(themePalette)
      });

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
          data: regionsToFeatureCollection(model.regions, activeId)
        });

        map.addSource("global-points", {
          type: "geojson",
          data: pointsToFeatureCollection(model.globalPoints, activeId)
        });

        map.addSource("global-routes", {
          type: "geojson",
          data: routesToFeatureCollection(model.globalRoutes, model.globalPoints, activeId)
        });

        map.addLayer({
          id: "global-route-line",
          type: "line",
          source: "global-routes",
          maxzoom: GLOBAL_CONTEXT_MAX_ZOOM,
          paint: {
            "line-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              statusPalette.selected,
              themePalette.accent
            ],
            "line-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              3.2,
              2
            ],
            "line-opacity": [
              "case",
              ["boolean", ["get", "selected"], false],
              0.94,
              0.52
            ],
            "line-dasharray": [1.1, 1.6]
          }
        });

        map.addLayer({
          id: "global-point-circle",
          type: "circle",
          source: "global-points",
          maxzoom: GLOBAL_CONTEXT_MAX_ZOOM,
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
            "circle-stroke-color": "#f8fbff",
            "circle-stroke-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              1.8,
              0.7
            ],
            "circle-radius": [
              "case",
              ["boolean", ["get", "selected"], false],
              7.5,
              5.5
            ],
            "circle-opacity": 0.92
          }
        });

        map.addLayer({
          id: "global-point-label",
          type: "symbol",
          source: "global-points",
          maxzoom: GLOBAL_CONTEXT_MAX_ZOOM,
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 11,
            "text-offset": [0.9, 0.1],
            "text-anchor": "left"
          },
          paint: {
            "text-color": "#f0f7ff",
            "text-halo-color": "rgba(4,10,18,0.92)",
            "text-halo-width": 1.3
          }
        });

        map.addLayer({
          id: "jp-region-fill",
          type: "fill",
          source: "jp-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              statusPalette.selected,
              themePalette.accent
            ],
            "fill-opacity": 0.18
          }
        });

        map.addLayer({
          id: "jp-region-outline",
          type: "line",
          source: "jp-regions",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "line-color": "rgba(233,244,255,0.45)",
            "line-width": 1.2
          }
        });

        map.addLayer({
          id: "jp-route-line",
          type: "line",
          source: "jp-routes",
          minzoom: DOMESTIC_CONTEXT_MIN_ZOOM,
          paint: {
            "line-color": [
              "case",
              ["boolean", ["get", "selected"], false],
              statusPalette.selected,
              themePalette.accent
            ],
            "line-width": [
              "case",
              ["boolean", ["get", "selected"], false],
              4,
              2.2
            ],
            "line-opacity": [
              "case",
              ["boolean", ["get", "selected"], false],
              0.96,
              0.5
            ]
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
            "circle-stroke-color": "#f8fbff",
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
            "text-color": "#f0f7ff",
            "text-halo-color": "rgba(4,10,18,0.92)",
            "text-halo-width": 1.5
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
            "text-color": "#f8fbff"
          }
        });

        for (const layerId of ["jp-point-circle", "jp-route-line", "jp-region-fill", "jp-cluster-circle", "global-point-circle", "global-route-line"]) {
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        map.on("click", "jp-point-circle", (event: any) => selectFeatureId(event, handleSelect));
        map.on("click", "jp-route-line", (event: any) => selectFeatureId(event, handleSelect));
        map.on("click", "jp-region-fill", (event: any) => selectFeatureId(event, handleSelect));
        map.on("click", "global-point-circle", (event: any) => selectFeatureId(event, handleSelect));
        map.on("click", "global-route-line", (event: any) => selectFeatureId(event, handleSelect));

        map.on("click", "jp-cluster-circle", async (event: any) => {
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
        });

        applyModeVisibility(map, mapMode);
        focusMapOnSelection(map, model, activeId, mapMode, zoomRef.current);
      });
    }

    mount();

    return () => {
      disposed = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty("ops-background", "background-color", themePalette.surfaceCanvas);
    map.setPaintProperty("global-route-line", "line-color", [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ]);
    map.setPaintProperty("global-point-circle", "circle-color", [
      "match",
      ["get", "tone"],
      "critical",
      statusPalette.high,
      "watch",
      statusPalette.watch,
      statusPalette.normal
    ]);
    map.setPaintProperty("jp-region-fill", "fill-color", [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ]);
    map.setPaintProperty("jp-route-line", "line-color", [
      "case",
      ["boolean", ["get", "selected"], false],
      statusPalette.selected,
      themePalette.accent
    ]);
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
    updateSource(map, "jp-points", pointsToFeatureCollection(model.points, activeId));
    updateSource(map, "jp-points-cluster", pointsToFeatureCollection(model.points, activeId));
    updateSource(map, "jp-routes", routesToFeatureCollection(model.routes, model.points, activeId));
    updateSource(map, "jp-regions", regionsToFeatureCollection(model.regions, activeId));
    applyModeVisibility(map, mapMode);
  }, [activeId, mapMode, model, statusPalette, themePalette]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    focusMapOnSelection(map, model, activeId, mapMode, zoomRef.current);
  }, [activeId, mapMode, model]);

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

  return <div ref={containerRef} className="absolute inset-0" />;
}

function applyModeVisibility(map: any, mapMode: OperationMapMode) {
  const visibility = (show: boolean) => (show ? "visible" : "none");
  const showPoints = mapMode === "point" || mapMode === "route" || mapMode === "static";
  const showRoutes = mapMode === "route";
  const showRegions = mapMode === "choropleth" || mapMode === "static";

  map.setLayoutProperty("global-point-circle", "visibility", visibility(showPoints));
  map.setLayoutProperty("global-point-label", "visibility", visibility(showPoints));
  map.setLayoutProperty("global-route-line", "visibility", visibility(showRoutes));

  map.setLayoutProperty("jp-point-circle", "visibility", visibility(showPoints));
  map.setLayoutProperty("jp-point-label", "visibility", visibility(showPoints));
  map.setLayoutProperty("jp-route-line", "visibility", visibility(showRoutes));
  map.setLayoutProperty("jp-region-fill", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-region-outline", "visibility", visibility(showRegions));
  map.setLayoutProperty("jp-cluster-circle", "visibility", visibility(mapMode === "cluster"));
  map.setLayoutProperty("jp-cluster-count", "visibility", visibility(mapMode === "cluster"));
}

function selectFeatureId(event: any, onSelect: (id: string) => void) {
  const feature = event.features?.[0];
  const id = feature?.properties?.id;

  if (id) {
    onSelect(id);
  }
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
        selected: point.id === activeId,
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
        const coordinates = route.pointIds
          .map((pointId) => pointMap.get(pointId))
          .filter((point): point is JapanMapPoint => Boolean(point))
          .map((point) => [point.lon, point.lat]);

        if (coordinates.length < 2) {
          return null;
        }

        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates
          },
          properties: {
            id: route.id,
            label: route.label,
            selected: route.id === activeId
          }
        };
      })
      .filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))
  };
}

function regionsToFeatureCollection(regions: JapanMapRegion[], activeId: string) {
  return {
    type: "FeatureCollection" as const,
    features: regions.map((region) => ({
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [createCirclePolygon(region.lon, region.lat, 48 + region.value * 0.25)]
      },
      properties: {
        id: region.id,
        label: region.label,
        selected: region.id === activeId,
        value: region.value
      }
    }))
  };
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

function focusMapOnSelection(
  map: any,
  model: JapanMapCanvasModel,
  activeId: string,
  mapMode: OperationMapMode,
  currentZoom: number
) {
  const activeRoute = model.routes.find((route) => route.id === activeId);
  const activePoint = model.points.find((point) => point.id === activeId);
  const activeRegion = model.regions.find((region) => region.id === activeId);
  const activeGlobalRoute = model.globalRoutes.find((route) => route.id === activeId);
  const activeGlobalPoint = model.globalPoints.find((point) => point.id === activeId);
  const globalRoutePoints = activeGlobalRoute
    ? activeGlobalRoute.pointIds
        .map((pointId) => model.globalPoints.find((point) => point.id === pointId))
        .filter((point): point is JapanMapPoint => Boolean(point))
    : [];
  const domesticRoutePoints = activeRoute
    ? activeRoute.pointIds
        .map((pointId) => model.points.find((point) => point.id === pointId))
        .filter((point): point is JapanMapPoint => Boolean(point))
    : [];
  const prefersGlobal =
    (!activeRoute && !activePoint && !activeRegion && (activeGlobalRoute || activeGlobalPoint)) ||
    currentZoom <= GLOBAL_CONTEXT_MAX_ZOOM + 0.15;

  const focusPoints = prefersGlobal
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
    padding: prefersGlobal
      ? {
          top: 180,
          right: 120,
          bottom: 200,
          left: 120
        }
      : {
          top: 180,
          right: 120,
          bottom: 260,
          left: 120
        },
    maxZoom: prefersGlobal ? 4.4 : mapMode === "route" ? 8.4 : 7.6,
    duration: 700
  });
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
