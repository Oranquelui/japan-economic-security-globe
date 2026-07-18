// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { JapanOperationsMapCanvas } from "../JapanOperationsMapCanvas";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";

const addedLayers: Array<Record<string, unknown>> = [];
const addedSources = new Map<string, unknown>();
const registeredLayerHandlers: Array<{
  event: string;
  handler: (...args: any[]) => void;
  layerIds: string[];
  unsubscribe: ReturnType<typeof vi.fn>;
}> = [];
let lastMap: {
  fitBounds: ReturnType<typeof vi.fn>;
  getCanvas: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
} | null = null;
let mapCanvasSize = { width: 1024, height: 720 };

vi.mock("maplibre-gl", () => {
  class MockMap {
    dragRotate = { disable: vi.fn() };
    touchZoomRotate = { disableRotation: vi.fn() };

    addControl = vi.fn();
    addSource = vi.fn((id: string, source: Record<string, unknown>) => {
      addedSources.set(id, source.data);
    });
    addLayer = vi.fn((layer: Record<string, unknown>) => {
      addedLayers.push(layer);
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
    getSource = vi.fn(() => ({ setData: vi.fn(), getClusterExpansionZoom: vi.fn(async () => 6) }));
    isStyleLoaded = vi.fn(() => true);
    getZoom = vi.fn(() => 5.3);
    off = vi.fn();

    constructor() {
      lastMap = this;
    }

    on = vi.fn((event: string, layerOrHandler: string | string[] | ((...args: unknown[]) => void), handler?: (...args: any[]) => void) => {
      if (event === "load" && typeof layerOrHandler === "function") {
        layerOrHandler();
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
  addedSources.clear();
  registeredLayerHandlers.length = 0;
  lastMap = null;
  mapCanvasSize = { width: 1024, height: 720 };
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

describe("map canvas layer config", () => {
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

  test("adds a dedicated live logistics route source and pulse layer", async () => {
    render(
      <JapanOperationsMapCanvas
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="route"
        model={
          {
            ...model,
            livePoints: [
              ...model.globalPoints,
              { id: "port:yokohama", kind: "Port", label: "横浜港", lat: 35.44, lon: 139.67, tone: "critical" }
            ],
            liveRoutes: [
              {
                id: "live-logistics:tanker-saudi-tokyo-bay",
                label: "AIS tanker corridor",
                pointIds: ["country:saudi-arabia", "chokepoint:hormuz", "country:japan", "port:yokohama"],
                relatedIds: ["flow:saudi-oil-japan"]
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

    const pulseLayer = addedLayers.find((layer) => layer.id === "live-logistics-route-pulse") as any;
    const glowLayer = addedLayers.find((layer) => layer.id === "live-logistics-route-glow") as any;
    const labelLayer = addedLayers.find((layer) => layer.id === "live-logistics-route-label") as any;
    const liveRoutes = addedSources.get("live-logistics-routes") as {
      features: Array<{ properties: { id: string; selected: boolean; selectionId: string } }>;
    };

    expect(pulseLayer).toBeTruthy();
    expect(glowLayer).toBeTruthy();
    expect(pulseLayer.source).toBe("live-logistics-routes");
    expect(glowLayer.source).toBe("live-logistics-routes");
    expect(pulseLayer.paint["line-color"]).toBe(getStatusPalette().monitoring);
    expect(pulseLayer.paint["line-dasharray"]).toEqual([0.2, 1.2]);
    expect(glowLayer.paint["line-blur"]).toBeTruthy();
    expect(labelLayer).toBeTruthy();
    expect(labelLayer.layout["text-field"]).toBe("SCAN");
    expect(liveRoutes.features[0].properties.id).toBe("live-logistics:tanker-saudi-tokyo-bay");
    expect(liveRoutes.features[0].properties.selectionId).toBe("live-logistics:tanker-saudi-tokyo-bay");
    expect(liveRoutes.features[0].properties.selected).toBe(true);
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
    const livePulseLayer = addedLayers.find((layer) => layer.id === "live-logistics-route-pulse") as any;

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
    expect(livePulseLayer.paint["line-opacity"]).toEqual([
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
          regions: [
            {
              id: "prefecture:niigata",
              label: "新潟県",
              lat: 37.9026,
              lon: 139.0236,
              geometryKind: "prefecture-boundary",
              prefectureCode: "JP-15",
              value: 100,
              rawValue: 514100,
              unit: "トン",
              periodLabel: "令和5年産"
            }
          ]
        }}
        onHover={onHover}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(getLayerHandler("mousemove", "jp-region-fill")).toBeDefined();
    });

    const regions = addedSources.get("jp-regions") as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    expect(regions.features[0].properties).toMatchObject({
      id: "prefecture:niigata",
      label: "新潟県",
      selectionId: "prefecture:niigata",
      selected: false,
      value: 100,
      rawValue: 514100,
      unit: "トン",
      period: "令和5年産",
      hasData: true
    });

    getLayerHandler("mousemove", "jp-region-fill")?.({
      features: [{ properties: regions.features[0].properties }],
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

    getLayerHandler("mouseleave", "jp-region-fill")?.();
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
          regions: [
            {
              id: "prefecture:niigata",
              label: "新潟県",
              lat: 37.9,
              lon: 139,
              geometryKind: "prefecture-boundary",
              prefectureCode: "JP-15",
              value: null
            },
            {
              id: "prefecture:hokkaido",
              label: "北海道",
              lat: 43.1,
              lon: 141.3,
              geometryKind: "prefecture-boundary",
              prefectureCode: "JP-01",
              value: 0,
              rawValue: 0
            }
          ]
        }}
        onSelect={vi.fn()}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(addedSources.has("jp-regions")).toBe(true);
    });

    const regions = addedSources.get("jp-regions") as {
      features: Array<{ geometry: { coordinates: number[][][] }; properties: Record<string, unknown> }>;
    };
    const regionFill = addedLayers.find((layer) => layer.id === "jp-region-fill") as any;
    const regionOutline = addedLayers.find((layer) => layer.id === "jp-region-outline") as any;

    expect(regions.features[0].properties).toMatchObject({ hasData: false, rawValue: null, value: null });
    expect(regions.features[1].properties).toMatchObject({ hasData: true, rawValue: 0, value: 0 });
    expect(regions.features[0].geometry.coordinates).not.toEqual(regions.features[1].geometry.coordinates);
    expect(JSON.stringify(regionFill.paint["fill-color"])).toContain("hasData");
    expect(JSON.stringify(regionFill.paint["fill-color"])).not.toContain("selected");
    expect(JSON.stringify(regionFill.paint["fill-opacity"])).toContain("value");
    expect(JSON.stringify(regionOutline.paint["line-width"])).toContain("selected");
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
