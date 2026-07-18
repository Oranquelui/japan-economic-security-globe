import { describe, expect, test } from "vitest";

import { THEME_IDS } from "../../../types/semantic";
import { loadSeedGraph, loadSeedLiveLogistics } from "../../data/seed-loader";
import { getDetailView } from "../../semantic/detail";
import { getThemeView } from "../../semantic/selectors";
import { buildLiveLogisticsView } from "../live-logistics";
import {
  buildMetricSeries,
  buildSelectionInspector,
  buildWorkspacePresentation,
  getDefaultLayerDefinition,
  getLayerDefinition,
  getLegacyLayerDefinition,
  resolveLegacyPresentation
} from "../workspace";

const REGISTRY_CASES = [
  {
    themeId: "energy",
    ids: ["energy-supply", "energy-price", "energy-route"],
    contents: [
      { kind: "entities", entityKinds: ["Country", "Terminal", "Refinery"] },
      { kind: "observations", observationIds: ["observation:lng-electricity-april-2026"] },
      { kind: "flows", flowIds: "theme" }
    ]
  },
  {
    themeId: "logistics",
    ids: ["logistics-domestic", "logistics-arrival", "logistics-impact"],
    contents: [
      { kind: "live-logistics", view: "domestic" },
      { kind: "live-logistics", view: "arrival" },
      { kind: "live-logistics", view: "impact" }
    ]
  },
  {
    themeId: "regional-security",
    ids: [
      "regional-security-public-events",
      "regional-security-impact",
      "regional-security-route"
    ],
    contents: [
      {
        kind: "observations",
        observationIds: [
          "observation:nk-missile-history-watch",
          "observation:china-air-activity-public-watch"
        ]
      },
      { kind: "observations", observationIds: ["observation:nk-missile-history-watch"] },
      { kind: "flows", flowIds: ["flow:nk-missile-history-japan-watch"] }
    ]
  },
  {
    themeId: "defense",
    ids: ["defense-capability-budget", "defense-sites", "defense-dependencies"],
    contents: [
      {
        kind: "observations",
        observationIds: [
          "observation:defense-budget-standoff-fy2026",
          "observation:defense-budget-iamd-fy2026",
          "observation:defense-budget-unmanned-fy2026",
          "observation:defense-industrial-base-layer-2026",
          "observation:strategic-autonomy-layer-2026"
        ]
      },
      { kind: "entities", entityKinds: ["Facility", "Organization"] },
      { kind: "flows", flowIds: "theme" }
    ]
  },
  {
    themeId: "semiconductors",
    ids: ["semiconductors-production", "semiconductors-route", "semiconductors-signals"],
    contents: [
      { kind: "entities", entityKinds: ["Country", "Facility", "Organization"] },
      { kind: "flows", flowIds: "theme" },
      { kind: "observations", observationIds: ["observation:semiconductor-policy-signal-2026"] }
    ]
  },
  {
    themeId: "rice",
    ids: ["rice-harvest", "rice-price", "rice-inventory-policy", "rice-logistics-inputs"],
    contents: [
      {
        kind: "regional-metric",
        entityKind: "Prefecture",
        property: "riceMainUseHarvestTonsR5"
      },
      { kind: "observations", observationIds: ["observation:rice-price-signal-2026"] },
      {
        kind: "observations",
        observationIds: [
          "observation:rice-private-inventory-feb-2026",
          "observation:rice-stockpile-policy-2026"
        ]
      },
      { kind: "flows", flowIds: "theme" }
    ]
  },
  {
    themeId: "water",
    ids: ["water-fill-rate", "water-sources", "water-supply"],
    contents: [
      {
        kind: "regional-metric",
        entityKind: "Reservoir",
        property: "latestFillRatePercent"
      },
      { kind: "entities", entityKinds: ["Reservoir"] },
      { kind: "observations", observationIds: ["observation:capital-lifeline-watch-2026"] }
    ]
  }
] as const;

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

  test("does not publish a nationwide rice total when one prefecture is missing", () => {
    const graph = structuredClone(loadSeedGraph());
    const prefecture = graph.entities.find(
      (entity) => entity.kind === "Prefecture" && entity.themes.includes("rice")
    );
    delete prefecture?.properties?.riceMainUseHarvestTonsR5;

    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, "rice"));
    const total = workspace.scope.metrics.find((metric) => metric.id === "rice-harvest-total");

    expect(total).toMatchObject({ value: "データ不足（46/47件）" });
    expect(total).not.toHaveProperty("unit");
  });
});

describe("workspace layer registry", () => {
  test.each(REGISTRY_CASES)("keeps the exact semantic registry for $themeId", ({ themeId, ids, contents }) => {
    const layers = ids.map((id) => getLayerDefinition(themeId, id));

    expect(layers.map((layer) => layer?.id)).toEqual(ids);
    expect(layers.map((layer) => layer?.content)).toEqual(contents);
    expect(getDefaultLayerDefinition(themeId).id).toBe(ids[0]);
  });

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

  test("uses runtime availability as the only source for defaults and legacy fallbacks", () => {
    const graph = structuredClone(loadSeedGraph());
    for (const entity of graph.entities) {
      if (entity.kind === "Prefecture" && entity.themes.includes("rice")) {
        delete entity.properties?.riceMainUseHarvestTonsR5;
      }
    }

    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, "rice"));

    expect(getLayerDefinition("rice", "rice-harvest", workspace)?.available).toBe(false);
    expect(workspace.defaultLayerId).toBe("rice-price");
    expect(getDefaultLayerDefinition("rice", workspace).id).toBe("rice-price");
    expect(getLegacyLayerDefinition("rice", "choropleth", workspace).id).toBe("rice-price");
    expect(resolveLegacyPresentation("rice", "choropleth", workspace)).toMatchObject({
      layer: { id: "rice-price", available: true },
      mapModeOverride: "point"
    });
  });

  test("makes route layers available only when their flows can render on the map", () => {
    const graph = loadSeedGraph();
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-07-18T00:00:00Z")
    );
    const cases = [
      ["rice", "rice-logistics-inputs", false, null],
      ["defense", "defense-dependencies", false, null],
      ["semiconductors", "semiconductors-route", false, null],
      ["energy", "energy-route", true, null],
      ["regional-security", "regional-security-route", true, null],
      ["logistics", "logistics-domestic", true, live]
    ] as const;

    for (const [themeId, layerId, expected, liveInput] of cases) {
      const workspace = buildWorkspacePresentation(
        graph,
        getThemeView(graph, themeId),
        liveInput
      );
      expect(
        getLayerDefinition(themeId, layerId, workspace)?.available,
        `${layerId} availability`
      ).toBe(expected);
    }
  });
});

describe("live logistics layer availability", () => {
  test("marks all live layers unavailable when no live input is supplied", () => {
    const graph = loadSeedGraph();
    const workspace = buildWorkspacePresentation(graph, getThemeView(graph, "logistics"));

    expect(workspace.layers.map((layer) => layer.available)).toEqual([false, false, false]);
    expect(workspace.defaultLayerId).toBe("logistics-domestic");
  });

  test("requires typed renderable inputs and never treats demo items as impact metrics", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-07-18T00:00:00Z")
    );
    expect(live).not.toBeNull();

    const seededWorkspace = buildWorkspacePresentation(graph, view, live);
    expect(seededWorkspace.layers.map((layer) => layer.available)).toEqual([true, false, false]);
    expect(seededWorkspace.layers[0]).toMatchObject({
      periodLabel: "固定デモデータ",
      sourceIds: []
    });
    expect(seededWorkspace.layers[2]).toMatchObject({
      available: false,
      periodLabel: "指標データ未提供",
      sourceIds: []
    });

    const vesselWorkspace = buildWorkspacePresentation(graph, view, {
      ...live!,
      items: [],
      mapRoutes: [],
      mapVessels: [{
        id: "live-vessel:test",
        label: "到着船",
        lat: 35.4,
        lon: 139.7,
        relatedIds: [],
        selectionId: "live-logistics:test",
        etaLabel: "2時間後",
        lastSeenLabel: "10分前"
      }]
    });
    expect(vesselWorkspace.layers.map((layer) => layer.available)).toEqual([false, true, false]);

    const unresolvedRouteWorkspace = buildWorkspacePresentation(graph, view, {
      ...live!,
      items: [],
      mapRoutes: [{ id: "missing", label: "missing", pointIds: ["missing:a", "missing:b"], relatedIds: [] }],
      mapVessels: []
    });
    expect(unresolvedRouteWorkspace.layers.map((layer) => layer.available)).toEqual([false, false, false]);
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
    const prefecture = buildSelectionInspector(
      graph,
      prefectureId,
      getDetailView(graph, prefectureId),
      getLayerDefinition("rice", "rice-harvest")
    );
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

  test("shows rice harvest only in the explicit rice-harvest layer context", () => {
    const graph = loadSeedGraph();
    const id = "prefecture:niigata";
    const detail = getDetailView(graph, id);

    expect(
      buildSelectionInspector(graph, id, detail, getLayerDefinition("rice", "rice-harvest"))
        .primaryMetric
    ).toMatchObject({ unitLabel: "トン", periodLabel: "令和5年産" });
    expect(
      buildSelectionInspector(graph, id, detail, getLayerDefinition("logistics", "logistics-domestic"))
        .primaryMetric
    ).toBeNull();
    expect(
      buildSelectionInspector(graph, id, detail, getLayerDefinition("rice", "rice-price"))
        .primaryMetric
    ).toBeNull();
    expect(buildSelectionInspector(graph, id, detail).primaryMetric).toBeNull();
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
