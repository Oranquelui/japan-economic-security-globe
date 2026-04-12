// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { JapanOperationsMapCanvas } from "../JapanOperationsMapCanvas";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";

const addedLayers: Array<Record<string, unknown>> = [];
const addedSources = new Map<string, unknown>();

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
    getCanvas = vi.fn(() => ({ style: { cursor: "" } }));
    getSource = vi.fn(() => ({ setData: vi.fn(), getClusterExpansionZoom: vi.fn(async () => 6) }));
    isStyleLoaded = vi.fn(() => true);
    getZoom = vi.fn(() => 5.3);

    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === "load") {
        handler();
      }
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
      pointIds: ["country:saudi-arabia", "chokepoint:hormuz", "country:japan"]
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
    expect(routeLayer).toBeTruthy();
    expect(routeLayer.paint["line-opacity"]).toEqual([
      "case",
      ["boolean", ["get", "selected"], false],
      ["interpolate", ["linear"], ["zoom"], 2, 0.96, 6, 0.92, 10, 0.88],
      ["interpolate", ["linear"], ["zoom"], 2, 0.8, 6, 0.68, 10, 0.58]
    ]);
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
});
