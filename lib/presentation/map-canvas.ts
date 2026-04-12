import type { ThemeView } from "../../types/presentation";
import type { DependencyFlow, SemanticEntity, SemanticGraph } from "../../types/semantic";
import { localizeAnyLabel } from "./japanese";
import { isRenderableMapRoute } from "./route-status";

export type JapanMapPoint = {
  id: string;
  kind: string;
  label: string;
  lat: number;
  lon: number;
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
  value: number;
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
  foreignWindow?: {
    title: string;
    entities: ForeignWindowEntity[];
  };
};

export function buildJapanMapCanvasModel(
  graph: SemanticGraph,
  view: ThemeView,
  activeId: string
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
    .filter((entity) => entity.coordinates && (entity.kind === "Prefecture" || entity.kind === "Reservoir"))
    .map((entity) => ({
      entity,
      metric: getRegionalMetric(entity, view.id)
    }))
    .filter((candidate): candidate is { entity: SemanticEntity; metric: number } => candidate.metric !== undefined);
  const normalizedMetrics = normalizeRegionalMetrics(regionCandidates.map((candidate) => candidate.metric), view.id);
  const regions = regionCandidates.map((candidate, index) => ({
    id: candidate.entity.id,
    label: localizeAnyLabel(candidate.entity.id, candidate.entity.label),
    lat: candidate.entity.coordinates!.lat,
    lon: candidate.entity.coordinates!.lon,
    value: normalizedMetrics[index]
  }));

  const globalPoints = buildGlobalPoints(routeScopedFlows, graph, japanEntity);
  const globalRoutes = buildGlobalRoutes(routeScopedFlows, graph, globalPoints, japanEntity);

  return {
    points: visiblePoints,
    routes,
    regions,
    globalPoints,
    globalRoutes,
    foreignWindow: buildForeignWindow(graph, routeScopedFlows, activeId)
  };
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
    "Port",
    "Terminal",
    "Refinery",
    "Prefecture",
    "Facility",
    "Reservoir",
    "Route",
    "SeaLane"
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

  if (entity.kind === "Port" || entity.kind === "Prefecture") {
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

  if (entity.kind === "Country" || entity.kind === "Port") {
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
