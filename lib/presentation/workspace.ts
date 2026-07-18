import type {
  ActiveLayerSummary,
  DetailViewModel,
  LayerDefinition,
  LayerLegend,
  MetricSeriesPoint,
  ScopeSummary,
  ScopeSummaryMetric,
  SelectionInspectorViewModel,
  SemanticLayerId,
  ThemeView,
  WorkspacePresentation
} from "../../types/presentation";
import type { LiveLogisticsViewModel } from "../../types/logistics";
import type { SemanticGraph, ThemeId } from "../../types/semantic";
import { NATURAL_EARTH_PREFECTURE_SOURCE_ID } from "../geo/prefecture-map";
import { localizeAnyLabel } from "./japanese";
import type { OperationMapMode } from "./operations";
import { isRenderableMapRoute } from "./route-status";

const RICE_HARVEST_SOURCE_ID = "source:estat-rice-prefecture-harvest-r5";
const RICE_NATIONWIDE_PREFECTURE_COUNT = 47;
const numberFormatter = new Intl.NumberFormat("ja-JP");

function categoricalLegend(title: string): LayerLegend {
  return { kind: "categorical", title, missingLabel: "データなし" };
}

function continuousLegend(title: string, unit: string): LayerLegend {
  return {
    kind: "continuous",
    title,
    unit,
    minLabel: "低",
    maxLabel: "高",
    missingLabel: "データなし"
  };
}

const LAYER_REGISTRY: Record<ThemeId, LayerDefinition[]> = {
  rice: [
    {
      id: "rice-harvest",
      themeId: "rice",
      label: "収穫量",
      description: "都道府県別の主食用米収穫量",
      mapEncodingDescription: "都道府県の一般化された地域形状を収穫量の濃淡で表示します。境界線と都道府県名から対象地域を確認できます。",
      renderMode: "choropleth",
      periodLabel: "令和5年産",
      sourceIds: [RICE_HARVEST_SOURCE_ID, NATURAL_EARTH_PREFECTURE_SOURCE_ID],
      legend: continuousLegend("主食用米収穫量", "トン"),
      available: true,
      content: {
        kind: "regional-metric",
        entityKind: "Prefecture",
        property: "riceMainUseHarvestTonsR5"
      }
    },
    {
      id: "rice-price",
      themeId: "rice",
      label: "価格",
      description: "相対取引価格の公開観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年2月",
      sourceIds: ["source:maff-rice-policy", "source:maff-rice-monthly-report"],
      legend: categoricalLegend("価格観測"),
      available: true,
      content: { kind: "observations", observationIds: ["observation:rice-price-signal-2026"] }
    },
    {
      id: "rice-inventory-policy",
      themeId: "rice",
      label: "在庫・政策",
      description: "民間在庫と備蓄政策の公開観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年2月",
      sourceIds: ["source:maff-rice-monthly-report", "source:maff-rice-policy", "source:egov-law-search"],
      legend: categoricalLegend("在庫・政策観測"),
      available: true,
      content: {
        kind: "observations",
        observationIds: [
          "observation:rice-private-inventory-feb-2026",
          "observation:rice-stockpile-policy-2026"
        ]
      }
    },
    {
      id: "rice-logistics-inputs",
      themeId: "rice",
      label: "物流・投入コスト",
      description: "エネルギーと肥料投入からコメ価格への依存関係",
      mapEncodingDescription: "登録済みの意味的フローから依存・供給の代表経路を表示します。ライブ経路ではありません。",
      renderMode: "route",
      periodLabel: "2026年",
      sourceIds: [
        "source:maff-rice-policy",
        "source:maff-rice-monthly-report",
        "source:enecho-energy-trends",
        "source:meti-2026-energy-taskforce"
      ],
      legend: categoricalLegend("投入コスト依存"),
      available: true,
      content: { kind: "flows", flowIds: "theme" }
    }
  ],
  energy: [
    {
      id: "energy-supply",
      themeId: "energy",
      label: "供給拠点",
      description: "供給国と国内の受入・精製拠点",
      mapEncodingDescription: "関連する公開エンティティや施設を、利用可能な代表位置に表示します。",
      renderMode: "point",
      periodLabel: "2026年",
      sourceIds: ["source:customs-trade-statistics", "source:enecho-energy-trends"],
      legend: categoricalLegend("供給拠点"),
      available: true,
      content: { kind: "entities", entityKinds: ["Country", "Terminal", "Refinery"] }
    },
    {
      id: "energy-price",
      themeId: "energy",
      label: "輸入価格",
      description: "LNGと電力コストに関する公開観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年4月",
      sourceIds: ["source:enecho-energy-trends", "source:tepco-2026-april-power"],
      legend: categoricalLegend("価格観測"),
      available: true,
      content: { kind: "observations", observationIds: ["observation:lng-electricity-april-2026"] }
    },
    {
      id: "energy-route",
      themeId: "energy",
      label: "供給ルート",
      description: "日本向けエネルギー供給経路",
      mapEncodingDescription: "登録済みの意味的フローから依存・供給の代表経路を表示します。ライブ経路ではありません。",
      renderMode: "route",
      periodLabel: "2026年",
      sourceIds: ["source:customs-trade-statistics", "source:enecho-energy-trends"],
      legend: categoricalLegend("供給経路"),
      available: true,
      content: { kind: "flows", flowIds: "theme" }
    }
  ],
  logistics: [
    {
      id: "logistics-domestic",
      themeId: "logistics",
      label: "国内物流",
      description: "固定デモデータによる港湾から国内配送網への物流経路",
      mapEncodingDescription: "固定デモデータの代表経路を表示します。ライブ追跡または公式な影響データではありません。",
      renderMode: "route",
      periodLabel: "固定デモデータ",
      sourceIds: [],
      legend: categoricalLegend("国内物流"),
      available: true,
      content: { kind: "live-logistics", view: "domestic" }
    },
    {
      id: "logistics-arrival",
      themeId: "logistics",
      label: "到着見込み",
      description: "提供データ内の日本側拠点への到着見込み",
      mapEncodingDescription: "提供データの時点における到着地点を表示します。網羅的なライブ範囲ではありません。",
      renderMode: "point",
      periodLabel: "提供データの時点",
      sourceIds: [],
      legend: categoricalLegend("到着見込み"),
      available: true,
      content: { kind: "live-logistics", view: "arrival" }
    },
    {
      id: "logistics-impact",
      themeId: "logistics",
      label: "物流影響",
      description: "型付き影響指標が提供された場合に地域別表示",
      mapEncodingDescription: "型付きで出典のある地域別影響値が存在するまで表示できません。",
      renderMode: "choropleth",
      periodLabel: "指標データ未提供",
      sourceIds: [],
      legend: continuousLegend("物流影響", "指数"),
      available: true,
      content: { kind: "live-logistics", view: "impact" }
    }
  ],
  "regional-security": [
    {
      id: "regional-security-public-events",
      themeId: "regional-security",
      label: "公開事象",
      description: "公式・公開情報に限定した地域安全保障事象",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "公開履歴",
      sourceIds: [
        "source:cns-north-korea-missile-test-database",
        "source:mod-dprk-missile-nuclear-development",
        "source:nagix-nk-missile-tests",
        "source:mod-joint-staff-air-activity"
      ],
      legend: categoricalLegend("公開事象"),
      available: true,
      content: {
        kind: "observations",
        observationIds: [
          "observation:nk-missile-history-watch",
          "observation:china-air-activity-public-watch"
        ]
      }
    },
    {
      id: "regional-security-impact",
      themeId: "regional-security",
      label: "影響観測",
      description: "日本向けの公開・履歴ベース影響観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "1984–2026年",
      sourceIds: [
        "source:cns-north-korea-missile-test-database",
        "source:mod-dprk-missile-nuclear-development",
        "source:nagix-nk-missile-tests"
      ],
      legend: categoricalLegend("影響観測"),
      available: true,
      content: { kind: "observations", observationIds: ["observation:nk-missile-history-watch"] }
    },
    {
      id: "regional-security-route",
      themeId: "regional-security",
      label: "代表経路",
      description: "公開履歴から構成した日本向け代表経路",
      mapEncodingDescription: "登録済みの意味的フローから依存・供給の代表経路を表示します。ライブ経路ではありません。",
      renderMode: "route",
      periodLabel: "1984–2026年",
      sourceIds: [
        "source:cns-north-korea-missile-test-database",
        "source:mod-dprk-missile-nuclear-development",
        "source:nagix-nk-missile-tests"
      ],
      legend: categoricalLegend("代表経路"),
      available: true,
      content: { kind: "flows", flowIds: ["flow:nk-missile-history-japan-watch"] }
    }
  ],
  defense: [
    {
      id: "defense-capability-budget",
      themeId: "defense",
      label: "能力・予算",
      description: "防衛能力と令和8年度予算の公開観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年度",
      sourceIds: ["source:mod-fy2026-budget", "source:mof-fy2026-budget"],
      legend: categoricalLegend("能力・予算"),
      available: true,
      content: {
        kind: "observations",
        observationIds: [
          "observation:defense-budget-standoff-fy2026",
          "observation:defense-budget-iamd-fy2026",
          "observation:defense-budget-unmanned-fy2026",
          "observation:defense-industrial-base-layer-2026",
          "observation:strategic-autonomy-layer-2026"
        ]
      }
    },
    {
      id: "defense-sites",
      themeId: "defense",
      label: "拠点",
      description: "防衛関連施設と組織",
      mapEncodingDescription: "関連する公開エンティティや施設を、利用可能な代表位置に表示します。",
      renderMode: "point",
      periodLabel: "2026年",
      sourceIds: ["source:mod-installations", "source:mod-fy2026-budget"],
      legend: categoricalLegend("防衛拠点"),
      available: true,
      content: { kind: "entities", entityKinds: ["Facility", "Organization"] }
    },
    {
      id: "defense-dependencies",
      themeId: "defense",
      label: "依存関係",
      description: "予算・能力・産業基盤の依存関係",
      mapEncodingDescription: "登録済みの意味的フローから依存・供給の代表経路を表示します。ライブ経路ではありません。",
      renderMode: "route",
      periodLabel: "2026年度",
      sourceIds: ["source:mod-fy2026-budget", "source:mof-fy2026-budget"],
      legend: categoricalLegend("依存関係"),
      available: true,
      content: { kind: "flows", flowIds: "theme" }
    }
  ],
  semiconductors: [
    {
      id: "semiconductors-production",
      themeId: "semiconductors",
      label: "生産・供給拠点",
      description: "半導体の生産施設・供給国・関連組織",
      mapEncodingDescription: "関連する公開エンティティや施設を、利用可能な代表位置に表示します。",
      renderMode: "point",
      periodLabel: "2026年",
      sourceIds: ["source:meti-semiconductor-frame", "source:cabinet-tsmc-2026"],
      legend: categoricalLegend("生産・供給拠点"),
      available: true,
      content: { kind: "entities", entityKinds: ["Country", "Facility", "Organization"] }
    },
    {
      id: "semiconductors-route",
      themeId: "semiconductors",
      label: "供給ルート",
      description: "日本の半導体供給に関わる依存経路",
      mapEncodingDescription: "登録済みの意味的フローから依存・供給の代表経路を表示します。ライブ経路ではありません。",
      renderMode: "route",
      periodLabel: "2026年",
      sourceIds: ["source:meti-semiconductor-frame", "source:customs-trade-statistics"],
      legend: categoricalLegend("供給経路"),
      available: true,
      content: { kind: "flows", flowIds: "theme" }
    },
    {
      id: "semiconductors-signals",
      themeId: "semiconductors",
      label: "監視指標",
      description: "半導体産業基盤の政策シグナル",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年",
      sourceIds: ["source:meti-semiconductor-frame", "source:cabinet-tsmc-2026", "source:customs-trade-statistics"],
      legend: categoricalLegend("監視指標"),
      available: true,
      content: { kind: "observations", observationIds: ["observation:semiconductor-policy-signal-2026"] }
    }
  ],
  water: [
    {
      id: "water-fill-rate",
      themeId: "water",
      label: "貯水率",
      description: "公開されている水源別の最新貯水率",
      mapEncodingDescription: "水源の代表点の色と大きさで型付き最新貯水率を表します。",
      renderMode: "choropleth",
      periodLabel: "最新公表値",
      sourceIds: ["source:mlit-drought-portal", "source:mlit-river-disaster-info"],
      legend: continuousLegend("貯水率", "%"),
      available: true,
      content: {
        kind: "regional-metric",
        entityKind: "Reservoir",
        property: "latestFillRatePercent"
      }
    },
    {
      id: "water-sources",
      themeId: "water",
      label: "水源",
      description: "国内の主要な公開水源",
      mapEncodingDescription: "関連する公開エンティティや施設を、利用可能な代表位置に表示します。",
      renderMode: "point",
      periodLabel: "最新公表値",
      sourceIds: ["source:mlit-drought-portal", "source:mlit-river-disaster-info"],
      legend: categoricalLegend("水源"),
      available: true,
      content: { kind: "entities", entityKinds: ["Reservoir"] }
    },
    {
      id: "water-supply",
      themeId: "water",
      label: "供給関係",
      description: "首都圏ライフラインと水供給の公開観測",
      mapEncodingDescription: "関連する公開観測の対象地点を代表位置に表示します。マーカー自体は地域指標を表すものではありません。",
      renderMode: "point",
      periodLabel: "2026年4月26日",
      sourceIds: ["source:jma-earthquake-information", "source:mlit-drought-portal"],
      legend: categoricalLegend("供給関係"),
      available: true,
      content: { kind: "observations", observationIds: ["observation:capital-lifeline-watch-2026"] }
    }
  ]
};

export function buildWorkspacePresentation(
  graph: SemanticGraph,
  view: ThemeView,
  liveLogistics: LiveLogisticsViewModel | null = null
): WorkspacePresentation {
  const layers = LAYER_REGISTRY[view.id].map((layer) => ({
    ...layer,
    available: hasLayerInput(graph, view, layer, liveLogistics)
  }));
  const defaultLayer = layers.find((layer) => layer.available) ?? layers[0];

  return {
    defaultLayerId: defaultLayer.id,
    scope: buildScopeSummary(view, layers),
    layers
  };
}

export function buildActiveLayerSummary(
  graph: SemanticGraph,
  view: ThemeView,
  layer: LayerDefinition,
  scope: ScopeSummary,
  liveLogistics: LiveLogisticsViewModel | null = null
): ActiveLayerSummary {
  // Live logistics is accepted for the presentation contract, but it is never a numeric source.
  void liveLogistics;

  const sources = layer.sourceIds.flatMap((sourceId) => {
    const source = view.sources.find((candidate) => candidate.id === sourceId)
      ?? (sourceId === NATURAL_EARTH_PREFECTURE_SOURCE_ID
        ? graph.sources.find((candidate) => candidate.id === sourceId)
        : undefined);
    return source ? [source] : [];
  });

  return {
    title: layer.label,
    description: layer.description,
    coverage: buildActiveLayerCoverage(view, layer, scope),
    periodLabel: layer.periodLabel,
    primaryMetric: buildActiveLayerPrimaryMetric(graph, view, layer),
    missingDataLabel:
      !layer.available ||
      layer.content.kind === "regional-metric" ||
      layer.legend.kind === "continuous"
        ? "データなし"
        : null,
    mapEncodingDescription: layer.mapEncodingDescription,
    sources,
    sourceFallbackLabel: sources.length > 0
      ? null
      : layer.id === "logistics-domestic"
        ? "固定デモデータ"
        : "出典情報なし"
  };
}

type RuntimeLayerSource = WorkspacePresentation | readonly LayerDefinition[];

export function getLayerDefinition(
  themeId: ThemeId,
  layerId: string | null | undefined,
  runtimeSource?: RuntimeLayerSource
): LayerDefinition | null {
  if (!layerId) {
    return null;
  }

  return getLayerSource(themeId, runtimeSource).find((layer) => layer.id === layerId) ?? null;
}

export function getDefaultLayerDefinition(
  themeId: ThemeId,
  runtimeSource?: RuntimeLayerSource
): LayerDefinition {
  const layers = getLayerSource(themeId, runtimeSource);
  const defaultLayer = layers.find((layer) => layer.available) ?? layers[0];

  if (!defaultLayer) {
    throw new Error(`No workspace layers registered for ${themeId}`);
  }

  return defaultLayer;
}

export function getLegacyLayerDefinition(
  themeId: ThemeId,
  mapMode: OperationMapMode,
  runtimeSource?: RuntimeLayerSource
): LayerDefinition {
  return getLayerSource(themeId, runtimeSource).find(
    (layer) => layer.available && layer.renderMode === mapMode
  ) ?? getDefaultLayerDefinition(themeId, runtimeSource);
}

export function resolveLegacyPresentation(
  themeId: ThemeId,
  requestedMode: OperationMapMode,
  runtimeSource?: RuntimeLayerSource
): { layer: LayerDefinition; mapModeOverride: OperationMapMode } {
  const layer = getLegacyLayerDefinition(themeId, requestedMode, runtimeSource);

  if (requestedMode === "choropleth" && (!layer.available || layer.renderMode !== "choropleth")) {
    return {
      layer: getDefaultLayerDefinition(themeId, runtimeSource),
      mapModeOverride: "point"
    };
  }

  return { layer, mapModeOverride: requestedMode };
}

function getLayerSource(
  themeId: ThemeId,
  runtimeSource?: RuntimeLayerSource
): readonly LayerDefinition[] {
  // No runtime source means registry metadata/capability lookup, retained for URL parsing compatibility.
  if (!runtimeSource) {
    return LAYER_REGISTRY[themeId];
  }

  // Once supplied, runtime layers are the sole source of truth for data-aware availability.
  const layers = "layers" in runtimeSource ? runtimeSource.layers : runtimeSource;
  return layers.filter((layer) => layer.themeId === themeId);
}

export function buildSelectionInspector(
  graph: SemanticGraph,
  id: string,
  detail: DetailViewModel,
  activeLayer: LayerDefinition | null = null
): SelectionInspectorViewModel {
  const observation = graph.observations.find((candidate) => candidate.id === id);
  if (observation) {
    return {
      detail,
      primaryMetric: {
        valueLabel: formatMetricValue(observation.value),
        ...(observation.unit ? { unitLabel: localizeUnit(observation.unit) } : {}),
        periodLabel: observation.period
      }
    };
  }

  const entity = graph.entities.find((candidate) => candidate.id === id);
  const harvest = entity?.properties?.riceMainUseHarvestTonsR5;
  if (
    activeLayer?.themeId === "rice" &&
    activeLayer.id === "rice-harvest" &&
    entity?.kind === "Prefecture" &&
    entity.themes.includes("rice") &&
    typeof harvest === "number"
  ) {
    return {
      detail,
      primaryMetric: {
        valueLabel: numberFormatter.format(harvest),
        unitLabel: "トン",
        periodLabel: "令和5年産"
      }
    };
  }

  const flow = graph.flows.find((candidate) => candidate.id === id);
  if (flow?.magnitudeLabel) {
    return {
      detail,
      primaryMetric: {
        valueLabel: flow.magnitudeLabel,
        periodLabel: flow.period
      }
    };
  }

  return { detail, primaryMetric: null };
}

export function buildMetricSeries(
  graph: SemanticGraph,
  themeId: ThemeId,
  layerId: SemanticLayerId
): MetricSeriesPoint[] {
  const layer = getLayerDefinition(themeId, layerId);
  if (!layer) {
    return [];
  }

  if (layer.content.kind === "regional-metric") {
    const { entityKind, property } = layer.content;
    return graph.entities
      .filter((entity) => entity.kind === entityKind && entity.themes.includes(themeId))
      .flatMap((entity): MetricSeriesPoint[] => {
        const value = entity.properties?.[property];
        if (typeof value !== "number") {
          return [];
        }

        const isRice = property === "riceMainUseHarvestTonsR5";
        return [{
          id: entity.id,
          label: localizeAnyLabel(entity.id, entity.label),
          value,
          unit: isRice ? "トン" : "%",
          period: layer.periodLabel,
          sourceIds: isRice
            ? [RICE_HARVEST_SOURCE_ID]
            : unique(entity.sourceIds ?? layer.sourceIds)
        }];
      });
  }

  if (layer.content.kind === "observations") {
    const ids = new Set(layer.content.observationIds);
    return graph.observations
      .filter((observation) => ids.has(observation.id) && typeof observation.value === "number")
      .map((observation) => ({
        id: observation.id,
        label: localizeAnyLabel(observation.id, observation.label),
        value: observation.value as number,
        unit: observation.unit ? localizeUnit(observation.unit) : "",
        period: observation.period,
        sourceIds: observation.sourceIds
      }));
  }

  return [];
}

function hasLayerInput(
  graph: SemanticGraph,
  view: ThemeView,
  layer: LayerDefinition,
  liveLogistics: LiveLogisticsViewModel | null
): boolean {
  const content = layer.content;

  switch (content.kind) {
    case "regional-metric":
      return view.entities.some(
        (entity) => entity.kind === content.entityKind && typeof entity.properties?.[content.property] === "number"
      );
    case "observations":
      return content.observationIds.every((id) => graph.observations.some((observation) => observation.id === id));
    case "flows":
      if (content.flowIds === "theme") {
        return view.flows.some(isRenderableMapRoute);
      }

      const explicitFlows = content.flowIds.map((id) =>
        graph.flows.find((flow) => flow.id === id)
      );
      return (
        explicitFlows.every((flow) => flow !== undefined) &&
        explicitFlows.some((flow) => flow !== undefined && isRenderableMapRoute(flow))
      );
    case "entities":
      return view.entities.some((entity) => content.entityKinds.includes(entity.kind));
    case "live-logistics":
      return hasLiveLogisticsInput(graph, view.id, content.view, liveLogistics);
    case "theme-composite":
      return true;
  }
}

function hasLiveLogisticsInput(
  graph: SemanticGraph,
  themeId: ThemeId,
  mode: "domestic" | "arrival" | "impact",
  liveLogistics: LiveLogisticsViewModel | null
): boolean {
  if (!liveLogistics) {
    return false;
  }

  if (mode === "domestic") {
    return liveLogistics.mapRoutes.some((route) => {
      const resolvedPointIds = route.pointIds.filter((id) => {
        const entity = graph.entities.find((candidate) => candidate.id === id);
        return Boolean(
          entity?.coordinates &&
          (themeId !== "logistics" || !["Country", "Chokepoint", "SeaLane"].includes(entity.kind))
        );
      });

      return new Set(resolvedPointIds).size >= 2;
    });
  }

  if (mode === "arrival") {
    return liveLogistics.mapVessels.some(
      (vessel) => Number.isFinite(vessel.lat) && Number.isFinite(vessel.lon)
    );
  }

  // Runtime logistics items describe routes and arrival context, not a typed regional impact metric.
  // Keep the impact layer unavailable until the view model carries sourced values, units, and periods.
  return false;
}

function buildActiveLayerCoverage(
  view: ThemeView,
  layer: LayerDefinition,
  scope: ScopeSummary
): ScopeSummary["coverage"] {
  if (layer.content.kind !== "regional-metric") {
    return scope.coverage;
  }

  const { eligibleCount, numericValues } = getRegionalMetricValues(view, layer.content);
  if (
    layer.content.property === "riceMainUseHarvestTonsR5" &&
    hasCompleteNationwideRiceCoverage(eligibleCount, numericValues.length)
  ) {
    return scope.coverage;
  }

  return {
    label: "データ収録",
    value: `${numericValues.length}/${
      layer.content.property === "riceMainUseHarvestTonsR5"
        ? RICE_NATIONWIDE_PREFECTURE_COUNT
        : eligibleCount
    }件`
  };
}

function buildActiveLayerPrimaryMetric(
  graph: SemanticGraph,
  view: ThemeView,
  layer: LayerDefinition
): ScopeSummaryMetric | null {
  if (layer.content.kind === "regional-metric") {
    if (layer.content.property !== "riceMainUseHarvestTonsR5") {
      return null;
    }

    const { eligibleCount, numericValues } = getRegionalMetricValues(view, layer.content);
    if (!hasCompleteNationwideRiceCoverage(eligibleCount, numericValues.length)) {
      return null;
    }

    return {
      id: "rice-harvest-total",
      label: "主食用米収穫量",
      value: numberFormatter.format(
        numericValues.reduce((total, harvest) => total + harvest, 0)
      ),
      unit: "トン",
      periodLabel: layer.periodLabel,
      sourceIds: [...layer.sourceIds]
    };
  }

  if (layer.content.kind === "observations") {
    if (layer.content.observationIds.length !== 1) {
      return null;
    }

    const [observationId] = layer.content.observationIds;
    const observation = graph.observations.find(
      (candidate) =>
        candidate.id === observationId && candidate.theme === view.id
    );
    if (!observation || typeof observation.value !== "number") {
      return null;
    }

    return toScopeObservationMetric(observation);
  }

  return null;
}

function getRegionalMetricValues(
  view: ThemeView,
  content: Extract<LayerDefinition["content"], { kind: "regional-metric" }>
): { eligibleCount: number; numericValues: number[] } {
  const eligibleEntities = view.entities.filter((entity) => entity.kind === content.entityKind);
  const numericValues = eligibleEntities.flatMap((entity) => {
    const value = entity.properties?.[content.property];
    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  });

  return { eligibleCount: eligibleEntities.length, numericValues };
}

function hasCompleteNationwideRiceCoverage(
  eligibleCount: number,
  numericCount: number
): boolean {
  return (
    eligibleCount === RICE_NATIONWIDE_PREFECTURE_COUNT &&
    numericCount === RICE_NATIONWIDE_PREFECTURE_COUNT
  );
}

function buildScopeSummary(view: ThemeView, layers: LayerDefinition[]): ScopeSummary {
  if (view.id === "rice") {
    const prefectures = view.entities.filter((entity) => entity.kind === "Prefecture");
    const numericHarvests = prefectures.flatMap((entity) => {
      const value = entity.properties?.riceMainUseHarvestTonsR5;
      return typeof value === "number" && Number.isFinite(value) ? [value] : [];
    });
    const harvestTotal = numericHarvests.reduce((total, harvest) => total + harvest, 0);
    const hasCompleteHarvestCoverage = hasCompleteNationwideRiceCoverage(
      prefectures.length,
      numericHarvests.length
    );
    const observationMetrics = view.observations
      .filter((observation) => typeof observation.value === "number")
      .map(toScopeObservationMetric);

    return {
      title: view.title,
      description: view.headline,
      coverage: { label: "対象地域", value: `${prefectures.length}都道府県` },
      periodLabel: "令和5年産",
      metrics: [
        {
          id: "rice-harvest-total",
          label: "主食用米収穫量",
          value: hasCompleteHarvestCoverage
            ? numberFormatter.format(harvestTotal)
            : `データ不足（${numericHarvests.length}/${RICE_NATIONWIDE_PREFECTURE_COUNT}件）`,
          ...(hasCompleteHarvestCoverage ? { unit: "トン" } : {}),
          periodLabel: "令和5年産",
          sourceIds: [RICE_HARVEST_SOURCE_ID]
        },
        ...observationMetrics
      ],
      sourceIds: unique(layers.flatMap((layer) => layer.sourceIds))
    };
  }

  const coordinateEntities = view.entities.filter((entity) => entity.coordinates);
  return {
    title: view.title,
    description: view.headline,
    coverage: {
      label: "対象範囲",
      value: coordinateEntities.length > 0 ? `${coordinateEntities.length}地点` : `${view.entities.length}項目`
    },
    periodLabel: layers[0].periodLabel,
    metrics: view.observations
      .filter((observation) => typeof observation.value === "number")
      .map(toScopeObservationMetric),
    sourceIds: unique(layers.flatMap((layer) => layer.sourceIds))
  };
}

function toScopeObservationMetric(observation: ThemeView["observations"][number]): ScopeSummaryMetric {
  return {
    id: observation.id,
    label: localizeAnyLabel(observation.id, observation.label),
    value: formatMetricValue(observation.value),
    ...(observation.unit ? { unit: localizeUnit(observation.unit) } : {}),
    periodLabel: observation.period,
    sourceIds: observation.sourceIds
  };
}

function formatMetricValue(value: number | string): string {
  return typeof value === "number" ? numberFormatter.format(value) : value;
}

function localizeUnit(unit: string): string {
  const labels: Record<string, string> = {
    "10k_genmai_tons": "万玄米トン",
    billion_jpy: "十億円",
    bucket: "区分",
    jpy_per_60kg: "円/玄米60kg",
    percent: "%",
    qualitative: "定性"
  };

  return labels[unit] ?? unit;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
