import type {
  RoadConditionFreshness,
  RoadOperationsDataset,
  RoadOperationsViewModel,
  RoadProviderState,
  RoadSegment,
  RoadConditionViewModel,
  RoadRestrictionViewModel,
  RoadQuantitativeField,
  RouteImpactSummary
} from "../../types/road-operations";

function hasFiniteLineGeometry(segment: RoadSegment): boolean {
  return segment.coordinates.length >= 2 && segment.coordinates.every(
    (coordinate) => coordinate.length === 2 && coordinate.every(Number.isFinite)
  );
}

export function deriveRoadConditionFreshness(retrievedAt: string, now: Date): RoadConditionFreshness {
  const retrievedMs = Date.parse(retrievedAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(retrievedMs) || !Number.isFinite(nowMs) || retrievedMs > nowMs) return "unknown";
  const ageMinutes = (nowMs - retrievedMs) / 60_000;
  if (ageMinutes <= 10) return "current";
  if (ageMinutes <= 30) return "delayed";
  return "stale";
}

function normalizeQuantity(field: RoadQuantitativeField | undefined): RoadQuantitativeField | undefined {
  return typeof field?.value === "number" && typeof field.unit === "string" && typeof field.observedAt === "string"
    ? { value: field.value, unit: field.unit, observedAt: field.observedAt }
    : undefined;
}

export function buildRoadOperationsView(
  dataset: RoadOperationsDataset | null,
  now: Date
): RoadOperationsViewModel | null {
  if (!dataset) return null;

  const allSegments = dataset.segments ?? [];
  const validSegments = allSegments.filter(hasFiniteLineGeometry);
  const segmentById = new Map(validSegments.map((segment) => [segment.id, segment]));
  const unmatchedSegmentIds = [...(dataset.ingestDiagnostics?.unmatchedSegmentIds ?? [])];
  const rejectedRecords = [...(dataset.ingestDiagnostics?.rejectedRecords ?? [])];
  for (const item of [
    ...(dataset.conditionObservations ?? []),
    ...(dataset.restrictionEvents ?? [])
  ]) {
    if (!item.direction) {
      rejectedRecords.push({ providerRecordId: item.id, reason: "direction is required" });
    } else if (!segmentById.has(item.segmentId) && !unmatchedSegmentIds.includes(item.segmentId)) {
      unmatchedSegmentIds.push(item.segmentId);
    }
  }
  const conditions: RoadConditionViewModel[] = (dataset.conditionObservations ?? [])
    .filter((item) => {
      const matchedSegment = segmentById.get(item.segmentId);
      return Boolean(item.direction && matchedSegment && item.direction === matchedSegment.direction);
    })
    .map((item) => ({
      ...item,
      freshness: item.freshness ?? deriveRoadConditionFreshness(item.retrievedAt, now),
      displayLifecycleLabel: item.dataPosture === "fixed-demo"
        ? "デモシナリオ内で発生中"
        : null,
      speed: normalizeQuantity(item.speed),
      congestionLength: normalizeQuantity(item.congestionLength),
      delay: normalizeQuantity(item.delay),
      travelTime: normalizeQuantity(item.travelTime)
    }));
  const restrictions: RoadRestrictionViewModel[] = (dataset.restrictionEvents ?? [])
    .filter((item) => {
      const matchedSegment = segmentById.get(item.segmentId);
      return Boolean(item.direction && matchedSegment && item.direction === matchedSegment.direction);
    })
    .map((item) => ({
      ...item,
      freshness: item.freshness ?? deriveRoadConditionFreshness(item.retrievedAt, now),
      displayLifecycleLabel: item.dataPosture === "fixed-demo"
        ? item.lifecycle === "current"
          ? "デモシナリオ内で発生中"
          : item.lifecycle === "planned"
            ? "デモシナリオ内の予定"
            : "デモシナリオ内で終了"
        : item.lifecycle === "current"
          ? "発生中"
          : item.lifecycle === "planned"
            ? "予定"
            : "終了"
    }));
  const segments = validSegments.map((segment) => {
    const matches = conditions.filter((item) => (
      item.segmentId === segment.id && item.direction === segment.direction
    ));
    return {
      ...segment,
      condition: (dataset.provider?.state ?? "unavailable") === "unavailable"
        ? ("unknown" as const)
        : matches.at(-1)?.condition ?? ("unknown" as const),
      conditionIds: matches.map((item) => item.id),
      restrictionIds: restrictions.filter((item) => (
        item.segmentId === segment.id && item.direction === segment.direction
      )).map((item) => item.id)
    };
  });
  const rejectedSegmentIds = allSegments
    .filter((segment) => !hasFiniteLineGeometry(segment))
    .map((segment) => segment.id);
  const provider: RoadProviderState = dataset.provider?.state === "unavailable"
    ? { ...dataset.provider, label: "公式道路交通フィード未接続" }
    : dataset.provider ?? {
        id: "provider:none",
        label: "公式道路交通フィード未接続",
        state: "unavailable",
        dataPosture: "authorized-provider",
        sourceIds: []
      };
  const currentConditions = provider.state === "available"
    ? conditions.filter((item) => item.freshness === "current")
    : [];
  const currentRestrictions = provider.state === "available"
    ? restrictions.filter((item) => item.freshness === "current" && item.lifecycle === "current")
    : [];
  const routeImpacts: RouteImpactSummary[] = dataset.routes.flatMap((route) => {
    const routeSegmentIds = new Set(validSegments.filter((item) => item.routeId === route.id).map((item) => item.id));
    const citedConditions = currentConditions.filter((item) => (
      routeSegmentIds.has(item.segmentId) && item.sourceIds.length > 0
    ));
    const citedRestrictions = currentRestrictions.filter((item) => (
      routeSegmentIds.has(item.segmentId) && item.sourceIds.length > 0
    ));
    const records = [...citedConditions, ...citedRestrictions];
    if (records.length === 0) return [];
    return [{
      routeId: route.id,
      affectedSegmentIds: [...new Set(records.map((item) => item.segmentId))],
      conditionIds: citedConditions.map((item) => item.id),
      restrictionIds: citedRestrictions.map((item) => item.id),
      sourceIds: [...new Set(records.flatMap((item) => item.sourceIds))],
      citations: records.map((item) => ({ recordId: item.id, sourceIds: item.sourceIds }))
    }];
  });

  return {
    routes: dataset.routes,
    segments,
    junctions: dataset.junctions ?? [],
    conditions,
    restrictions,
    provider,
    diagnostics: {
      unmatchedSegmentIds,
      rejectedRecords,
      rejectedSegmentIds
    },
    currentSummary: {
      conditionIds: currentConditions.map((item) => item.id),
      restrictionIds: currentRestrictions.map((item) => item.id),
      routeImpacts
    },
    counts: {
      routeCount: dataset.routes.length,
      modeCount: dataset.routes.length > 0 ? 1 : 0,
      segmentCount: segments.length
    }
  };
}
