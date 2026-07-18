import type { LayerDefinition, ThemeView } from "../../types/presentation";
import type { LiveLogisticsViewModel } from "../../types/logistics";
import type { DependencyFlow, Observation, SemanticEntity, SemanticGraph } from "../../types/semantic";
import { localizeAnyLabel } from "./japanese";
import { isRenderableMapRoute } from "./route-status";

export type JapanMapPoint = {
  id: string;
  kind: string;
  label: string;
  lat: number;
  lon: number;
  metaLabel?: string;
  selectionId?: string;
  tone: "critical" | "watch" | "normal";
};

export type JapanMapRoute = {
  id: string;
  label: string;
  pointIds: string[];
  relatedIds: string[];
};

export type JapanMapRegion = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  value: number | null;
  rawValue?: number;
  unit?: string;
  periodLabel?: string;
  sourceIds?: string[];
};

export type JapanMapCorridor = {
  id: string;
  kind: "highway" | "rail" | "port-hinterland";
  label: string;
  selectionId: string;
  value: number;
  geometry: {
    type: "Polygon";
    coordinates: Array<Array<[number, number]>>;
  };
};

export type ForeignWindowEntity = {
  id: string;
  label: string;
  flagEmoji?: string;
  summary: string;
};

export type JapanMapCanvasModel = {
  points: JapanMapPoint[];
  routes: JapanMapRoute[];
  regions: JapanMapRegion[];
  globalPoints: JapanMapPoint[];
  globalRoutes: JapanMapRoute[];
  livePoints?: JapanMapPoint[];
  liveRoutes?: JapanMapRoute[];
  liveVessels?: JapanMapPoint[];
  logisticsImpactRegions?: JapanMapRegion[];
  logisticsImpactRoutes?: JapanMapRoute[];
  logisticsImpactCorridors?: JapanMapCorridor[];
  foreignWindow?: {
    title: string;
    entities: ForeignWindowEntity[];
  };
};

export function buildJapanMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  activeId: string,
  layer: LayerDefinition | null,
  liveLogistics?: LiveLogisticsViewModel | null
): JapanMapCanvasModel {
  if (layer?.content.kind === "theme-composite" || layer === null) {
    return buildThemeWideMapCanvasModel(graph, view, activeId, liveLogistics);
  }

  switch (layer.content.kind) {
    case "regional-metric":
      return buildRegionalMetricMapCanvasModel(view, layer);
    case "observations":
      return buildObservationMapCanvasModel(graph, layer);
    case "flows":
      return buildFlowMapCanvasModel(graph, view, activeId, layer);
    case "entities":
      return buildEntityMapCanvasModel(view, layer);
    case "live-logistics":
      return buildLiveLogisticsMapCanvasModel(graph, view, layer, liveLogistics);
  }
}

function buildThemeWideMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  activeId: string,
  liveLogistics?: LiveLogisticsViewModel | null
): JapanMapCanvasModel {
  const japanEntity = graph.entities.find((entity) => entity.id === "country:japan");
  const routeScopedFlows = getRouteScopedFlows(graph, view, activeId);
  const domesticPoints = dedupeById(
    view.japanImpacts
      .filter((entity) => entity.coordinates)
      .map((entity) => toPoint(entity, classifyDomesticTone(entity)))
  );
  const visiblePoints =
    domesticPoints.length > 0 || !japanEntity?.coordinates
      ? domesticPoints
      : [toPoint(japanEntity, "watch")];

  const routes = routeScopedFlows
    .map((flow) => {
      const domesticSequence = resolveDomesticSequence(graph, flow.routeIds);

      if (domesticSequence.length < 2) {
        return null;
      }

      return {
        id: flow.id,
        label: localizeAnyLabel(flow.id, flow.label),
        pointIds: domesticSequence.map((entity) => entity.id),
        relatedIds: [flow.id, flow.originId, flow.destinationId, ...flow.routeIds]
      };
    })
    .filter((route): route is JapanMapRoute => route !== null);

  const regionCandidates = view.japanImpacts
    .filter((entity) => entity.coordinates && isRegionalMetricEntity(entity, view.id))
    .map((entity) => ({
      entity,
      metric: getRegionalMetric(entity, view.id)
    }));
  const normalizedMetrics = normalizeRegionalMetrics(
    regionCandidates.flatMap((candidate) => candidate.metric === undefined ? [] : [candidate.metric]),
    view.id
  );
  let normalizedIndex = 0;
  const regions = regionCandidates.map((candidate) => {
    const hasMetric = candidate.metric !== undefined;
    const normalizedValue = hasMetric ? normalizedMetrics[normalizedIndex++] : null;

    return {
      id: candidate.entity.id,
      label: localizeAnyLabel(candidate.entity.id, candidate.entity.label),
      lat: candidate.entity.coordinates!.lat,
      lon: candidate.entity.coordinates!.lon,
      value: normalizedValue,
      ...(hasMetric ? { rawValue: candidate.metric } : {}),
      ...(view.id === "rice"
        ? {
            unit: "トン",
            periodLabel: "令和5年産",
            sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
          }
        : {}),
      ...(view.id === "water"
        ? {
            unit: "%",
            periodLabel: "最新公表値",
            sourceIds: candidate.entity.sourceIds ?? ["source:mlit-drought-portal"]
          }
        : {})
    };
  });

  const globalPoints = buildGlobalPoints(routeScopedFlows, graph, japanEntity);
  const globalRoutes = buildGlobalRoutes(routeScopedFlows, graph, globalPoints, japanEntity);
  const liveRoutes = buildLiveRoutes(liveLogistics, graph, view.id);
  const livePoints = buildLivePoints(liveRoutes, graph);
  const liveVessels = buildLiveVessels(liveLogistics);
  const logisticsImpactRegions = buildLogisticsImpactRegions(graph, view.id);
  const logisticsImpactRoutes = view.id === "logistics" ? liveRoutes : [];
  const logisticsImpactCorridors = buildLogisticsImpactCorridors(view.id);

  return {
    points: visiblePoints,
    routes,
    regions,
    globalPoints,
    globalRoutes,
    livePoints,
    liveRoutes,
    liveVessels,
    logisticsImpactRegions,
    logisticsImpactRoutes,
    logisticsImpactCorridors,
    foreignWindow: buildForeignWindow(graph, routeScopedFlows, activeId)
  };
}

function buildRegionalMetricMapCanvasModel(
  view: ThemeView,
  layer: LayerDefinition
): JapanMapCanvasModel {
  if (layer.content.kind !== "regional-metric") {
    return emptyMapCanvasModel();
  }

  const { entityKind, property } = layer.content;
  const candidates = view.entities
    .filter((entity) => entity.kind === entityKind && entity.coordinates)
    .map((entity) => ({
      entity,
      metric: typeof entity.properties?.[property] === "number"
        ? entity.properties[property] as number
        : undefined
    }));
  const normalized = normalizeRegionalMetrics(
    candidates.flatMap((candidate) => candidate.metric === undefined ? [] : [candidate.metric]),
    view.id
  );
  let normalizedIndex = 0;

  return {
    ...emptyMapCanvasModel(),
    regions: candidates.map(({ entity, metric }) => ({
      id: entity.id,
      label: localizeAnyLabel(entity.id, entity.label),
      lat: entity.coordinates!.lat,
      lon: entity.coordinates!.lon,
      value: metric === undefined ? null : normalized[normalizedIndex++],
      ...(metric === undefined ? {} : { rawValue: metric }),
      ...(layer.legend.unit ? { unit: layer.legend.unit } : {}),
      periodLabel: layer.periodLabel,
      sourceIds: layer.sourceIds
    }))
  };
}

function buildObservationMapCanvasModel(
  graph: SemanticGraph,
  layer: LayerDefinition
): JapanMapCanvasModel {
  if (layer.content.kind !== "observations") {
    return emptyMapCanvasModel();
  }

  const observationIds = new Set(layer.content.observationIds);
  const japan = graph.entities.find((entity) => entity.id === "country:japan" && entity.coordinates);
  const points = graph.observations
    .filter((observation) => observationIds.has(observation.id))
    .flatMap((observation): JapanMapPoint[] => {
      const subject = graph.entities.find(
        (entity) => entity.id === observation.subjectId && entity.coordinates
      );
      const anchor = subject ?? japan;

      if (!anchor?.coordinates) {
        return [];
      }

      return [{
        id: observation.id,
        kind: observation.kind,
        label: localizeAnyLabel(observation.id, observation.label),
        lat: anchor.coordinates.lat,
        lon: anchor.coordinates.lon,
        metaLabel: formatObservationMetaLabel(observation),
        selectionId: observation.id,
        tone: "watch"
      }];
    });

  return { ...emptyMapCanvasModel(), points };
}

function buildFlowMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  activeId: string,
  layer: LayerDefinition
): JapanMapCanvasModel {
  if (layer.content.kind !== "flows") {
    return emptyMapCanvasModel();
  }

  const listedIds = layer.content.flowIds === "theme" ? null : new Set(layer.content.flowIds);
  const flows = view.flows.filter(
    (flow) => (listedIds === null || listedIds.has(flow.id)) && isRenderableMapRoute(flow)
  );
  const japanEntity = graph.entities.find((entity) => entity.id === "country:japan");
  const points = dedupeById(
    flows
      .flatMap((flow) => resolveDomesticSequence(graph, flow.routeIds))
      .map((entity) => toPoint(entity, classifyDomesticTone(entity)))
  );
  const routes = flows
    .map((flow) => {
      const sequence = resolveDomesticSequence(graph, flow.routeIds);
      return sequence.length < 2
        ? null
        : {
            id: flow.id,
            label: localizeAnyLabel(flow.id, flow.label),
            pointIds: sequence.map((entity) => entity.id),
            relatedIds: [flow.id, flow.originId, flow.destinationId, ...flow.routeIds]
          };
    })
    .filter((route): route is JapanMapRoute => route !== null);
  const globalPoints = buildGlobalPoints(flows, graph, japanEntity);

  return {
    ...emptyMapCanvasModel(),
    points,
    routes,
    globalPoints,
    globalRoutes: buildGlobalRoutes(flows, graph, globalPoints, japanEntity),
    foreignWindow: buildForeignWindow(graph, flows, activeId)
  };
}

function buildEntityMapCanvasModel(
  view: ThemeView,
  layer: LayerDefinition
): JapanMapCanvasModel {
  if (layer.content.kind !== "entities") {
    return emptyMapCanvasModel();
  }

  const kinds = new Set(layer.content.entityKinds);
  const points = view.entities
    .filter((entity) => kinds.has(entity.kind) && entity.coordinates)
    .map((entity) => toPoint(entity, classifyDomesticTone(entity)));

  return { ...emptyMapCanvasModel(), points: dedupeById(points) };
}

function buildLiveLogisticsMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  layer: LayerDefinition,
  liveLogistics?: LiveLogisticsViewModel | null
): JapanMapCanvasModel {
  if (layer.content.kind !== "live-logistics" || !liveLogistics) {
    return emptyMapCanvasModel();
  }

  if (layer.content.view === "arrival") {
    return {
      ...emptyMapCanvasModel(),
      liveVessels: buildLiveVessels(liveLogistics)
    };
  }

  if (layer.content.view === "impact") {
    return {
      ...emptyMapCanvasModel(),
      logisticsImpactRegions: buildLogisticsImpactRegions(graph, view.id),
      logisticsImpactCorridors: buildLogisticsImpactCorridors(view.id)
    };
  }

  const liveRoutes = buildLiveRoutes(liveLogistics, graph, view.id);
  return {
    ...emptyMapCanvasModel(),
    livePoints: buildLivePoints(liveRoutes, graph),
    liveRoutes
  };
}

function emptyMapCanvasModel(): JapanMapCanvasModel {
  return {
    points: [],
    routes: [],
    regions: [],
    globalPoints: [],
    globalRoutes: [],
    livePoints: [],
    liveRoutes: [],
    liveVessels: [],
    logisticsImpactRegions: [],
    logisticsImpactRoutes: [],
    logisticsImpactCorridors: []
  };
}

const observationNumberFormatter = new Intl.NumberFormat("ja-JP");

function formatObservationMetaLabel(observation: Observation) {
  const value = typeof observation.value === "number"
    ? observationNumberFormatter.format(observation.value)
    : observation.value;
  return [value, localizeObservationUnit(observation.unit), observation.period]
    .filter(Boolean)
    .join(" / ");
}

function localizeObservationUnit(unit: string | undefined) {
  if (!unit) {
    return undefined;
  }

  const labels: Record<string, string> = {
    "10k_genmai_tons": "万玄米トン",
    jpy_per_60kg: "円/玄米60kg",
    qualitative: "定性",
    percent: "%"
  };
  return labels[unit] ?? unit;
}

export function hasLogisticsImpactGeometry(
  graph: SemanticGraph,
  themeId: ThemeView["id"]
): boolean {
  return (
    buildLogisticsImpactRegions(graph, themeId).length > 0 ||
    buildLogisticsImpactCorridors(themeId).length > 0
  );
}

function getRouteScopedFlows(graph: SemanticGraph, view: ThemeView, activeId: string): DependencyFlow[] {
  const activeFlow = view.flows.find((flow) => flow.id === activeId);
  if (activeFlow) {
    return isRenderableMapRoute(activeFlow) ? [activeFlow] : [];
  }

  const activeEntity = graph.entities.find((entity) => entity.id === activeId);
  if (!activeEntity || !isRouteSelectableEntity(activeEntity.kind)) {
    return [];
  }

  return view.flows.filter(
    (flow) =>
      isRenderableMapRoute(flow) &&
      (flow.originId === activeId ||
        flow.destinationId === activeId ||
        flow.routeIds.includes(activeId))
  );
}

function buildGlobalPoints(
  routeScopedFlows: DependencyFlow[],
  graph: SemanticGraph,
  japanEntity?: SemanticEntity
): JapanMapPoint[] {
  const globalEntities = dedupeById(
    routeScopedFlows
      .flatMap((flow) => [flow.originId, flow.destinationId, ...flow.routeIds])
      .map((id) => graph.entities.find((entity) => entity.id === id))
      .filter((entity): entity is SemanticEntity => Boolean(entity))
      .filter(
        (entity) =>
          entity.coordinates &&
          (entity.kind === "Country" ||
            entity.kind === "Chokepoint" ||
            entity.kind === "LaunchSite" ||
            entity.kind === "ImpactArea" ||
            entity.kind === "MilitaryActivityRoute" ||
            entity.kind === "Port" ||
            entity.kind === "Terminal" ||
            entity.kind === "Refinery")
      )
  );

  if (japanEntity?.coordinates && !globalEntities.some((entity) => entity.id === japanEntity.id)) {
    globalEntities.push(japanEntity);
  }

  return globalEntities.map((entity) => toPoint(entity, classifyGlobalTone(entity)));
}

function buildGlobalRoutes(
  routeScopedFlows: DependencyFlow[],
  graph: SemanticGraph,
  globalPoints: JapanMapPoint[],
  japanEntity?: SemanticEntity
): JapanMapRoute[] {
  const pointIds = new Set(globalPoints.map((point) => point.id));

  return routeScopedFlows
    .map((flow) => {
      const globalSequence = resolveGlobalSequence(graph, flow, japanEntity)
        .filter((entity) => pointIds.has(entity.id))
        .map((entity) => entity.id);

      if (globalSequence.length < 2) {
        return null;
      }

      return {
        id: flow.id,
        label: localizeAnyLabel(flow.id, flow.label),
        pointIds: globalSequence,
        relatedIds: [flow.id, flow.originId, flow.destinationId, ...flow.routeIds]
      };
    })
    .filter((route): route is JapanMapRoute => route !== null);
}

function buildLiveRoutes(
  liveLogistics: LiveLogisticsViewModel | null | undefined,
  graph: SemanticGraph,
  themeId: ThemeView["id"]
): JapanMapRoute[] {
  if (!liveLogistics) {
    return [];
  }

  return liveLogistics.mapRoutes
    .map((route) => {
      const pointIds = route.pointIds
        .map((pointId) => graph.entities.find((entity) => entity.id === pointId))
        .filter((entity): entity is SemanticEntity => Boolean(entity) && hasCoordinates(entity))
        .filter((entity) => isLiveRoutePointVisibleForTheme(entity, themeId))
        .map((entity) => entity.id);

      if (pointIds.length < 2) {
        return null;
      }

      return {
        id: route.id,
        label: route.label,
        pointIds,
        relatedIds: route.relatedIds
      };
    })
    .filter((route): route is JapanMapRoute => route !== null);
}

function isLiveRoutePointVisibleForTheme(entity: SemanticEntity, themeId: ThemeView["id"]) {
  if (themeId !== "logistics") {
    return true;
  }

  return entity.kind !== "Country" && entity.kind !== "Chokepoint" && entity.kind !== "SeaLane";
}

function buildLivePoints(liveRoutes: JapanMapRoute[], graph: SemanticGraph): JapanMapPoint[] {
  const livePointIds = new Set(liveRoutes.flatMap((route) => route.pointIds));

  return dedupeById(
    graph.entities
      .filter((entity) => livePointIds.has(entity.id))
      .filter(hasCoordinates)
      .map((entity) => toPoint(entity, classifyLiveTone(entity)))
  );
}

function buildLiveVessels(liveLogistics: LiveLogisticsViewModel | null | undefined): JapanMapPoint[] {
  if (!liveLogistics) {
    return [];
  }

  return liveLogistics.mapVessels.map((vessel) => ({
    id: vessel.id,
    kind: "AIS supporting context",
    label: vessel.label,
    lat: vessel.lat,
    lon: vessel.lon,
    metaLabel: `${vessel.etaLabel} / ${vessel.lastSeenLabel}`,
    selectionId: resolveLiveVesselSelectionId(vessel),
    tone: "watch"
  }));
}

function buildLogisticsImpactRegions(graph: SemanticGraph, themeId: ThemeView["id"]): JapanMapRegion[] {
  if (themeId !== "logistics") {
    return [];
  }

  const regionIds = ["prefecture:tokyo", "prefecture:aichi", "prefecture:osaka"];

  return regionIds.flatMap((id, index): JapanMapRegion[] => {
    const entity = graph.entities.find((candidate) => candidate.id === id);

    if (!entity?.coordinates) {
      return [];
    }

    return [{
      id: entity.id,
      label: localizeAnyLabel(entity.id, entity.label),
      lat: entity.coordinates.lat,
      lon: entity.coordinates.lon,
      value: [92, 76, 68][index] ?? 60
    }];
  });
}

function buildLogisticsImpactCorridors(themeId: ThemeView["id"]): JapanMapCorridor[] {
  if (themeId !== "logistics") {
    return [];
  }

  return [
    {
      id: "corridor-band:tomei-shin-tomei-meishin",
      kind: "highway",
      label: "東名・新東名・名神 物流帯",
      selectionId: "live-logistics:road-keihin-tokyo",
      value: 92,
      geometry: {
        type: "Polygon",
        coordinates: [
          buildCorridorBand(
            [
              [139.66, 35.45],
              [139.28, 35.38],
              [138.92, 35.30],
              [138.48, 34.98],
              [137.73, 34.80],
              [136.90, 35.15],
              [136.18, 35.06],
              [135.50, 34.70]
            ],
            0.085
          )
        ]
      }
    },
    {
      id: "corridor-band:tokaido-rail-freight",
      kind: "rail",
      label: "東海道鉄道貨物 代替余力帯",
      selectionId: "live-logistics:rail-tokyo-aichi-osaka",
      value: 76,
      geometry: {
        type: "Polygon",
        coordinates: [
          buildCorridorBand(
            [
              [139.75, 35.62],
              [139.42, 35.48],
              [138.66, 35.13],
              [137.56, 34.91],
              [136.89, 35.18],
              [136.00, 35.01],
              [135.49, 34.72]
            ],
            0.055
          )
        ]
      }
    },
    {
      id: "corridor-band:yokohama-tokyo-port-hinterland",
      kind: "port-hinterland",
      label: "横浜港湾後背地",
      selectionId: "live-logistics:road-keihin-tokyo",
      value: 96,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [139.54, 35.36],
            [139.64, 35.31],
            [139.84, 35.43],
            [139.88, 35.58],
            [139.75, 35.72],
            [139.55, 35.70],
            [139.42, 35.56],
            [139.44, 35.43],
            [139.54, 35.36]
          ]
        ]
      }
    }
  ];
}

function resolveLiveVesselSelectionId(
  vessel: LiveLogisticsViewModel["mapVessels"][number]
) {
  return (
    vessel.selectionId
    ?? vessel.relatedIds.find((id) => id.startsWith("live-logistics:"))
    ?? (vessel.id.startsWith("live-vessel:") ? vessel.id.replace("live-vessel:", "live-logistics:") : vessel.id)
  );
}

function buildForeignWindow(
  graph: SemanticGraph,
  routeScopedFlows: DependencyFlow[],
  activeId: string
): JapanMapCanvasModel["foreignWindow"] {
  const activeFlow = routeScopedFlows.find((flow) => flow.id === activeId) ?? routeScopedFlows[0];

  if (!activeFlow) {
    return undefined;
  }

  const foreignEntities = dedupeById(
    [activeFlow.originId, ...activeFlow.routeIds]
      .map((id) => graph.entities.find((entity) => entity.id === id))
      .filter((entity): entity is SemanticEntity => Boolean(entity))
      .filter((entity) => entity.kind === "Country" || entity.kind === "Chokepoint")
      .map((entity) => ({
        id: entity.id,
        label: localizeAnyLabel(entity.id, entity.label),
        flagEmoji: entity.flagEmoji,
        summary: entity.summary
      }))
  );

  if (foreignEntities.length === 0) {
    return undefined;
  }

  return {
    title: localizeAnyLabel(activeFlow.id, activeFlow.label),
    entities: foreignEntities
  };
}

function isRouteSelectableEntity(kind: SemanticEntity["kind"]) {
  return [
    "Country",
    "Chokepoint",
    "Airport",
    "Port",
    "Terminal",
    "Refinery",
    "Prefecture",
    "Facility",
    "Reservoir",
    "Route",
    "TransportCorridor",
    "PortHinterlandCorridor",
    "HighwaySegment",
    "RailFreightCorridor",
    "DomesticDistributionNode",
    "SeaLane",
    "LaunchSite",
    "ImpactArea",
    "MilitaryActivityRoute"
  ].includes(kind);
}

function resolveDomesticSequence(
  graph: SemanticGraph,
  routeIds: string[]
): SemanticEntity[] {
  const domesticRouteEntities = routeIds
    .map((id) => graph.entities.find((entity) => entity.id === id))
    .filter((entity): entity is SemanticEntity => Boolean(entity))
    .filter((entity) => entity.coordinates && entity.kind !== "Country" && entity.kind !== "Chokepoint" && entity.kind !== "SeaLane");

  if (domesticRouteEntities.length >= 2) {
    return domesticRouteEntities;
  }

  return [];
}

function resolveGlobalSequence(
  graph: SemanticGraph,
  flow: DependencyFlow,
  japanEntity?: SemanticEntity
): SemanticEntity[] {
  const entityById = (id: string) => graph.entities.find((entity) => entity.id === id);
  const routeEntities = flow.routeIds
    .map(entityById)
    .filter(hasCoordinates);
  const origin = entityById(flow.originId);
  const destination = entityById(flow.destinationId);
  const tail =
    [...routeEntities].reverse().find((entity) => entity.kind === "Terminal" || entity.kind === "Refinery" || entity.kind === "Port") ??
    destination ??
    japanEntity;

  return dedupeById(
    [origin, ...routeEntities, tail]
      .filter(hasCoordinates)
      .filter((entity) => entity.kind !== "SeaLane")
  );
}

function toPoint(entity: SemanticEntity, tone: JapanMapPoint["tone"]): JapanMapPoint {
  return {
    id: entity.id,
    kind: entity.kind,
    label: localizeAnyLabel(entity.id, entity.label),
    lat: entity.coordinates!.lat,
    lon: entity.coordinates!.lon,
    tone
  };
}

function classifyDomesticTone(entity: SemanticEntity): JapanMapPoint["tone"] {
  if (entity.kind === "Terminal" || entity.kind === "Refinery" || entity.kind === "Reservoir") {
    return "critical";
  }

  if (entity.kind === "Airport" || entity.kind === "Port" || entity.kind === "Prefecture") {
    return "watch";
  }

  return "normal";
}

function getRegionalMetric(entity: SemanticEntity, themeId: ThemeView["id"]): number | undefined {
  const properties = entity.properties ?? {};

  if (themeId === "rice" && entity.kind === "Prefecture" && typeof properties.riceMainUseHarvestTonsR5 === "number") {
    return properties.riceMainUseHarvestTonsR5;
  }

  if (themeId === "water" && entity.kind === "Reservoir" && typeof properties.latestFillRatePercent === "number") {
    return properties.latestFillRatePercent;
  }

  return undefined;
}

function isRegionalMetricEntity(entity: SemanticEntity, themeId: ThemeView["id"]): boolean {
  return (
    (themeId === "rice" && entity.kind === "Prefecture") ||
    (themeId === "water" && entity.kind === "Reservoir")
  );
}

function normalizeRegionalMetrics(metrics: number[], themeId: ThemeView["id"]): number[] {
  if (metrics.length === 0) {
    return [];
  }

  const transformed = metrics.map((metric) => (themeId === "rice" ? Math.log10(metric + 1) : metric));
  const min = Math.min(...transformed);
  const max = Math.max(...transformed);

  if (min === max) {
    return transformed.map(() => 65);
  }

  return transformed.map((metric) => 35 + ((metric - min) / (max - min)) * 65);
}

function classifyGlobalTone(entity: SemanticEntity): JapanMapPoint["tone"] {
  if (entity.kind === "Chokepoint" || entity.kind === "Terminal" || entity.kind === "Refinery") {
    return "critical";
  }

  if (entity.kind === "ImpactArea" || entity.kind === "LaunchSite") {
    return "critical";
  }

  if (entity.kind === "MilitaryActivityRoute") {
    return "watch";
  }

  if (entity.kind === "Country" || entity.kind === "Port") {
    return "watch";
  }

  return "normal";
}

function classifyLiveTone(entity: SemanticEntity): JapanMapPoint["tone"] {
  if (entity.kind === "Chokepoint" || entity.kind === "Terminal" || entity.kind === "Refinery") {
    return "critical";
  }

  if (entity.kind === "Airport" || entity.kind === "Port" || entity.kind === "Country" || entity.kind === "Prefecture") {
    return "watch";
  }

  return "normal";
}

function buildCorridorBand(path: Array<[number, number]>, widthDegrees: number): Array<[number, number]> {
  if (path.length < 2) {
    return path;
  }

  const left = path.map((point, index) => {
    const previous = path[Math.max(0, index - 1)];
    const next = path[Math.min(path.length - 1, index + 1)];
    const normal = getNormalizedNormal(previous, next);

    return [point[0] + normal[0] * widthDegrees, point[1] + normal[1] * widthDegrees] as [number, number];
  });
  const right = path
    .map((point, index) => {
      const previous = path[Math.max(0, index - 1)];
      const next = path[Math.min(path.length - 1, index + 1)];
      const normal = getNormalizedNormal(previous, next);

      return [point[0] - normal[0] * widthDegrees, point[1] - normal[1] * widthDegrees] as [number, number];
    })
    .toReversed();
  const ring = [...left, ...right];

  return [...ring, ring[0]];
}

function getNormalizedNormal(
  previous: [number, number],
  next: [number, number]
): [number, number] {
  const dx = next[0] - previous[0];
  const dy = next[1] - previous[1];
  const length = Math.hypot(dx, dy) || 1;

  return [-dy / length, dx / length];
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function hasCoordinates(entity: SemanticEntity | undefined): entity is SemanticEntity {
  return Boolean(entity?.coordinates);
}
