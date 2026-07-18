import { describe, expect, test } from "vitest";

import { THEME_IDS } from "../../../types/semantic";
import { loadSeedGraph } from "../../data/seed-loader";
import { getDetailView } from "../../semantic/detail";
import { getThemeView } from "../../semantic/selectors";
import {
  buildMetricSeries,
  buildSelectionInspector,
  buildWorkspacePresentation,
  getDefaultLayerDefinition,
  getLayerDefinition,
  resolveLegacyPresentation
} from "../workspace";

describe("buildWorkspacePresentation", () => {
  test("builds the R5 rice scope from 47 prefectures", () => {
    const graph = loadSeedGraph();
    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, "rice"));

    expect(workspace.scope.coverage).toEqual({ label: "対象地域", value: "47都道府県" });
    expect(workspace.scope.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "rice-harvest-total", value: "6,610,315", unit: "トン" })
    ]));
    expect(workspace.layers.map((layer) => layer.label)).toEqual([
      "収穫量", "価格", "在庫・政策", "物流・投入コスト"
    ]);
    expect(workspace.defaultLayerId).toBe("rice-harvest");
    expect(workspace.layers[0]).toMatchObject({
      renderMode: "choropleth",
      periodLabel: "令和5年産",
      sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
    });
  });

  test.each(THEME_IDS)("has a meaningful layer for %s", (themeId) => {
    const graph = loadSeedGraph();
    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, themeId));
    expect(workspace.layers.length).toBeGreaterThan(0);
    expect(workspace.layers.some((layer) =>
      ["地点", "集約", "地域塗り", "ルート"].includes(layer.label)
    )).toBe(false);
  });
});

describe("workspace layer registry", () => {
  test("resolves semantic and legacy layers without retaining unsupported choropleths", () => {
    expect(getLayerDefinition("energy", "energy-route")?.renderMode).toBe("route");
    expect(getLayerDefinition("energy", "rice-harvest")).toBeNull();
    expect(getDefaultLayerDefinition("rice").id).toBe("rice-harvest");
    expect(resolveLegacyPresentation("rice", "choropleth")).toMatchObject({
      layer: { id: "rice-harvest" },
      mapModeOverride: "choropleth"
    });
    expect(resolveLegacyPresentation("energy", "choropleth")).toMatchObject({
      layer: { id: "energy-supply" },
      mapModeOverride: "point"
    });
  });
});

describe("workspace selection and comparison models", () => {
  test("preserves supplied live logistics detail for IDs outside the semantic graph", () => {
    const graph = loadSeedGraph();
    const suppliedDetail = {
      ...getDetailView(graph, "observation:rice-price-signal-2026"),
      id: "live-logistics:tanker-qatar-tokyo-bay",
      label: "カタール発タンカー"
    };

    const inspector = buildSelectionInspector(
      graph,
      "live-logistics:tanker-qatar-tokyo-bay",
      suppliedDetail
    );

    expect(inspector.detail).toBe(suppliedDetail);
    expect(inspector.primaryMetric).toBeNull();
  });

  test("formats observation and rice-prefecture metrics without fabricating entity values", () => {
    const graph = loadSeedGraph();
    const observationId = "observation:rice-price-signal-2026";
    const observation = buildSelectionInspector(graph, observationId, getDetailView(graph, observationId));
    const prefectureId = "prefecture:niigata";
    const prefecture = buildSelectionInspector(graph, prefectureId, getDetailView(graph, prefectureId));
    const countryId = "country:japan";
    const country = buildSelectionInspector(graph, countryId, getDetailView(graph, countryId));

    expect(observation.primaryMetric).toEqual({
      valueLabel: "35,056",
      unitLabel: "円/玄米60kg",
      periodLabel: "2026-02"
    });
    expect(prefecture.primaryMetric).toMatchObject({
      unitLabel: "トン",
      periodLabel: "令和5年産"
    });
    expect(country.primaryMetric).toBeNull();
  });

  test("builds the complete numeric R5 prefecture series", () => {
    const graph = loadSeedGraph();
    const series = buildMetricSeries(graph, "rice", "rice-harvest");

    expect(series).toHaveLength(47);
    expect(series.reduce((sum, point) => sum + point.value, 0)).toBe(6_610_315);
    expect(series[0]).toMatchObject({
      unit: "トン",
      period: "令和5年産",
      sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
    });
  });
});
