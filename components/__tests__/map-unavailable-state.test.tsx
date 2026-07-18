// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { prefectureBoundaryCollection } from "../../lib/geo/prefecture-boundaries";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import { JapanOperationsMapCanvas } from "../JapanOperationsMapCanvas";

const addedSources = new Map<string, unknown>();
const sourceSetDataSpies = new Map<string, ReturnType<typeof vi.fn>>();
const registeredLayerHandlers: Array<{
  event: string;
  handler: (...args: any[]) => void;
  layerIds: string[];
}> = [];
const mapLoadErrors: unknown[] = [];
const injectedFailure = vi.hoisted(() => ({
  boundaryBuilder: null as Error | null,
  labelBuilder: null as Error | null
}));
let mapZoom = 5.3;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

vi.mock("../../lib/geo/prefecture-map", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/geo/prefecture-map")>();

  return {
    ...actual,
    buildPrefectureMetricFeatureCollection: (
      ...args: Parameters<typeof actual.buildPrefectureMetricFeatureCollection>
    ) => {
      if (injectedFailure.boundaryBuilder) {
        throw injectedFailure.boundaryBuilder;
      }
      return actual.buildPrefectureMetricFeatureCollection(...args);
    }
  };
});

vi.mock("../../lib/geo/prefecture-label-layout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/geo/prefecture-label-layout")>();

  return {
    ...actual,
    buildPrefectureLabelFeatureCollections: (
      ...args: Parameters<typeof actual.buildPrefectureLabelFeatureCollections>
    ) => {
      if (injectedFailure.labelBuilder) {
        throw injectedFailure.labelBuilder;
      }
      return actual.buildPrefectureLabelFeatureCollections(...args);
    }
  };
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn((query: string) => ({
    addEventListener: vi.fn(),
    get matches() {
      return query === "(min-width: 1280px)";
    },
    media: query,
    removeEventListener: vi.fn()
  }))
});

vi.mock("maplibre-gl", () => {
  class MockMap {
    dragRotate = { disable: vi.fn() };
    touchZoomRotate = { disableRotation: vi.fn() };
    addControl = vi.fn();
    addLayer = vi.fn();
    remove = vi.fn();
    easeTo = vi.fn();
    fitBounds = vi.fn();
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    setPaintProperty = vi.fn();
    setLayoutProperty = vi.fn();
    off = vi.fn();
    isStyleLoaded = vi.fn(() => true);
    getZoom = vi.fn(() => mapZoom);
    getCanvas = vi.fn(() => ({
      clientHeight: 720,
      clientWidth: 1024,
      style: { cursor: "" }
    }));
    addSource = vi.fn((id: string, source: Record<string, unknown>) => {
      addedSources.set(id, source.data);
      sourceSetDataSpies.set(id, vi.fn((data: unknown) => {
        addedSources.set(id, data);
      }));
    });
    getSource = vi.fn((id: string) => ({
      getClusterExpansionZoom: vi.fn(async () => 6),
      setData: sourceSetDataSpies.get(id)
    }));
    on = vi.fn((
      event: string,
      layerOrHandler: string | string[] | ((...args: unknown[]) => void),
      handler?: (...args: any[]) => void
    ) => {
      if (event === "load" && typeof layerOrHandler === "function") {
        try {
          layerOrHandler();
        } catch (error) {
          mapLoadErrors.push(error);
        }
      }
      if ((typeof layerOrHandler === "string" || Array.isArray(layerOrHandler)) && handler) {
        registeredLayerHandlers.push({
          event,
          handler,
          layerIds: Array.isArray(layerOrHandler) ? layerOrHandler : [layerOrHandler]
        });
      }
      return { unsubscribe: vi.fn() };
    });
  }

  return {
    AttributionControl: class MockAttributionControl {
      constructor(_: unknown) {}
    },
    Map: MockMap
  };
});

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  addedSources.clear();
  sourceSetDataSpies.clear();
  registeredLayerHandlers.length = 0;
  mapLoadErrors.length = 0;
  injectedFailure.boundaryBuilder = null;
  injectedFailure.labelBuilder = null;
  mapZoom = 5.3;
  consoleErrorSpy.mockRestore();
});

const baseModel: JapanMapCanvasModel = {
  points: [
    {
      id: "port:yokohama",
      kind: "Port",
      label: "横浜港",
      lat: 35.44,
      lon: 139.67,
      tone: "critical"
    },
    {
      id: "prefecture:niigata",
      kind: "Prefecture",
      label: "新潟県",
      lat: 37.9,
      lon: 139.02,
      selectionId: "prefecture:niigata",
      tone: "watch"
    }
  ],
  routes: [{
    id: "route:yokohama-niigata",
    label: "横浜港 → 新潟県",
    pointIds: ["port:yokohama", "prefecture:niigata"],
    relatedIds: ["port:yokohama", "prefecture:niigata"]
  }],
  regions: [],
  globalPoints: [],
  globalRoutes: []
};

function prefectureMetricRegions(): JapanMapCanvasModel["regions"] {
  return prefectureBoundaryCollection.features.map((feature, index) => ({
    id: feature.properties.entityId,
    label: feature.properties.labelJa,
    lat: 24 + index * 0.5,
    lon: 123 + index * 0.5,
    geometryKind: "prefecture-boundary" as const,
    prefectureCode: feature.properties.prefectureCode,
    value: index,
    rawValue: index * 1_000,
    unit: "トン",
    periodLabel: "令和5年産",
    sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
  }));
}

function renderCanvas(model: JapanMapCanvasModel, onSelect = vi.fn()) {
  return {
    onSelect,
    ...render(
      <JapanOperationsMapCanvas
        activeId="prefecture:niigata"
        focusTargetId={null}
        mapMode="choropleth"
        model={model}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    )
  };
}

function sourceFeatures(sourceId: string) {
  return (addedSources.get(sourceId) as { features: unknown[] }).features;
}

function getLayerHandler(event: string, layerId: string) {
  return registeredLayerHandlers.find(
    (registration) => registration.event === event && registration.layerIds.includes(layerId)
  )?.handler;
}

describe("prefecture map unavailable state", () => {
  test("keeps points and routes usable while rejecting partial boundary geometry without circle fallback", async () => {
    const invalidRegions = prefectureMetricRegions().slice(0, -1);

    renderCanvas({ ...baseModel, regions: invalidRegions });

    expect(
      (await screen.findByRole("status", { name: "都道府県の地図形状の状態" })).textContent
    ).toContain("都道府県の地図形状を表示できません");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(sourceFeatures("jp-prefectures")).toEqual([]);
    expect(sourceFeatures("jp-regions")).toEqual([]);
    expect(sourceFeatures("jp-points")).toHaveLength(2);
    expect(sourceFeatures("jp-routes")).toHaveLength(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Prefecture boundary/model validation failed; rendering an empty prefecture geometry source.",
      expect.objectContaining({
        message: expect.stringContaining("Missing prefecture metric entity for boundary"),
        name: "PrefectureMetricValidationError"
      })
    );
  });

  test("shows no unavailable status for valid prefecture geometry or representative-radius-only regions", async () => {
    const valid = renderCanvas({ ...baseModel, regions: prefectureMetricRegions() });

    await waitFor(() => {
      expect(sourceFeatures("jp-prefectures")).toHaveLength(47);
    });
    expect(screen.queryByRole("status", { name: "都道府県の地図形状の状態" })).toBeNull();

    valid.unmount();
    addedSources.clear();
    sourceSetDataSpies.clear();

    renderCanvas({
      ...baseModel,
      regions: [{
        id: "basin:kanto",
        label: "関東流域",
        lat: 36,
        lon: 139,
        geometryKind: "representative-radius",
        value: 60,
        rawValue: 60
      }]
    });

    await waitFor(() => {
      expect(sourceFeatures("jp-regions")).toHaveLength(1);
    });
    expect(sourceFeatures("jp-prefectures")).toEqual([]);
    expect(screen.queryByRole("status", { name: "都道府県の地図形状の状態" })).toBeNull();
  });

  test("clears and restores the status and boundary sources across invalid-valid transitions", async () => {
    const invalidModel = { ...baseModel, regions: prefectureMetricRegions().slice(1) };
    const validModel = { ...baseModel, regions: prefectureMetricRegions() };
    const canvas = renderCanvas(invalidModel);

    expect(await screen.findByRole("status", { name: "都道府県の地図形状の状態" })).toBeTruthy();
    expect(sourceFeatures("jp-prefectures")).toEqual([]);

    canvas.rerender(
      <JapanOperationsMapCanvas
        activeId="prefecture:niigata"
        focusTargetId={null}
        mapMode="choropleth"
        model={validModel}
        onSelect={canvas.onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "都道府県の地図形状の状態" })).toBeNull();
      expect(sourceFeatures("jp-prefectures")).toHaveLength(47);
    });

    canvas.rerender(
      <JapanOperationsMapCanvas
        activeId="prefecture:niigata"
        focusTargetId={null}
        mapMode="choropleth"
        model={invalidModel}
        onSelect={canvas.onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(await screen.findByRole("status", { name: "都道府県の地図形状の状態" })).toBeTruthy();
    expect(sourceFeatures("jp-prefectures")).toEqual([]);
    expect(sourceFeatures("jp-regions")).toEqual([]);
  });

  test("keeps semantic selection callbacks available below zoom 9", async () => {
    mapZoom = 8.5;
    const onSelect = vi.fn();

    renderCanvas({ ...baseModel, regions: prefectureMetricRegions() }, onSelect);

    await waitFor(() => {
      expect(getLayerHandler("click", "jp-prefecture-fill")).toBeDefined();
    });
    getLayerHandler("click", "jp-prefecture-fill")?.({
      features: [{ properties: { selectionId: "prefecture:niigata" } }],
      point: { x: 420, y: 240 }
    });

    expect(onSelect).toHaveBeenCalledWith("prefecture:niigata", {
      placement: "right",
      x: 420,
      y: 240
    });
  });

  test.each([
    { failure: "boundaryBuilder" as const, message: "unexpected boundary builder failure" },
    { failure: "labelBuilder" as const, message: "unexpected label builder failure" }
  ])("rethrows an unknown $failure error without reporting geometry unavailable", async ({ failure, message }) => {
    const unexpectedError = new Error(message);
    injectedFailure[failure] = unexpectedError;

    renderCanvas({ ...baseModel, regions: prefectureMetricRegions() });

    await waitFor(() => {
      expect(mapLoadErrors).toEqual([unexpectedError]);
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "都道府県の地図形状の状態" })).toBeNull();
  });
});
