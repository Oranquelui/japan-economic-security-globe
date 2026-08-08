import type { LayerDefinition, ThemeView } from "../../types/presentation";
import type {
  LiveLogisticsMapRoute,
  LiveLogisticsViewModel
} from "../../types/logistics";
import type {
  RoadConditionFreshness,
  RoadConditionKind,
  RoadCoordinate,
  RoadDataPosture,
  RoadDirection,
  RoadEventLifecycle,
  RoadRestrictionKind,
  RoadOperationsViewModel
} from "../../types/road-operations";
import type { DependencyFlow, Observation, SemanticEntity, SemanticGraph } from "../../types/semantic";
import { prefectureBoundaryByEntityId } from "../geo/prefecture-boundaries";
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

export type JapanMapLogisticsRoute = JapanMapRoute & {
  laneId: LiveLogisticsMapRoute["laneId"];
  modeLabel: LiveLogisticsMapRoute["modeLabel"];
  selectionId: string;
  selected: boolean;
};

export type JapanMapRoadSegment = {
  id: string;
  routeId: string;
  routeLabel: string;
  label: string;
  roadName: string;
  routeNumber: string;
  direction: RoadDirection;
  coordinates: RoadCoordinate[];
  condition: RoadConditionKind | "unknown";
  conditionIds: string[];
  restrictionIds: string[];
  sourceIds: string[];
  selectionId: string;
  selected: boolean;
};

export type JapanMapRoadOperationVisualKind =
  | RoadConditionKind
  | RoadRestrictionKind
  | "unknown";

export type JapanMapRoadOperationalOverlay = {
  id: string;
  segmentId: string;
  routeId: string;
  label: string;
  roadName: string;
  routeNumber: string;
  direction: RoadDirection;
  coordinates: RoadCoordinate[];
  recordType: "condition" | "restriction" | "unknown";
  visualKind: JapanMapRoadOperationVisualKind;
  condition: RoadConditionKind | null;
  restrictionKind: RoadRestrictionKind | null;
  lifecycle: RoadEventLifecycle;
  freshness: RoadConditionFreshness;
  dataPosture: RoadDataPosture;
  stateLabel: string;
  disclosureLabel: string;
  selectionId: string;
  selected: boolean;
};

export type JapanMapRoadJunction = {
  id: string;
  routeId: string;
  label: string;
  coordinates: RoadCoordinate;
  sourceIds: string[];
  selectionId: string;
  selected: boolean;
};

type JapanMapRegionCommon = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  unit?: string;
  periodLabel?: string;
  sourceIds?: string[];
};

type JapanMapRegionMetricState =
  | { value: number; rawValue: number }
  | { value: null; rawValue?: never };

export type PrefectureBoundaryMapRegion = JapanMapRegionCommon &
  { geometryKind: "prefecture-boundary"; prefectureCode: `JP-${string}` } &
  JapanMapRegionMetricState;

export type RepresentativeRadiusMapRegion = JapanMapRegionCommon &
  { geometryKind: "representative-radius"; prefectureCode?: never } &
  JapanMapRegionMetricState;

export type JapanMapRegion = PrefectureBoundaryMapRegion | RepresentativeRadiusMapRegion;

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
  liveRoutes?: JapanMapLogisticsRoute[];
  liveVessels?: JapanMapPoint[];
  roadSegments?: JapanMapRoadSegment[];
  roadOperationalOverlays?: JapanMapRoadOperationalOverlay[];
  roadJunctions?: JapanMapRoadJunction[];
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
  liveLogistics?: LiveLogisticsViewModel | null,
  roadOperations?: RoadOperationsViewModel | null
): JapanMapCanvasModel {
  if (layer?.content.kind === "theme-composite" || layer === null) {
    return buildThemeWideMapCanvasModel(graph, view, activeId, liveLogistics, roadOperations);
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
      return buildLiveLogisticsMapCanvasModel(
        graph,
        view,
        activeId,
        layer,
        liveLogistics,
        roadOperations
      );
  }
}

function buildThemeWideMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  activeId: string,
  liveLogistics?: LiveLogisticsViewModel | null,
  roadOperations?: RoadOperationsViewModel | null
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
    const metricState: JapanMapRegionMetricState = candidate.metric === undefined
      ? { value: null }
      : {
          value: normalizedMetrics[normalizedIndex++],
          rawValue: candidate.metric
        };

    return {
      id: candidate.entity.id,
      label: localizeAnyLabel(candidate.entity.id, candidate.entity.label),
      lat: candidate.entity.coordinates!.lat,
      lon: candidate.entity.coordinates!.lon,
      geometryKind: "representative-radius" as const,
      ...metricState,
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
  const { roadSegments, roadOperationalOverlays, roadJunctions, detailedRouteIds } = buildDetailedRoadModel(
    view.id,
    roadOperations,
    activeId
  );
  const liveRoutes = buildLiveRoutes(
    liveLogistics,
    graph,
    view.id,
    activeId,
    detailedRouteIds
  );
  const livePoints = buildLivePoints(liveRoutes, graph);
  const liveVessels = buildLiveVessels(liveLogistics);

  return {
    points: visiblePoints,
    routes,
    regions,
    globalPoints,
    globalRoutes,
    livePoints,
    liveRoutes,
    liveVessels,
    roadSegments,
    roadOperationalOverlays,
    roadJunctions,
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
    .map((entity) => {
      const value = entity.properties?.[property];
      return {
        entity,
        metric: typeof value === "number" && Number.isFinite(value)
          ? value
          : undefined
      };
    });
  const normalized = normalizeRegionalMetrics(
    candidates.flatMap((candidate) => candidate.metric === undefined ? [] : [candidate.metric]),
    view.id
  );
  let normalizedIndex = 0;
  const usesPrefectureBoundary = entityKind === "Prefecture";

  return {
    ...emptyMapCanvasModel(),
    regions: candidates.map(({ entity, metric }) => {
      const common = {
        id: entity.id,
        label: localizeAnyLabel(entity.id, entity.label),
        lat: entity.coordinates!.lat,
        lon: entity.coordinates!.lon,
        ...(layer.legend.unit ? { unit: layer.legend.unit } : {}),
        periodLabel: layer.periodLabel,
        sourceIds: layer.sourceIds
      };

      if (usesPrefectureBoundary) {
        const boundary = prefectureBoundaryByEntityId.get(
          entity.id as `prefecture:${string}`
        );
        if (!boundary) {
          throw new Error(`Missing prefecture boundary for entityId: ${entity.id}`);
        }
        if (metric === undefined) {
          return {
            ...common,
            geometryKind: "prefecture-boundary" as const,
            prefectureCode: boundary.properties.prefectureCode,
            value: null
          };
        }
        return {
          ...common,
          geometryKind: "prefecture-boundary" as const,
          prefectureCode: boundary.properties.prefectureCode,
          value: normalized[normalizedIndex++],
          rawValue: metric
        };
      }

      if (metric === undefined) {
        return {
          ...common,
          geometryKind: "representative-radius" as const,
          value: null
        };
      }
      return {
        ...common,
        geometryKind: "representative-radius" as const,
        value: normalized[normalizedIndex++],
        rawValue: metric
      };
    })
  };
}

function buildObservationMapCanvasModel(
  graph: SemanticGraph,
  layer: LayerDefinition
): JapanMapCanvasModel {
  if (layer.content.kind !== "observations") {
    return emptyMapCanvasModel();
  }

  const japan = graph.entities.find((entity) => entity.id === "country:japan" && entity.coordinates);
  const observationsById = new Map(graph.observations.map((observation) => [observation.id, observation]));
  const resolvedObservations = layer.content.observationIds
    .flatMap((id) => {
      const observation = observationsById.get(id);
      return observation ? [observation] : [];
    })
    .map((observation) => ({
      observation,
      subject: graph.entities.find(
        (entity) => entity.id === observation.subjectId && entity.coordinates
      )
    }));
  const fallbackTotal = resolvedObservations.filter(({ subject }) => !subject).length;
  let fallbackIndex = 0;
  const points = resolvedObservations
    .flatMap(({ observation, subject }): JapanMapPoint[] => {
      const coordinates = subject?.coordinates
        ?? (japan?.coordinates
          ? offsetFallbackObservation(japan.coordinates, fallbackIndex++, fallbackTotal)
          : undefined);

      if (!coordinates) {
        return [];
      }

      return [{
        id: observation.id,
        kind: observation.kind,
        label: localizeAnyLabel(observation.id, observation.label),
        lat: coordinates.lat,
        lon: coordinates.lon,
        metaLabel: formatObservationMetaLabel(observation),
        selectionId: observation.id,
        tone: "watch"
      }];
    });

  return { ...emptyMapCanvasModel(), points };
}

function offsetFallbackObservation(
  anchor: { lat: number; lon: number },
  index: number,
  total: number
) {
  if (total <= 1) {
    return anchor;
  }

  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    lat: anchor.lat + Math.sin(angle) * 0.32,
    lon: anchor.lon + Math.cos(angle) * 0.4
  };
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
  activeId: string,
  layer: LayerDefinition,
  liveLogistics?: LiveLogisticsViewModel | null,
  roadOperations?: RoadOperationsViewModel | null
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
    return emptyMapCanvasModel();
  }

  const { roadSegments, roadOperationalOverlays, roadJunctions, detailedRouteIds } = buildDetailedRoadModel(
    view.id,
    roadOperations,
    activeId
  );
  const liveRoutes = buildLiveRoutes(
    liveLogistics,
    graph,
    view.id,
    activeId,
    detailedRouteIds
  );
  return {
    ...emptyMapCanvasModel(),
    livePoints: buildLivePoints(liveRoutes, graph),
    liveRoutes,
    roadSegments,
    roadOperationalOverlays,
    roadJunctions
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
    roadSegments: [],
    roadOperationalOverlays: [],
    roadJunctions: [],
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
  themeId: ThemeView["id"],
  activeId: string,
  detailedRouteIds: ReadonlySet<string>
): JapanMapLogisticsRoute[] {
  if (!liveLogistics) {
    return [];
  }

  return liveLogistics.mapRoutes
    .filter((route) => !detailedRouteIds.has(route.id))
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
        relatedIds: route.relatedIds,
        laneId: route.laneId,
        modeLabel: route.modeLabel,
        selectionId: route.id,
        selected: isActiveSelection(activeId, [route.id, ...route.relatedIds, ...pointIds])
      };
    })
    .filter((route): route is JapanMapLogisticsRoute => route !== null);
}

function buildDetailedRoadModel(
  themeId: ThemeView["id"],
  roadOperations: RoadOperationsViewModel | null | undefined,
  activeId: string
): {
  roadSegments: JapanMapRoadSegment[];
  roadOperationalOverlays: JapanMapRoadOperationalOverlay[];
  roadJunctions: JapanMapRoadJunction[];
  detailedRouteIds: Set<string>;
} {
  if (themeId !== "logistics" || !roadOperations) {
    return {
      roadSegments: [],
      roadOperationalOverlays: [],
      roadJunctions: [],
      detailedRouteIds: new Set()
    };
  }

  const detailedRouteIds = getCompleteDetailedRoadRouteIds(roadOperations);
  const routeById = new Map(roadOperations.routes.map((route) => [route.id, route]));
  const roadSegments = roadOperations.segments.flatMap((segment): JapanMapRoadSegment[] => {
    const route = routeById.get(segment.routeId);
    if (!route || !detailedRouteIds.has(segment.routeId)) return [];
    return [{
      id: segment.id,
      routeId: segment.routeId,
      routeLabel: route.label,
      label: segment.label,
      roadName: segment.roadName,
      routeNumber: segment.routeNumber,
      direction: segment.direction,
      coordinates: segment.coordinates,
      condition: segment.condition,
      conditionIds: segment.conditionIds,
      restrictionIds: segment.restrictionIds,
      sourceIds: segment.sourceIds,
      selectionId: segment.routeId,
      selected: isActiveSelection(activeId, [
        segment.id,
        segment.routeId,
        ...segment.conditionIds,
        ...segment.restrictionIds
      ])
    }];
  });
  const segmentById = new Map(roadSegments.map((segment) => [segment.id, segment]));
  const recordsBySegmentId = new Map<string, JapanMapRoadOperationalOverlay[]>();
  for (const condition of roadOperations.conditions) {
    const segment = segmentById.get(condition.segmentId);
    if (!segment) continue;
    const overlay = buildRoadOperationalOverlay(segment, condition, activeId);
    recordsBySegmentId.set(condition.segmentId, [
      ...(recordsBySegmentId.get(condition.segmentId) ?? []),
      overlay
    ]);
  }
  for (const restriction of roadOperations.restrictions) {
    const segment = segmentById.get(restriction.segmentId);
    if (!segment) continue;
    const overlay = buildRoadOperationalOverlay(segment, restriction, activeId);
    recordsBySegmentId.set(restriction.segmentId, [
      ...(recordsBySegmentId.get(restriction.segmentId) ?? []),
      overlay
    ]);
  }
  const roadOperationalOverlays = roadSegments.flatMap((segment) => {
    const overlays = recordsBySegmentId.get(segment.id) ?? [];
    if (overlays.length > 0) return overlays;
    return [buildUnknownRoadOperationalOverlay(segment, roadOperations, activeId)];
  });
  const representedRouteIds = new Set(roadSegments.map((segment) => segment.routeId));
  const roadJunctions = roadOperations.junctions
    .filter((junction) => representedRouteIds.has(junction.routeId))
    .map((junction): JapanMapRoadJunction => ({
      id: junction.id,
      routeId: junction.routeId,
      label: junction.label,
      coordinates: junction.coordinates,
      sourceIds: junction.sourceIds,
      selectionId: junction.routeId,
      selected: isActiveSelection(activeId, [junction.id, junction.routeId])
    }));

  return { roadSegments, roadOperationalOverlays, roadJunctions, detailedRouteIds };
}

function buildRoadOperationalOverlay(
  segment: JapanMapRoadSegment,
  record: RoadOperationsViewModel["conditions"][number] | RoadOperationsViewModel["restrictions"][number],
  activeId: string
): JapanMapRoadOperationalOverlay {
  const unavailable = record.freshness === "unavailable" || record.freshness === "unknown";
  const isCondition = record.recordType === "condition";
  const visualKind = unavailable
    ? "unknown" as const
    : isCondition
      ? record.condition
      : record.restrictionKind;
  const lifecycle = isCondition ? "current" as const : record.lifecycle;
  return {
    id: record.id,
    segmentId: segment.id,
    routeId: segment.routeId,
    label: `${segment.label} / ${formatRoadOperationStateLabel(record)}`,
    roadName: segment.roadName,
    routeNumber: segment.routeNumber,
    direction: segment.direction,
    coordinates: segment.coordinates,
    recordType: record.recordType,
    visualKind,
    condition: isCondition ? record.condition : null,
    restrictionKind: isCondition ? null : record.restrictionKind,
    lifecycle,
    freshness: record.freshness,
    dataPosture: record.dataPosture,
    stateLabel: unavailable ? "状況不明" : formatRoadOperationStateLabel(record),
    disclosureLabel: record.disclosureLabel,
    selectionId: record.id,
    selected: isActiveSelection(activeId, [record.id])
  };
}

function buildUnknownRoadOperationalOverlay(
  segment: JapanMapRoadSegment,
  roadOperations: RoadOperationsViewModel,
  activeId: string
): JapanMapRoadOperationalOverlay {
  const freshness = roadOperations.provider.state === "unavailable" ? "unavailable" : "unknown";
  return {
    id: `${segment.id}:unknown`,
    segmentId: segment.id,
    routeId: segment.routeId,
    label: `${segment.label} / 状況不明`,
    roadName: segment.roadName,
    routeNumber: segment.routeNumber,
    direction: segment.direction,
    coordinates: segment.coordinates,
    recordType: "unknown",
    visualKind: "unknown",
    condition: null,
    restrictionKind: null,
    lifecycle: "current",
    freshness,
    dataPosture: roadOperations.provider.dataPosture,
    stateLabel: "状況不明",
    disclosureLabel: roadOperations.provider.label,
    selectionId: segment.routeId,
    selected: isActiveSelection(activeId, [segment.routeId])
  };
}

function formatRoadOperationStateLabel(
  record: RoadOperationsViewModel["conditions"][number] | RoadOperationsViewModel["restrictions"][number]
): string {
  const base = record.recordType === "condition"
    ? ({ normal: "平常", slow: "低速", congestion: "渋滞" } as const)[record.condition]
    : ({
        accident: "事故",
        construction: "工事",
        "lane-restriction": "車線規制",
        closure: "通行止",
        other: "規制"
      } as const)[record.restrictionKind];
  const withPosture = record.dataPosture === "fixed-demo" ? `${base}例` : base;
  const withLifecycle = record.recordType === "restriction" && record.lifecycle === "planned"
    ? `予定 ${withPosture}`
    : record.recordType === "restriction" && record.lifecycle === "ended"
      ? `${withPosture}・終了`
      : withPosture;
  return record.freshness === "stale" ? `${withLifecycle}・期限切れ` : withLifecycle;
}

function getCompleteDetailedRoadRouteIds(
  roadOperations: RoadOperationsViewModel
): Set<string> {
  return new Set(roadOperations.routes.flatMap((route) => {
    const expectedSegmentIds = new Set(route.segmentIds);
    const routeSegments = roadOperations.segments.filter((segment) => segment.routeId === route.id);
    const actualSegmentIds = new Set(routeSegments.map((segment) => segment.id));
    const isComplete = (
      route.segmentIds.length > 0 &&
      expectedSegmentIds.size === route.segmentIds.length &&
      actualSegmentIds.size === routeSegments.length &&
      actualSegmentIds.size === expectedSegmentIds.size &&
      [...expectedSegmentIds].every((segmentId) => actualSegmentIds.has(segmentId)) &&
      routeSegments.every((segment) => (
        hasValidDetailedRoadGeometry(segment.coordinates)
      ))
    );
    return isComplete ? [route.id] : [];
  }));
}

function hasValidDetailedRoadGeometry(coordinates: readonly RoadCoordinate[]): boolean {
  return coordinates.length >= 2 && coordinates.every(
    (coordinate) => coordinate.length === 2 && coordinate.every(Number.isFinite)
  );
}

function isActiveSelection(activeId: string, relatedIds: readonly string[]): boolean {
  return activeId.trim().length > 0 && relatedIds.includes(activeId);
}

function isLiveRoutePointVisibleForTheme(entity: SemanticEntity, themeId: ThemeView["id"]) {
  if (themeId !== "logistics") {
    return true;
  }

  return entity.kind !== "Country" && entity.kind !== "Chokepoint" && entity.kind !== "SeaLane";
}

function buildLivePoints(liveRoutes: JapanMapLogisticsRoute[], graph: SemanticGraph): JapanMapPoint[] {
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

  if (
    themeId === "rice" &&
    entity.kind === "Prefecture" &&
    typeof properties.riceMainUseHarvestTonsR5 === "number" &&
    Number.isFinite(properties.riceMainUseHarvestTonsR5)
  ) {
    return properties.riceMainUseHarvestTonsR5;
  }

  if (
    themeId === "water" &&
    entity.kind === "Reservoir" &&
    typeof properties.latestFillRatePercent === "number" &&
    Number.isFinite(properties.latestFillRatePercent)
  ) {
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function hasCoordinates(entity: SemanticEntity | undefined): entity is SemanticEntity {
  return Boolean(entity?.coordinates);
}
