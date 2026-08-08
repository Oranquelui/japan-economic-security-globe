// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { JapanOperationsMapCanvas } from "../JapanOperationsMapCanvas";
import { prefectureBoundaryCollection } from "../../lib/geo/prefecture-boundaries";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";

const addedLayers: Array<Record<string, unknown>> = [];
const addedLayerCalls: Array<{
  beforeId: string | undefined;
  layer: Record<string, unknown>;
}> = [];
const addedSources = new Map<string, unknown>();
const addedSourceConfigs = new Map<string, Record<string, unknown>>();
const sourceSetDataSpies = new Map<string, ReturnType<typeof vi.fn>>();
const registeredLayerHandlers: Array<{
  event: string;
  handler: (...args: any[]) => void;
  layerIds: string[];
  unsubscribe: ReturnType<typeof vi.fn>;
}> = [];
let lastMap: {
  areTilesLoaded: ReturnType<typeof vi.fn>;
  easeTo: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  getCanvas: ReturnType<typeof vi.fn>;
  getCenter: ReturnType<typeof vi.fn>;
  getZoom: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  setLayoutProperty: ReturnType<typeof vi.fn>;
  setPaintProperty: ReturnType<typeof vi.fn>;
} | null = null;
let mapCanvasSize = { width: 1024, height: 720 };
let mapZoom = 5;
let zoomEndHandler: (() => void) | null = null;
let desktopViewportMatches = true;
let mapInstanceCount = 0;
const mediaChangeListeners = new Set<(event: { matches: boolean }) => void>();

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn((query: string) => ({
    addEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => {
      mediaChangeListeners.add(listener);
    },
    get matches() {
      return query === "(min-width: 1280px)" && desktopViewportMatches;
    },
    media: query,
    removeEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => {
      mediaChangeListeners.delete(listener);
    }
  }))
});

vi.mock("maplibre-gl", () => {
  class MockMap {
    dragRotate = { disable: vi.fn() };
    touchZoomRotate = { disableRotation: vi.fn() };

    addControl = vi.fn();
    addSource = vi.fn((id: string, source: Record<string, unknown>) => {
      addedSourceConfigs.set(id, source);
      addedSources.set(id, source.data);
      sourceSetDataSpies.set(id, vi.fn((data: unknown) => {
        addedSources.set(id, data);
      }));
    });
    addLayer = vi.fn((layer: Record<string, unknown>, beforeId?: string) => {
      const beforeIndex = beforeId
        ? addedLayers.findIndex((candidate) => candidate.id === beforeId)
        : -1;
      if (beforeIndex >= 0) {
        addedLayers.splice(beforeIndex, 0, layer);
      } else {
        addedLayers.push(layer);
      }
      addedLayerCalls.push({ beforeId, layer });
    });
    remove = vi.fn();
    easeTo = vi.fn();
    fitBounds = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    setPaintProperty = vi.fn();
    setLayoutProperty = vi.fn();
    canvas = {
      clientHeight: mapCanvasSize.height,
      clientWidth: mapCanvasSize.width,
      style: { cursor: "" }
    };
    getCanvas = vi.fn(() => this.canvas);
    getCenter = vi.fn(() => ({ lat: 35, lng: 138.45 }));
    getSource = vi.fn((id: string) => ({
      setData: sourceSetDataSpies.get(id),
      getClusterExpansionZoom: vi.fn(async () => 6)
    }));
    isStyleLoaded = vi.fn(() => true);
    areTilesLoaded = vi.fn(() => true);
    getZoom = vi.fn(() => mapZoom);
    queryRenderedFeatures = vi.fn(() => []);
    off = vi.fn();

    constructor() {
      mapInstanceCount += 1;
      lastMap = this;
    }

    on = vi.fn((event: string, layerOrHandler: string | string[] | ((...args: unknown[]) => void), handler?: (...args: any[]) => void) => {
      if (event === "load" && typeof layerOrHandler === "function") {
        layerOrHandler();
      }
      if (event === "zoomend" && typeof layerOrHandler === "function") {
        zoomEndHandler = layerOrHandler as () => void;
      }

      if ((typeof layerOrHandler === "string" || Array.isArray(layerOrHandler)) && handler) {
        const registration = {
          event,
          handler,
          layerIds: Array.isArray(layerOrHandler) ? layerOrHandler : [layerOrHandler],
          unsubscribe: vi.fn()
        };
        registeredLayerHandlers.push(registration);
        return { unsubscribe: registration.unsubscribe };
      }

      return { unsubscribe: vi.fn() };
    });
  }

  class MockAttributionControl {
    constructor(_: unknown) {}
  }

  return {
    Map: MockMap,
    AttributionControl: MockAttributionControl
  };
});

afterEach(() => {
  cleanup();
  addedLayers.length = 0;
  addedLayerCalls.length = 0;
  addedSources.clear();
  addedSourceConfigs.clear();
  sourceSetDataSpies.clear();
  registeredLayerHandlers.length = 0;
  lastMap = null;
  mapCanvasSize = { width: 1024, height: 720 };
  mapZoom = 5;
  zoomEndHandler = null;
  desktopViewportMatches = true;
  mapInstanceCount = 0;
  mediaChangeListeners.clear();
});

const model: JapanMapCanvasModel = {
  points: [
    { id: "port:yokohama", kind: "Port", label: "横浜港", lat: 35.44, lon: 139.67, tone: "critical" }
  ],
  routes: [],
  regions: [],
  globalPoints: [
    { id: "country:saudi-arabia", kind: "Country", label: "サウジアラビア", lat: 23.88, lon: 45.07, tone: "watch" },
    { id: "chokepoint:hormuz", kind: "Chokepoint", label: "ホルムズ海峡", lat: 26.56, lon: 56.25, tone: "critical" },
    { id: "country:japan", kind: "Country", label: "日本", lat: 36.2, lon: 138.25, tone: "watch" }
  ],
  globalRoutes: [
    {
      id: "flow:saudi-oil-japan",
      label: "サウジ原油 → 日本",
      pointIds: ["country:saudi-arabia", "chokepoint:hormuz", "country:japan"],
      relatedIds: ["flow:saudi-oil-japan", "route:gulf-to-japan", "chokepoint:hormuz", "country:saudi-arabia", "country:japan"]
    }
  ]
};

function detailedRoadModel(activeId = ""): JapanMapCanvasModel {
  const routeId = "live-logistics:road-keihin-tokyo";
  const coordinates: Array<[number, number]> = [
    [139.665, 35.417],
    [139.684, 35.493],
    [139.787, 35.52]
  ];
  const overlay = (
    id: string,
    visualKind: string,
    stateLabel: string,
    options: Partial<Record<string, string>> = {}
  ) => ({
    id,
    segmentId: "road-segment:test-a",
    routeId,
    label: stateLabel,
    roadName: "高速湾岸線",
    routeNumber: "B",
    direction: "東行き" as const,
    coordinates,
    selectionId: id.endsWith(":unknown") ? routeId : id,
    selected: activeId === id,
    recordType: visualKind === "unknown" ? "unknown" : options.recordType ?? "restriction",
    visualKind,
    condition: options.condition ?? null,
    restrictionKind: options.restrictionKind ?? null,
    lifecycle: options.lifecycle ?? "current",
    freshness: options.freshness ?? "current",
    dataPosture: options.dataPosture ?? "authorized-provider",
    stateLabel,
    disclosureLabel: options.disclosureLabel ?? "公式道路交通データ"
  });

  return {
    ...model,
    liveRoutePresentation: "static-logistics-modes",
    livePoints: [],
    liveRoutes: [],
    roadSegments: [
      {
        id: "road-segment:test-a",
        routeId,
        routeLabel: "横浜港から東京湾岸配送圏",
        label: "横浜港 → 川崎浮島JCT",
        roadName: "高速湾岸線",
        routeNumber: "B",
        direction: "東行き",
        coordinates,
        condition: "unknown",
        conditionIds: [],
        restrictionIds: [],
        sourceIds: ["source:osm"],
        selectionId: routeId,
        selected: activeId === routeId
      },
      {
        id: "road-segment:test-b",
        routeId,
        routeLabel: "横浜港から東京湾岸配送圏",
        label: "川崎浮島JCT → 東京湾岸配送圏",
        roadName: "高速湾岸線",
        routeNumber: "B",
        direction: "東行き",
        coordinates: [
          [139.787, 35.52],
          [139.868, 35.665]
        ],
        condition: "unknown",
        conditionIds: [],
        restrictionIds: [],
        sourceIds: ["source:osm"],
        selectionId: routeId,
        selected: activeId === routeId
      }
    ],
    roadOperationalOverlays: [
      overlay("road-condition:normal", "normal", "平常", { recordType: "condition", condition: "normal" }),
      overlay("road-condition:slow", "slow", "低速", { recordType: "condition", condition: "slow" }),
      overlay("road-condition:congestion", "congestion", "渋滞", { recordType: "condition", condition: "congestion" }),
      overlay("road-restriction:accident", "accident", "事故", { restrictionKind: "accident" }),
      overlay("road-restriction:construction", "construction", "工事例・期限切れ", {
        restrictionKind: "construction",
        freshness: "stale",
        dataPosture: "fixed-demo",
        disclosureLabel: "固定デモ / 現在情報ではありません"
      }),
      overlay("road-restriction:lane", "lane-restriction", "予定 車線規制例・期限切れ", {
        restrictionKind: "lane-restriction",
        lifecycle: "planned",
        freshness: "stale",
        dataPosture: "fixed-demo",
        disclosureLabel: "固定デモ / 現在情報ではありません"
      }),
      overlay("road-restriction:closure", "closure", "通行止", { restrictionKind: "closure" }),
      overlay("road-restriction:ended", "accident", "事故・終了", {
        restrictionKind: "accident",
        lifecycle: "ended"
      }),
      overlay("road-segment:test-a:unknown", "unknown", "状況不明", {
        freshness: "unavailable",
        disclosureLabel: "公式道路交通フィード未接続"
      })
    ],
    roadJunctions: [
      ["honmoku-futo", "横浜港", 139.665, 35.417],
      ["honmoku-jct", "本牧JCT", 139.681, 35.438],
      ["daikoku-jct", "大黒JCT", 139.684, 35.493],
      ["ukishima-jct", "川崎浮島JCT", 139.787, 35.52],
      ["oi-jct", "大井JCT", 139.76, 35.594],
      ["tatsumi-jct", "辰巳JCT", 139.814, 35.648],
      ["distribution", "東京湾岸配送圏", 139.868, 35.665]
    ].map(([id, label, lon, lat]) => ({
      id: `road-junction:${id}`,
      routeId,
      label: String(label),
      coordinates: [Number(lon), Number(lat)] as [number, number],
      sourceIds: ["source:osm"],
      selectionId: routeId,
      selected: activeId === routeId
    }))
  } as JapanMapCanvasModel;
}

function prefectureMetricRegions(): JapanMapCanvasModel["regions"] {
  return prefectureBoundaryCollection.features.map((feature, index) => ({
    id: feature.properties.entityId,
    label: feature.properties.label,
    lat: 24 + index * 0.5,
    lon: 123 + index * 0.5,
    geometryKind: "prefecture-boundary",
    prefectureCode: feature.properties.prefectureCode,
    value: index,
    rawValue: index * 1_000,
    unit: "トン",
    periodLabel: "令和5年産",
    sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
  }));
}

describe("map canvas layer config", () => {
  test("renders joined prefecture boundaries around the reference raster with an explicit selected treatment", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const source = addedSourceConfigs.get("jp-prefectures");
    const prefectures = addedSources.get("jp-prefectures") as {
      features: Array<{
        geometry: unknown;
        properties: { entityId: string; selected: boolean };
      }>;
    };
    const representativeRegions = addedSources.get("jp-regions") as { features: unknown[] };
    const prefectureLabels = addedSources.get("jp-prefecture-labels") as { features: unknown[] };
    const selectedPrefectureLabels = addedSources.get("jp-prefecture-selected-labels") as { features: unknown[] };
    const prefectureLeaders = addedSources.get("jp-prefecture-leaders") as { features: unknown[] };
    const fill = getAddedLayer("jp-prefecture-fill") as any;
    const outline = getAddedLayer("jp-prefecture-outline") as any;
    const selectedOutline = getAddedLayer("jp-prefecture-selected-outline") as any;
    const leaderLine = getAddedLayer("jp-prefecture-leader-line") as any;
    const label = getAddedLayer("jp-prefecture-label") as any;
    const selectedLabel = getAddedLayer("jp-prefecture-selected-label") as any;

    expect(source).toMatchObject({
      type: "geojson",
      attribution: "境界: Made with Natural Earth（加工）"
    });
    expect(prefectures.features).toHaveLength(47);
    expect(prefectureLabels.features).toHaveLength(47);
    expect(selectedPrefectureLabels.features).toHaveLength(1);
    expect(prefectureLeaders.features.length).toBeGreaterThan(0);
    expect(prefectures.features[0].geometry).toBe(prefectureBoundaryCollection.features[0].geometry);
    expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:tokyo")?.properties.selected).toBe(true);
    expect(representativeRegions.features).toEqual([]);
    expect(fill).toMatchObject({
      id: "jp-prefecture-fill",
      type: "fill",
      source: "jp-prefectures",
      minzoom: 3.2,
      maxzoom: 9
    });
    expect(outline).toMatchObject({
      id: "jp-prefecture-outline",
      type: "line",
      source: "jp-prefectures",
      minzoom: 3.2,
      maxzoom: 9
    });
    expect(selectedOutline).toMatchObject({
      id: "jp-prefecture-selected-outline",
      type: "line",
      source: "jp-prefectures",
      minzoom: 3.2,
      maxzoom: 9,
      filter: ["==", ["get", "selected"], true]
    });
    expect(leaderLine).toMatchObject({
      id: "jp-prefecture-leader-line",
      type: "line",
      source: "jp-prefecture-leaders",
      minzoom: 3.2,
      maxzoom: 9
    });
    expect(label).toMatchObject({
      id: "jp-prefecture-label",
      type: "symbol",
      source: "jp-prefecture-labels",
      minzoom: 3.2,
      maxzoom: 9,
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      }
    });
    expect(label.paint).toMatchObject({
      "text-halo-width": expect.any(Number),
      "text-halo-color": expect.any(String)
    });
    expect(selectedLabel).toMatchObject({
      id: "jp-prefecture-selected-label",
      type: "symbol",
      source: "jp-prefecture-selected-labels",
      minzoom: 9,
      filter: ["==", ["get", "selected"], true]
    });
    expect(selectedLabel).not.toHaveProperty("maxzoom");
    expect(getAddedLayerCall("jp-prefecture-fill")?.beforeId).toBe("gray-canvas-reference");
    expect(getAddedLayerCall("jp-prefecture-outline")?.beforeId).toBe("gray-canvas-reference");
    expect(getAddedLayerCall("jp-prefecture-leader-line")?.beforeId).toBe("jp-prefecture-selected-outline");
    expect(getAddedLayerCall("jp-prefecture-label")?.beforeId).toBe("jp-prefecture-selected-outline");
    expect(getAddedLayerCall("jp-prefecture-selected-outline")?.beforeId).toBeUndefined();
    expect(getAddedLayerCallIndex("jp-prefecture-leader-line")).toBeLessThan(getAddedLayerCallIndex("jp-prefecture-label"));
    expect(getAddedLayerCallIndex("jp-prefecture-label")).toBeLessThan(getAddedLayerCallIndex("jp-prefecture-selected-outline"));
    expect(getAddedLayerCallIndex("jp-prefecture-selected-outline")).toBeLessThan(getAddedLayerCallIndex("jp-prefecture-selected-label"));
    expect(getAddedLayerCallIndex("jp-prefecture-selected-outline")).toBeLessThan(
      getAddedLayerCallIndex("global-route-glow")
    );
  });

  test("keeps prefecture opacity stable through zoom 6.5 then fades every polygon layer to zero by zoom 9", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(getAddedLayer("jp-prefecture-selected-outline")).toBeDefined();
    });

    const fill = getAddedLayer("jp-prefecture-fill") as any;
    const outline = getAddedLayer("jp-prefecture-outline") as any;
    const selectedOutline = getAddedLayer("jp-prefecture-selected-outline") as any;
    const fillOpacity = fill.paint["fill-opacity"];

    expect(fillOpacity.slice(0, 4)).toEqual(["interpolate", ["linear"], ["zoom"], 3.2]);
    expect(fillOpacity[4]).toEqual(fillOpacity[6]);
    expect(fillOpacity.slice(5)).toEqual([6.5, fillOpacity[4], 9, 0]);
    expect(outline.paint["line-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      3.2,
      0.68,
      6.5,
      0.68,
      9,
      0
    ]);
    expect(selectedOutline.paint["line-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      3.2,
      1,
      6.5,
      1,
      9,
      0
    ]);
    expect(JSON.stringify(fill.paint["fill-color"])).toContain("selected");
    expect(selectedOutline.paint["line-width"]).toBeGreaterThan(outline.paint["line-width"]);
  });

  test("keeps prefecture selection in source state across the maxzoom boundary without a hidden interaction layer", async () => {
    const { rerender } = render(
      <JapanOperationsMapCanvas
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(getLayerHandler("click", "jp-prefecture-fill")).toBeDefined();
    });

    expect(lastMap?.getZoom()).toBe(5);
    expect(zoomEndHandler).not.toBeNull();
    mapZoom = 9.1;
    zoomEndHandler!();
    expect(lastMap?.getZoom()).toBe(9.1);

    rerender(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      const prefectures = addedSources.get("jp-prefectures") as {
        features: Array<{
          properties: {
            entityId: string;
            label: string;
            periodLabel: string | null;
            rawValue: number | null;
            selected: boolean;
            unit: string | null;
          };
        }>;
      };
      expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:tokyo")?.properties).toMatchObject({
        entityId: "prefecture:tokyo",
        label: "東京都",
        periodLabel: "令和5年産",
        rawValue: expect.any(Number),
        selected: true,
        unit: "トン"
      });
      expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:hokkaido")?.properties.selected).toBe(false);
    });

    const prefectureLayerIds = addedLayers
      .map((layer) => String(layer.id))
      .filter((id) => id.startsWith("jp-prefecture"));
    expect(prefectureLayerIds).toEqual([
      "jp-prefecture-fill",
      "jp-prefecture-outline",
      "jp-prefecture-leader-line",
      "jp-prefecture-label",
      "jp-prefecture-selected-outline",
      "jp-prefecture-selected-label"
    ]);
    expect(getAddedLayer("jp-prefecture-fill")).toMatchObject({ maxzoom: 9 });
    expect(getAddedLayer("jp-prefecture-selected-outline")).toMatchObject({
      maxzoom: 9,
      filter: ["==", ["get", "selected"], true]
    });
    expect(JSON.stringify((getAddedLayer("jp-prefecture-fill") as any).paint)).toContain("selected");
    expect(groupedRegistrations("click")[0].layerIds).toContain("jp-prefecture-fill");
    expect(groupedRegistrations("click")[0].layerIds).not.toContain("jp-prefecture-outline");
    expect(groupedRegistrations("click")[0].layerIds).not.toContain("jp-prefecture-selected-outline");
    expect(lastMap?.easeTo).not.toHaveBeenCalled();
    expect(lastMap?.fitBounds).not.toHaveBeenCalled();
  });

  test("applies region visibility consistently to prefecture boundaries and representative-radius layers", async () => {
    const canvasForMode = (mapMode: "choropleth" | "static" | "point" | "route" | "cluster") => (
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode={mapMode}
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );
    const { rerender } = render(canvasForMode("choropleth"));

    await waitFor(() => {
      expectRegionLayerVisibility("visible");
    });

    for (const [mapMode, expectedVisibility] of [
      ["point", "none"],
      ["static", "visible"],
      ["route", "none"],
      ["cluster", "none"]
    ] as const) {
      rerender(canvasForMode(mapMode));
      await waitFor(() => {
        expectRegionLayerVisibility(expectedVisibility);
      });
    }
  });

  test("preserves the camera when a prefecture-boundary selection receives focus", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId="prefecture:tokyo"
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(addedSources.get("jp-prefectures")).toBeDefined();
    });

    expect(lastMap?.easeTo).not.toHaveBeenCalled();
    expect(lastMap?.fitBounds).not.toHaveBeenCalled();
  });

  test("toggles the all-prefecture labels at the xl boundary without recreating the map", async () => {
    desktopViewportMatches = false;
    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(getLastLayoutVisibility("jp-prefecture-fill")).toBe("visible");
      expect(getLastLayoutVisibility("jp-prefecture-leader-line")).toBe("none");
      expect(getLastLayoutVisibility("jp-prefecture-label")).toBe("none");
      expect(getLastLayoutVisibility("jp-prefecture-selected-label")).toBe("none");
    });
    expect(mapInstanceCount).toBe(1);

    desktopViewportMatches = true;
    for (const listener of mediaChangeListeners) {
      listener({ matches: true });
    }

    await waitFor(() => {
      expect(getLastLayoutVisibility("jp-prefecture-leader-line")).toBe("visible");
      expect(getLastLayoutVisibility("jp-prefecture-label")).toBe("visible");
      expect(getLastLayoutVisibility("jp-prefecture-selected-label")).toBe("visible");
    });
    expect(mapInstanceCount).toBe(1);
  });

  test("owns read-only production diagnostics on the map container for exactly its lifecycle", async () => {
    const rendered = render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model, regions: prefectureMetricRegions() }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );
    const mapContainer = rendered.container.querySelector('[data-testid="jp-operations-map-canvas"]') as any;

    await waitFor(() => {
      expect(typeof mapContainer.__prefectureMapDiagnostics?.read).toBe("function");
    });
    expect(mapContainer.__prefectureMapDiagnostics.read([]).tilesLoaded).toBe(true);
    expect(lastMap?.areTilesLoaded).toHaveBeenCalled();
    expect(mapContainer.__prefectureMapDiagnostics?.setPrefectureValueNull).toBeUndefined();
    expect((window as any).__prefectureMapDiagnostics).toBeUndefined();

    rendered.unmount();
    expect(mapContainer.__prefectureMapDiagnostics).toBeUndefined();
  });

  test("does not resend prefecture boundaries for palette, mode, or value-equal model rerenders", async () => {
    const regions = prefectureMetricRegions();
    const canvasModel = { ...model, regions };
    const statusPalette = getStatusPalette();
    const themePalette = getThemePalette("rice");
    const alternateThemePalette = getThemePalette("water");
    const canvas = ({
      mapMode = "choropleth",
      nextModel = canvasModel,
      nextThemePalette = themePalette
    }: {
      mapMode?: "choropleth" | "static";
      nextModel?: JapanMapCanvasModel;
      nextThemePalette?: ReturnType<typeof getThemePalette>;
    } = {}) => (
      <JapanOperationsMapCanvas
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode={mapMode}
        model={nextModel}
        onSelect={vi.fn()}
        statusPalette={statusPalette}
        themePalette={nextThemePalette}
      />
    );
    const { rerender } = render(canvas());

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const setData = getSourceSetDataSpy("jp-prefectures");
    expect(setData).toBeDefined();
    const initialSetDataCount = setData!.mock.calls.length;
    const paintCallCount = lastMap!.setPaintProperty.mock.calls.length;

    rerender(canvas({ nextThemePalette: alternateThemePalette }));
    await waitFor(() => {
      expect(lastMap!.setPaintProperty.mock.calls.length).toBeGreaterThan(paintCallCount);
    });
    expect(setData).toHaveBeenCalledTimes(initialSetDataCount);

    const layoutCallCount = lastMap!.setLayoutProperty.mock.calls.length;
    rerender(canvas({ mapMode: "static", nextThemePalette: alternateThemePalette }));
    await waitFor(() => {
      expect(lastMap!.setLayoutProperty.mock.calls.length).toBeGreaterThan(layoutCallCount);
    });
    expect(setData).toHaveBeenCalledTimes(initialSetDataCount);

    const valueEqualModel = structuredClone(canvasModel) as JapanMapCanvasModel;
    const nextPaintCallCount = lastMap!.setPaintProperty.mock.calls.length;
    rerender(canvas({
      mapMode: "static",
      nextModel: valueEqualModel,
      nextThemePalette: alternateThemePalette
    }));
    await waitFor(() => {
      expect(lastMap!.setPaintProperty.mock.calls.length).toBeGreaterThan(nextPaintCallCount);
    });
    expect(setData).toHaveBeenCalledTimes(initialSetDataCount);
  });

  test("resends prefecture boundaries once for selection and once for content changes", async () => {
    const regions = prefectureMetricRegions();
    const canvasModel = { ...model, regions };
    const statusPalette = getStatusPalette();
    const themePalette = getThemePalette("rice");
    const canvas = (activeId: string, nextModel: JapanMapCanvasModel = canvasModel) => (
      <JapanOperationsMapCanvas
        activeId={activeId}
        focusTargetId={null}
        mapMode="choropleth"
        model={nextModel}
        onSelect={vi.fn()}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );
    const { rerender } = render(canvas("prefecture:hokkaido"));

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const setData = getSourceSetDataSpy("jp-prefectures")!;
    const initialSetDataCount = setData.mock.calls.length;
    rerender(canvas("prefecture:tokyo"));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 1);
    });

    let prefectures = addedSources.get("jp-prefectures") as {
      features: Array<{ properties: { entityId: string; selected: boolean } }>;
    };
    expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:tokyo")?.properties.selected).toBe(true);
    expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:hokkaido")?.properties.selected).toBe(false);

    const metricChangedModel = {
      ...canvasModel,
      regions: regions.map((region) => region.id === "prefecture:tokyo"
        ? {
            ...region,
            value: 88,
            rawValue: 888_000
          }
        : region)
    } as JapanMapCanvasModel;
    rerender(canvas("prefecture:tokyo", metricChangedModel));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 2);
    });

    const labelChangedModel = {
      ...metricChangedModel,
      regions: metricChangedModel.regions.map((region) => region.id === "prefecture:tokyo"
        ? { ...region, label: "東京都（更新）" }
        : region)
    } as JapanMapCanvasModel;
    rerender(canvas("prefecture:tokyo", labelChangedModel));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 3);
    });

    const metadataChangedModel = {
      ...labelChangedModel,
      regions: labelChangedModel.regions.map((region) => region.id === "prefecture:tokyo"
        ? {
            ...region,
            unit: "更新トン",
            periodLabel: "更新期",
            sourceIds: [...(region.sourceIds ?? []), "source:revision"]
          }
        : region)
    } as JapanMapCanvasModel;
    rerender(canvas("prefecture:tokyo", metadataChangedModel));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 4);
    });

    prefectures = addedSources.get("jp-prefectures") as typeof prefectures;
    expect(prefectures.features.find((feature) => feature.properties.entityId === "prefecture:tokyo")?.properties).toMatchObject({
      label: "東京都（更新）",
      periodLabel: "更新期",
      rawValue: 888_000,
      selected: true,
      sourceIds: expect.arrayContaining(["source:revision"]),
      unit: "更新トン",
      value: 88
    });
  });

  test("updates the prefecture source across empty and populated boundary transitions", async () => {
    const statusPalette = getStatusPalette();
    const themePalette = getThemePalette("rice");
    const canvas = (nextModel: JapanMapCanvasModel) => (
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={nextModel}
        onSelect={vi.fn()}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );
    const { rerender } = render(canvas(model));

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const setData = getSourceSetDataSpy("jp-prefectures")!;
    const initialSetDataCount = setData.mock.calls.length;
    const populatedModel = { ...model, regions: prefectureMetricRegions() };
    rerender(canvas(populatedModel));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 1);
    });
    expect((addedSources.get("jp-prefectures") as { features: unknown[] }).features).toHaveLength(47);

    rerender(canvas(model));
    await waitFor(() => {
      expect(setData).toHaveBeenCalledTimes(initialSetDataCount + 2);
    });
    expect((addedSources.get("jp-prefectures") as { features: unknown[] }).features).toEqual([]);
  });

  test("keeps representative-radius circles separate from joined prefecture boundaries", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="basin:kanto"
        focusTargetId={null}
        mapMode="choropleth"
        model={{
          ...model,
          regions: [
            ...prefectureMetricRegions(),
            {
              id: "basin:kanto",
              label: "関東流域",
              lat: 36,
              lon: 139,
              geometryKind: "representative-radius",
              value: 60,
              rawValue: 60
            }
          ]
        }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("water")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const prefectures = addedSources.get("jp-prefectures") as {
      features: Array<{ geometry: { type: string }; properties: { entityId: string } }>;
    };
    const representativeRegions = addedSources.get("jp-regions") as {
      features: Array<{ geometry: { type: string }; properties: { id: string } }>;
    };

    expect(prefectures.features).toHaveLength(47);
    expect(prefectures.features.every((feature) => feature.properties.entityId.startsWith("prefecture:"))).toBe(true);
    expect(representativeRegions.features).toHaveLength(1);
    expect(representativeRegions.features[0]).toMatchObject({
      geometry: { type: "Polygon" },
      properties: { id: "basin:kanto" }
    });
    expect(representativeRegions.features.some((feature) => feature.properties.id.startsWith("prefecture:"))).toBe(false);
  });

  test("keeps every prefecture label source empty for representative-radius-only choropleths", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="reservoir:ogouchi"
        focusTargetId={null}
        mapMode="choropleth"
        model={{
          ...model,
          regions: [{
            id: "reservoir:ogouchi",
            label: "小河内貯水池",
            lat: 35.79,
            lon: 139.05,
            geometryKind: "representative-radius",
            value: 77,
            rawValue: 77,
            unit: "%",
            periodLabel: "現在"
          }]
        }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("water")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("jp-prefecture-labels")).toBe(true);
    });

    for (const sourceId of [
      "jp-prefecture-labels",
      "jp-prefecture-selected-labels",
      "jp-prefecture-leaders"
    ]) {
      expect(addedSources.get(sourceId), sourceId).toEqual({
        type: "FeatureCollection",
        features: []
      });
    }

    for (const layerId of [
      "jp-prefecture-label",
      "jp-prefecture-selected-label",
      "jp-prefecture-leader-line"
    ]) {
      const layer = getAddedLayer(layerId) as { source: string };
      const source = addedSources.get(layer.source) as { features: unknown[] };
      expect(source.features, layerId).toEqual([]);
    }
  });

  test("keeps global relationship lines available when zooming into Japan", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="point"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => {
      expect(addedLayers.length).toBeGreaterThan(0);
    });

    const routeLayer = addedLayers.find((layer) => layer.id === "global-route-line");
    const pointLayer = addedLayers.find((layer) => layer.id === "global-point-circle");

    expect(routeLayer).toBeTruthy();
    expect(routeLayer).not.toHaveProperty("maxzoom");
    expect(pointLayer).toBeTruthy();
    expect(pointLayer).not.toHaveProperty("maxzoom");
  });

  test("strengthens non-selected global routes in route mode so they stay legible", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="observation:lng-electricity-april-2026"
        focusTargetId={null}
        mapMode="route"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => {
      expect(addedLayers.length).toBeGreaterThan(0);
    });

    const routeLayer = addedLayers.find((layer) => layer.id === "global-route-line") as any;
    const glowLayer = addedLayers.find((layer) => layer.id === "global-route-glow") as any;
    expect(routeLayer).toBeTruthy();
    expect(glowLayer).toBeTruthy();
    expect(glowLayer.paint["line-blur"]).toBeTruthy();
    expect(routeLayer.paint["line-dasharray"]).toEqual([0.22, 1.35]);
    expect(routeLayer.paint["line-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["boolean", ["get", "selected"], false], 0.98, 0.88],
      6,
      ["case", ["boolean", ["get", "selected"], false], 0.95, 0.8],
      10,
      ["case", ["boolean", ["get", "selected"], false], 0.92, 0.72]
    ]);
  });

  test("uses zoom expressions that MapLibre accepts for global route styling", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="route"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => {
      expect(addedLayers.length).toBeGreaterThan(0);
    });

    const routeLayer = addedLayers.find((layer) => layer.id === "global-route-line") as any;
    const pointLayer = addedLayers.find((layer) => layer.id === "global-point-circle") as any;

    expect(routeLayer.paint["line-width"][0]).toBe("interpolate");
    expect(routeLayer.paint["line-opacity"][0]).toBe("interpolate");
    expect(pointLayer.paint["circle-radius"][0]).toBe("interpolate");
  });

  test("marks global routes as selected when the active item is a chokepoint on that route", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="chokepoint:hormuz"
        focusTargetId={null}
        mapMode="route"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("global-routes")).toBe(true);
    });

    const globalRoutes = addedSources.get("global-routes") as {
      features: Array<{ properties: { id: string; selected: boolean } }>;
    };

    expect(globalRoutes.features[0].properties.id).toBe("flow:saudi-oil-japan");
    expect(globalRoutes.features[0].properties.selected).toBe(true);
  });

  test("marks global routes as selected when the active item is the sealanes entity behind that route", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="route:gulf-to-japan"
        focusTargetId={null}
        mapMode="point"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("global-routes")).toBe(true);
    });

    const globalRoutes = addedSources.get("global-routes") as {
      features: Array<{ properties: { id: string; selected: boolean } }>;
    };

    expect(globalRoutes.features[0].properties.id).toBe("flow:saudi-oil-japan");
    expect(globalRoutes.features[0].properties.selected).toBe(true);
  });

  test("renders four logistics modes with independent patterns and Japanese labels without visible scanner copy", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="route"
        model={
          {
            ...model,
            liveRoutePresentation: "static-logistics-modes",
            livePoints: [
              { id: "point:a", kind: "Port", label: "起点", lat: 35.44, lon: 139.67, tone: "critical" },
              { id: "point:b", kind: "Region", label: "終点", lat: 35.68, lon: 139.82, tone: "watch" }
            ],
            liveRoutes: [
              {
                id: "live-logistics:road-test",
                label: "道路代表経路",
                laneId: "road",
                modeLabel: "道路",
                pointIds: ["point:a", "point:b"],
                relatedIds: [],
                selectionId: "live-logistics:road-test",
                selected: false
              },
              {
                id: "live-logistics:rail-test",
                label: "鉄道代表経路",
                laneId: "rail",
                modeLabel: "鉄道",
                pointIds: ["point:a", "point:b"],
                relatedIds: [],
                selectionId: "live-logistics:rail-test",
                selected: false
              },
              {
                id: "live-logistics:coastal-test",
                label: "内航代表経路",
                laneId: "coastal",
                modeLabel: "内航",
                pointIds: ["point:a", "point:b"],
                relatedIds: [],
                selectionId: "live-logistics:coastal-test",
                selected: false
              },
              {
                id: "live-logistics:air-test",
                label: "羽田 → 福岡",
                laneId: "air",
                modeLabel: "航空",
                pointIds: ["point:a", "point:b"],
                relatedIds: [],
                selectionId: "live-logistics:air-test",
                selected: false
              },
              {
                id: "live-logistics:air-airport-ops",
                label: "羽田・成田 空港運用",
                laneId: "air",
                modeLabel: "航空",
                pointIds: ["point:a", "point:b"],
                relatedIds: [],
                selectionId: "live-logistics:air-airport-ops",
                selected: false
              }
            ]
          } as JapanMapCanvasModel
        }
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("live-logistics-routes")).toBe(true);
    });

    const modeLayers = ["road", "rail", "coastal", "air"].map((mode) => ({
      line: getAddedLayer(`live-logistics-${mode}-line`) as any,
      label: getAddedLayer(`live-logistics-${mode}-label`) as any,
      mode
    }));
    const liveRoutes = addedSources.get("live-logistics-routes") as {
      features: Array<{ properties: { id: string; label: string; laneId: string; modeLabel: string; selected: boolean; selectionId: string } }>;
    };

    expect(modeLayers.map(({ line }) => line.filter)).toEqual([
      ["==", ["get", "laneId"], "road"],
      ["==", ["get", "laneId"], "rail"],
      ["==", ["get", "laneId"], "coastal"],
      ["==", ["get", "laneId"], "air"]
    ]);
    expect(modeLayers.map(({ line }) => line.paint["line-dasharray"])).toEqual([
      undefined,
      [1.5, 1],
      [0.25, 1.25],
      [4, 2]
    ]);
    expect(modeLayers.map(({ label }) => label.layout["text-field"])).toEqual([
      ["concat", "◆ ", ["get", "modeLabel"], " / ", ["get", "label"]],
      ["concat", "╫ ", ["get", "modeLabel"], " / ", ["get", "label"]],
      ["concat", "≈ ", ["get", "modeLabel"], " / ", ["get", "label"]],
      ["concat", "✈ ", ["get", "modeLabel"], " / ", ["get", "label"]]
    ]);
    expect(getLastLayoutVisibility("live-logistics-route-glow")).toBe("none");
    expect(getLastLayoutVisibility("live-logistics-route-pulse")).toBe("none");
    expect(getLastLayoutVisibility("live-logistics-route-label")).toBe("none");
    expect(getLastLayoutVisibility("live-logistics-road-line")).toBe("visible");
    expect(liveRoutes.features.map((feature) => feature.properties)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "live-logistics:road-test", laneId: "road", modeLabel: "道路" }),
      expect.objectContaining({ id: "live-logistics:rail-test", laneId: "rail", modeLabel: "鉄道" }),
      expect.objectContaining({ id: "live-logistics:coastal-test", laneId: "coastal", modeLabel: "内航" }),
      expect.objectContaining({ id: "live-logistics:air-test", laneId: "air", modeLabel: "航空" })
    ]));
    expect(liveRoutes.features
      .filter((feature) => feature.properties.laneId === "air")
      .map((feature) => feature.properties.label)).toEqual([
      "羽田 → 福岡",
      "羽田・成田 空港運用"
    ]);
    expect(liveRoutes.features.every((feature) => feature.properties.selected === false)).toBe(true);
  });

  test("preserves the animated tracking treatment for Energy tanker routes", async () => {
    const animationSpy = vi.spyOn(window, "requestAnimationFrame");
    render(
      <JapanOperationsMapCanvas
        activeId="live-logistics:tanker-saudi-tokyo-bay"
        focusTargetId={null}
        mapMode="route"
        model={{
          ...model,
          liveRoutePresentation: "animated-tracking",
          livePoints: [
            { id: "country:saudi-arabia", kind: "Country", label: "サウジアラビア", lat: 23.88, lon: 45.07, tone: "watch" },
            { id: "port:yokohama", kind: "Port", label: "横浜港", lat: 35.44, lon: 139.67, tone: "critical" }
          ],
          liveRoutes: [
            {
              id: "live-logistics:tanker-saudi-tokyo-bay",
              label: "タンカー航路",
              laneId: "maritime",
              modeLabel: "海上",
              pointIds: ["country:saudi-arabia", "port:yokohama"],
              relatedIds: ["flow:saudi-oil-japan"],
              selectionId: "live-logistics:tanker-saudi-tokyo-bay",
              selected: true
            }
          ]
        }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
      />
    );

    await waitFor(() => expect(addedSources.has("live-logistics-routes")).toBe(true));
    expect(getAddedLayer("live-logistics-route-glow")).toMatchObject({
      type: "line",
      source: "live-logistics-routes"
    });
    expect(getAddedLayer("live-logistics-route-pulse")).toMatchObject({
      type: "line",
      source: "live-logistics-routes"
    });
    expect((getAddedLayer("live-logistics-route-label") as any).layout["text-field"]).toBe("SCAN");
    expect(getLastLayoutVisibility("live-logistics-route-label")).toBe("visible");
    expect(getLastLayoutVisibility("live-logistics-maritime-support-line")).toBe("none");
    expect(animationSpy).toHaveBeenCalled();
    animationSpy.mockRestore();
  });

  test("renders detailed road bases, operational semantics, and junctions as separate interactive sources", async () => {
    const onSelect = vi.fn();
    render(
      <JapanOperationsMapCanvas
        activeId="road-restriction:construction"
        focusTargetId={null}
        mapMode="route"
        model={detailedRoadModel("road-restriction:construction")}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("logistics-road-segments")).toBe(true);
      expect(addedSources.has("logistics-road-operations")).toBe(true);
      expect(addedSources.has("logistics-road-junctions")).toBe(true);
    });

    expect(addedSourceConfigs.get("logistics-road-segments")).toMatchObject({
      type: "geojson",
      attribution: "© OpenStreetMap contributors"
    });
    const base = addedSources.get("logistics-road-segments") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    const operations = addedSources.get("logistics-road-operations") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    const junctions = addedSources.get("logistics-road-junctions") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    expect(base.features[0].properties).toMatchObject({
      id: "road-segment:test-a",
      routeId: "live-logistics:road-keihin-tokyo",
      selectionId: "live-logistics:road-keihin-tokyo",
      label: "横浜港 → 川崎浮島JCT",
      roadName: "高速湾岸線",
      routeNumber: "B",
      direction: "東行き",
      selected: false
    });
    expect(operations.features.find((feature) => feature.properties.id === "road-restriction:construction")?.properties).toMatchObject({
      segmentId: "road-segment:test-a",
      routeId: "live-logistics:road-keihin-tokyo",
      selectionId: "road-restriction:construction",
      recordType: "restriction",
      restrictionKind: "construction",
      lifecycle: "current",
      freshness: "stale",
      dataPosture: "fixed-demo",
      stateLabel: "工事例・期限切れ",
      disclosureLabel: "固定デモ / 現在情報ではありません",
      selected: true
    });
    expect(operations.features.find((feature) => feature.properties.visualKind === "unknown")?.properties).toMatchObject({
      selectionId: "live-logistics:road-keihin-tokyo",
      freshness: "unavailable",
      stateLabel: "状況不明"
    });
    expect(junctions.features.map((feature) => feature.properties.label)).toEqual([
      "横浜港",
      "本牧JCT",
      "大黒JCT",
      "川崎浮島JCT",
      "大井JCT",
      "辰巳JCT",
      "東京湾岸配送圏"
    ]);

    expect(getAddedLayer("logistics-road-base-line")).toMatchObject({
      type: "line",
      source: "logistics-road-segments"
    });
    const expectedDashes: Record<string, unknown> = {
      normal: undefined,
      slow: [2, 1.5],
      congestion: [0.75, 0.5],
      accident: [2, 1],
      construction: [1, 1],
      "lane-restriction": [2.5, 1],
      closure: [0.5, 0.5],
      unknown: [0.25, 1.25]
    };
    for (const [visualKind, dash] of Object.entries(expectedDashes)) {
      const layer = getAddedLayer(`logistics-road-operation-${visualKind}`) as any;
      expect(layer.filter).toEqual(["==", ["get", "visualKind"], visualKind]);
      expect(layer.paint["line-dasharray"]).toEqual(dash);
      expect(layer.paint["line-opacity"]).toEqual([
        "case",
        ["==", ["get", "lifecycle"], "ended"],
        0.28,
        ["==", ["get", "freshness"], "stale"],
        0.46,
        0.9
      ]);
    }
    expect(getAddedLayer("logistics-road-operation-planned-outline")).toMatchObject({
      filter: ["==", ["get", "lifecycle"], "planned"]
    });
    expect((getAddedLayer("logistics-road-operation-symbol") as any).layout["text-field"]).toEqual([
      "match",
      ["get", "visualKind"],
      "accident", "!",
      "construction", "◆",
      "lane-restriction", "|",
      "closure", "×",
      ""
    ]);
    expect((getAddedLayer("logistics-road-operation-label") as any).layout["text-field"]).toBe("{stateLabel}");
    expect(getAddedLayer("logistics-road-junction-label")).toMatchObject({
      type: "symbol",
      source: "logistics-road-junctions"
    });

    for (const layerId of [
      "logistics-road-base-line",
      "logistics-road-direction",
      "logistics-road-operation-hit",
      "logistics-road-operation-label",
      "logistics-road-operation-symbol",
      "logistics-road-junction-label"
    ]) {
      expect(getLayerHandler("click", layerId), layerId).toBeDefined();
    }
    getLayerHandler("click", "logistics-road-base-line")?.({
      features: [{ properties: base.features[0].properties }],
      point: { x: 300, y: 200 }
    });
    getLayerHandler("click", "logistics-road-operation-hit")?.({
      features: [{ properties: operations.features[4].properties }],
      point: { x: 700, y: 200 }
    });
    expect(onSelect).toHaveBeenNthCalledWith(1, "live-logistics:road-keihin-tokyo", {
      placement: "right", x: 300, y: 200
    });
    expect(onSelect).toHaveBeenNthCalledWith(2, operations.features[4].properties.selectionId, {
      placement: "left", x: 700, y: 200
    });
  });

  test("renders eastbound and westbound road direction semantics from base segment data", async () => {
    const onSelect = vi.fn();
    const directionModel = detailedRoadModel();
    const eastbound = directionModel.roadSegments![0];
    directionModel.roadSegments = [
      eastbound,
      {
        ...eastbound,
        id: "road-segment:test-west",
        routeId: "live-logistics:road-west-test",
        routeLabel: "東京湾岸配送圏から横浜港",
        label: "東京湾岸配送圏 → 横浜港",
        direction: "西行き",
        coordinates: [...eastbound.coordinates].reverse(),
        conditionIds: [],
        restrictionIds: [],
        selectionId: "live-logistics:road-west-test",
        selected: false
      }
    ];

    render(
      <JapanOperationsMapCanvas
        activeId=""
        focusTargetId={null}
        mapMode="route"
        model={directionModel}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );
    await waitFor(() => expect(addedSources.has("logistics-road-segments")).toBe(true));

    const base = addedSources.get("logistics-road-segments") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    expect(base.features.map((feature) => feature.properties.direction)).toEqual(["東行き", "西行き"]);
    expect(base.features.every((feature) => feature.properties.selected === false)).toBe(true);
    const directionLayer = getAddedLayer("logistics-road-direction") as any;
    expect(directionLayer).toMatchObject({
      type: "symbol",
      source: "logistics-road-segments"
    });
    expect(directionLayer.layout).toMatchObject({
      "symbol-placement": "line",
      "text-field": [
        "concat",
        ["get", "direction"],
        " ",
        [
          "match",
          ["get", "direction"],
          "東行き", "→",
          "西行き", "←",
          "北行き", "↑",
          "南行き", "↓",
          "上り", "↗",
          "下り", "↙",
          "内回り", "↻",
          "外回り", "↺",
          "→"
        ]
      ]
    });
    expect(getLastLayoutVisibility("logistics-road-direction")).toBe("visible");
    expect(getLayerHandler("click", "logistics-road-direction")).toBeDefined();
    getLayerHandler("click", "logistics-road-direction")?.({
      features: [{ properties: base.features[1].properties }],
      point: { x: 300, y: 200 }
    });
    expect(onSelect).toHaveBeenCalledWith("live-logistics:road-west-test", {
      placement: "right", x: 300, y: 200
    });
  });

  test("updates detailed sources, toggles them with route visibility, and preserves explicit unselected state", async () => {
    const { rerender } = render(
      <JapanOperationsMapCanvas
        activeId=""
        focusTargetId={null}
        mapMode="cluster"
        model={detailedRoadModel()}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );
    await waitFor(() => expect(addedSources.has("logistics-road-segments")).toBe(true));

    const base = addedSources.get("logistics-road-segments") as {
      features: Array<{ properties: { selected: boolean } }>;
    };
    const operations = addedSources.get("logistics-road-operations") as {
      features: Array<{ properties: { selected: boolean } }>;
    };
    expect(base.features.every((feature) => feature.properties.selected === false)).toBe(true);
    expect(operations.features.every((feature) => feature.properties.selected === false)).toBe(true);
    for (const layerId of [
      "logistics-road-base-line",
      "logistics-road-direction",
      "logistics-road-operation-hit",
      "logistics-road-operation-label",
      "logistics-road-junction-label",
      "live-logistics-road-line",
      "live-logistics-rail-line",
      "live-logistics-coastal-line",
      "live-logistics-air-line"
    ]) {
      expect(getLastLayoutVisibility(layerId), layerId).toBe("none");
    }

    rerender(
      <JapanOperationsMapCanvas
        activeId="live-logistics:road-keihin-tokyo"
        focusTargetId={null}
        mapMode="route"
        model={detailedRoadModel("live-logistics:road-keihin-tokyo")}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );
    await waitFor(() => {
      expect(sourceSetDataSpies.get("logistics-road-segments")).toHaveBeenCalled();
      expect(getLastLayoutVisibility("logistics-road-base-line")).toBe("visible");
    });
    const updatedBase = addedSources.get("logistics-road-segments") as {
      features: Array<{ properties: { selected: boolean } }>;
    };
    expect(updatedBase.features.every((feature) => feature.properties.selected === true)).toBe(true);
  });

  test("fits all segment coordinates for a selected detailed road route or event", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="road-restriction:construction"
        focusTargetId="road-restriction:construction"
        mapMode="route"
        model={detailedRoadModel("road-restriction:construction")}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );
    await waitFor(() => expect(lastMap?.fitBounds).toHaveBeenCalled());
    expect(lastMap?.fitBounds.mock.calls.at(-1)?.[0]).toEqual([
      [139.665, 35.417],
      [139.868, 35.665]
    ]);
  });

  test("does not start route scan animation for a detailed logistics road model", async () => {
    const animationSpy = vi.spyOn(window, "requestAnimationFrame");
    render(
      <JapanOperationsMapCanvas
        activeId=""
        focusTargetId={null}
        mapMode="route"
        model={detailedRoadModel()}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );
    await waitFor(() => expect(addedSources.has("logistics-road-segments")).toBe(true));
    expect(animationSpy).not.toHaveBeenCalled();
    animationSpy.mockRestore();
  });

  test("renders logistics impact corridors as filled polygons instead of route-only dotted lines", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="live-logistics:road-keihin-tokyo"
        focusTargetId={null}
        mapMode="route"
        model={
          {
            ...model,
            logisticsImpactCorridors: [
              {
                id: "corridor-band:tomei-shin-tomei-meishin",
                kind: "highway",
                label: "東名・新東名・名神 物流帯",
                selectionId: "live-logistics:road-keihin-tokyo",
                value: 92,
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [139.66, 35.48],
                      [138.4, 35.0],
                      [136.9, 35.2],
                      [135.5, 34.7],
                      [135.45, 34.55],
                      [136.85, 35.05],
                      [138.35, 34.85],
                      [139.72, 35.36],
                      [139.66, 35.48]
                    ]
                  ]
                }
              }
            ],
            logisticsImpactRoutes: [
              {
                id: "live-logistics:road-keihin-tokyo",
                label: "陸路: 横浜港 → 首都圏配送",
                pointIds: ["port:yokohama"],
                relatedIds: ["flow:japan-linked-maritime-watch"]
              }
            ]
          } as JapanMapCanvasModel
        }
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("logistics-impact-corridors")).toBe(true);
    });

    const corridorSource = addedSources.get("logistics-impact-corridors") as {
      features: Array<{ geometry: { type: string }; properties: { selected: boolean; kind: string } }>;
    };
    const fillLayer = addedLayers.find((layer) => layer.id === "logistics-impact-corridor-fill") as any;
    const routeLine = addedLayers.find((layer) => layer.id === "logistics-impact-route-line") as any;
    const liveRoadLayer = addedLayers.find((layer) => layer.id === "live-logistics-road-line") as any;

    expect(corridorSource.features[0].geometry.type).toBe("Polygon");
    expect(corridorSource.features[0].properties.selected).toBe(true);
    expect(corridorSource.features[0].properties.kind).toBe("highway");
    expect(fillLayer).toMatchObject({
      id: "logistics-impact-corridor-fill",
      type: "fill",
      source: "logistics-impact-corridors"
    });
    expect(routeLine.paint["line-opacity"]).toBeLessThanOrEqual(0.2);
    expect(routeLine.paint["line-dasharray"]).toBeUndefined();
    expect(liveRoadLayer.paint["line-opacity"]).toEqual([
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      0.12,
      6,
      0.1,
      10,
      0.08
    ]);
  });

  test("adds live tanker position markers that select the individual tanker item", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="live-logistics:tanker-qatar-tokyo-bay"
        focusTargetId={null}
        mapMode="route"
        model={
          {
            ...model,
            liveVessels: [
              {
                id: "live-vessel:tanker-qatar-tokyo-bay",
                kind: "AIS supporting context",
                label: "AIS tanker 042",
                lat: 12.4,
                lon: 110.8,
                selectionId: "live-logistics:tanker-qatar-tokyo-bay",
                tone: "watch"
              }
            ]
          } as JapanMapCanvasModel
        }
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("live-vessels")).toBe(true);
    });

    const markerLayer = addedLayers.find((layer) => layer.id === "live-vessel-marker") as any;
    const labelLayer = addedLayers.find((layer) => layer.id === "live-vessel-label") as any;
    const liveVessels = addedSources.get("live-vessels") as {
      features: Array<{ properties: { id: string; kind: string; label: string; selectionId: string; selected: boolean } }>;
    };

    expect(markerLayer).toBeTruthy();
    expect(markerLayer.source).toBe("live-vessels");
    expect(markerLayer.paint["circle-color"]).toBe(getStatusPalette().selected);
    expect(labelLayer).toBeTruthy();
    expect(liveVessels.features[0].properties).toMatchObject({
      id: "live-vessel:tanker-qatar-tokyo-bay",
      kind: "AIS supporting context",
      label: "AIS tanker 042",
      selectionId: "live-logistics:tanker-qatar-tokyo-bay",
      selected: true
    });
  });

  test("passes a popup anchor when a live tanker marker is clicked", async () => {
    const onSelect = vi.fn();

    render(
      <JapanOperationsMapCanvas
        activeId="live-logistics:tanker-qatar-tokyo-bay"
        focusTargetId={null}
        mapMode="route"
        model={
          {
            ...model,
            liveVessels: [
              {
                id: "live-vessel:tanker-qatar-tokyo-bay",
                kind: "AIS supporting context",
                label: "AIS tanker 042",
                lat: 12.4,
                lon: 110.8,
                selectionId: "live-logistics:tanker-qatar-tokyo-bay",
                tone: "watch"
              }
            ]
          } as JapanMapCanvasModel
        }
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(getLayerHandler("click", "live-vessel-halo")).toBeDefined();
      expect(getLayerHandler("click", "live-vessel-label")).toBeDefined();
      expect(getLayerHandler("click", "live-vessel-marker")).toBeDefined();
    });

    getLayerHandler("click", "live-vessel-halo")?.({
      features: [{ properties: { selectionId: "live-logistics:tanker-qatar-tokyo-bay" } }],
      point: { x: 900, y: 280 }
    });

    expect(onSelect).toHaveBeenCalledWith("live-logistics:tanker-qatar-tokyo-bay", {
      placement: "left",
      x: 900,
      y: 280
    });
  });

  test("scales selection fit padding to the mobile map viewport", async () => {
    mapCanvasSize = { width: 390, height: 420 };

    render(
      <JapanOperationsMapCanvas
        activeId="flow:saudi-oil-japan"
        focusTargetId="flow:saudi-oil-japan"
        mapMode="route"
        model={model}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(lastMap?.fitBounds).toHaveBeenCalled();
    });

    expect(lastMap?.fitBounds.mock.calls.at(-1)?.[1].padding).toEqual({
      top: 67,
      right: 46,
      bottom: 84,
      left: 46
    });
  });

  test("emits formatted semantic region hover data without selecting and clears it on leave", async () => {
    const onHover = vi.fn();
    const onSelect = vi.fn();

    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode="choropleth"
        model={{
          ...model,
          regions: prefectureMetricRegions().map((region) => region.id === "prefecture:niigata"
            ? { ...region, value: 100, rawValue: 514100 }
            : region)
        }}
        onHover={onHover}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(getLayerHandler("mousemove", "jp-prefecture-fill")).toBeDefined();
    });

    const regions = addedSources.get("jp-prefectures") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    const niigata = regions.features.find((feature) => feature.properties.entityId === "prefecture:niigata")!;
    expect(niigata.properties).toMatchObject({
      id: "prefecture:niigata",
      entityId: "prefecture:niigata",
      label: "新潟県",
      selected: false,
      value: 100,
      rawValue: 514100,
      unit: "トン",
      periodLabel: "令和5年産"
    });

    getLayerHandler("mousemove", "jp-prefecture-fill")?.({
      features: [{ properties: niigata.properties }],
      point: { x: 432.4, y: 218.7 }
    });

    expect(onHover).toHaveBeenLastCalledWith({
      selectionId: "prefecture:niigata",
      label: "新潟県",
      valueLabel: "514,100",
      unitLabel: "トン",
      periodLabel: "令和5年産",
      x: 432,
      y: 219
    });
    expect(onSelect).not.toHaveBeenCalled();

    getLayerHandler("mouseleave", "jp-prefecture-fill")?.();
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test("keeps a missing region neutral and distinct from a zero-valued metric", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode="choropleth"
        model={{
          ...model,
          regions: prefectureMetricRegions().map((region) => {
            if (region.id === "prefecture:niigata") {
              const { rawValue: _rawValue, ...regionWithoutRawValue } = region;
              return { ...regionWithoutRawValue, value: null };
            }
            if (region.id === "prefecture:hokkaido") {
              return { ...region, value: 0, rawValue: 0 };
            }
            return region;
          })
        }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("jp-prefectures")).toBe(true);
    });

    const regions = addedSources.get("jp-prefectures") as {
      features: Array<{ geometry: unknown; properties: Record<string, unknown> }>;
    };
    const niigata = regions.features.find((feature) => feature.properties.entityId === "prefecture:niigata")!;
    const hokkaido = regions.features.find((feature) => feature.properties.entityId === "prefecture:hokkaido")!;
    const regionFill = getAddedLayer("jp-prefecture-fill") as any;
    const regionOutline = getAddedLayer("jp-prefecture-outline") as any;
    const selectedOutline = getAddedLayer("jp-prefecture-selected-outline") as any;

    expect(niigata.properties).toMatchObject({ rawValue: null, value: null });
    expect(hokkaido.properties).toMatchObject({ rawValue: 0, value: 0 });
    expect(niigata.geometry).not.toEqual(hokkaido.geometry);
    expect(JSON.stringify(regionFill.paint["fill-color"])).toContain("value");
    expect(JSON.stringify(regionFill.paint["fill-color"])).toContain("selected");
    expect(JSON.stringify(regionFill.paint["fill-opacity"])).toContain("value");
    expect(selectedOutline.paint["line-width"]).toBeGreaterThan(regionOutline.paint["line-width"]);
  });

  test("registers one grouped interaction lifecycle for all semantic feature layers", async () => {
    const { unmount } = render(
      <JapanOperationsMapCanvas
        activeId="prefecture:tokyo"
        focusTargetId={null}
        mapMode="choropleth"
        model={model}
        onHover={vi.fn()}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(groupedRegistrations("mousemove")).toHaveLength(1);
    });

    const groupedLayers = groupedRegistrations("mousemove")[0].layerIds;
    expect(groupedLayers).toEqual(expect.arrayContaining([
      "jp-prefecture-fill",
      "jp-region-fill",
      "global-route-glow",
      "logistics-impact-region-fill",
      "logistics-impact-corridor-fill",
      "live-vessel-marker"
    ]));
    expect(groupedRegistrations("mouseenter")).toHaveLength(1);
    expect(groupedRegistrations("mouseleave")).toHaveLength(1);
    expect(groupedRegistrations("click")).toHaveLength(1);
    expect(groupedLayers).not.toContain("jp-cluster-circle");
    expect(getRegistrations("mousemove").some((registration) => registration.layerIds.includes("jp-cluster-circle"))).toBe(false);
    expect(getRegistrations("click").filter((registration) => registration.layerIds.includes("jp-cluster-circle"))).toHaveLength(1);

    const groupedSubscriptions = registeredLayerHandlers.filter((registration) => registration.layerIds.length > 1);
    unmount();
    expect(groupedSubscriptions.every((registration) => registration.unsubscribe.mock.calls.length === 1)).toBe(true);
  });

  test("restores the cluster pointer affordance with stable handlers and off cleanup", async () => {
    const { unmount } = render(
      <JapanOperationsMapCanvas
        activeId="port:yokohama"
        focusTargetId={null}
        mapMode="cluster"
        model={model}
        onHover={vi.fn()}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(getClusterCursorRegistration("mouseenter")).toBeDefined();
      expect(getClusterCursorRegistration("mouseleave")).toBeDefined();
    });

    const enter = getClusterCursorRegistration("mouseenter")!;
    const leave = getClusterCursorRegistration("mouseleave")!;
    enter.handler();
    expect(lastMap?.getCanvas().style.cursor).toBe("pointer");
    leave.handler();
    expect(lastMap?.getCanvas().style.cursor).toBe("");

    expect(groupedRegistrations("mouseenter")).toHaveLength(1);
    expect(groupedRegistrations("mouseleave")).toHaveLength(1);
    expect(groupedRegistrations("mousemove")).toHaveLength(1);
    expect(groupedRegistrations("click")).toHaveLength(1);
    expect(getLayerHandler("mousemove", "jp-cluster-circle")).toBeUndefined();

    unmount();
    expect(lastMap?.off).toHaveBeenCalledWith("mouseenter", "jp-cluster-circle", enter.handler);
    expect(lastMap?.off).toHaveBeenCalledWith("mouseleave", "jp-cluster-circle", leave.handler);
  });

  test("hovers and selects a logistics impact region through the shared handlers", async () => {
    const onHover = vi.fn();
    const onSelect = vi.fn();

    render(
      <JapanOperationsMapCanvas
        activeId="prefecture:aichi"
        focusTargetId={null}
        mapMode="choropleth"
        model={{
          ...model,
          logisticsImpactRegions: [
            {
              id: "prefecture:tokyo",
              label: "東京都",
              lat: 35.6762,
              lon: 139.6503,
              geometryKind: "representative-radius",
              value: 92,
              rawValue: 92,
              unit: "影響指数",
              periodLabel: "現在"
            }
          ]
        }}
        onHover={onHover}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    await waitFor(() => {
      expect(getLayerHandler("mousemove", "logistics-impact-region-fill")).toBeDefined();
      expect(getLayerHandler("click", "logistics-impact-region-fill")).toBeDefined();
    });

    const impactRegions = addedSources.get("logistics-impact-regions") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    expect(impactRegions.features[0].properties).toMatchObject({
      id: "prefecture:tokyo",
      label: "東京都",
      selectionId: "prefecture:tokyo",
      rawValue: 92,
      unit: "影響指数",
      period: "現在",
      hasData: true
    });

    getLayerHandler("mousemove", "logistics-impact-region-fill")?.({
      features: [{ properties: impactRegions.features[0].properties }],
      point: { x: 310, y: 240 }
    });
    expect(onHover).toHaveBeenLastCalledWith({
      selectionId: "prefecture:tokyo",
      label: "東京都",
      valueLabel: "92",
      unitLabel: "影響指数",
      periodLabel: "現在",
      x: 310,
      y: 240
    });
    expect(onSelect).not.toHaveBeenCalled();

    getLayerHandler("click", "logistics-impact-region-fill")?.({
      features: [{ properties: impactRegions.features[0].properties }],
      point: { x: 310, y: 240 }
    });
    expect(onSelect).toHaveBeenCalledWith("prefecture:tokyo", {
      placement: "right",
      x: 310,
      y: 240
    });
  });
});

function getRegistrations(event: string) {
  return registeredLayerHandlers.filter((registration) => registration.event === event);
}

function groupedRegistrations(event: string) {
  return getRegistrations(event).filter((registration) => registration.layerIds.length > 1);
}

function getLayerHandler(event: string, layerId: string) {
  return getRegistrations(event).find((registration) => registration.layerIds.includes(layerId))?.handler;
}

function getClusterCursorRegistration(event: "mouseenter" | "mouseleave") {
  return getRegistrations(event).find((registration) => (
    registration.layerIds.length === 1 && registration.layerIds[0] === "jp-cluster-circle"
  ));
}

function getAddedLayer(layerId: string) {
  return addedLayers.find((layer) => layer.id === layerId);
}

function getAddedLayerCall(layerId: string) {
  return addedLayerCalls.find((call) => call.layer.id === layerId);
}

function getAddedLayerCallIndex(layerId: string) {
  return addedLayers.findIndex((layer) => layer.id === layerId);
}

function expectRegionLayerVisibility(expectedVisibility: "visible" | "none") {
  for (const layerId of [
    "jp-prefecture-fill",
    "jp-prefecture-outline",
    "jp-prefecture-selected-outline",
    "jp-prefecture-leader-line",
    "jp-prefecture-label",
    "jp-prefecture-selected-label",
    "jp-region-fill",
    "jp-region-outline"
  ]) {
    expect(getLastLayoutVisibility(layerId)).toBe(expectedVisibility);
  }
}

function getLastLayoutVisibility(layerId: string) {
  return [...(lastMap?.setLayoutProperty.mock.calls ?? [])]
    .reverse()
    .find(([candidateLayerId, property]) => candidateLayerId === layerId && property === "visibility")?.[2];
}

function getSourceSetDataSpy(sourceId: string) {
  return sourceSetDataSpies.get(sourceId);
}
