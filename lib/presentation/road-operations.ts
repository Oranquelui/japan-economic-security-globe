import type {
  RoadConditionFreshness,
  RoadOperationsDataset,
  RoadOperationsViewModel,
  RoadProviderState,
  RoadSegment,
  RoadConditionViewModel,
  RoadRestrictionViewModel,
  RoadProviderPolicy,
  RouteImpactSummary
} from "../../types/road-operations";
import {
  isAbsoluteRoadTimestamp,
  normalizeRoadQuantitativeField
} from "../road-operations/provider-adapter";

function hasFiniteLineGeometry(segment: RoadSegment): boolean {
  return segment.coordinates.length >= 2 && segment.coordinates.every(
    (coordinate) => coordinate.length === 2 && coordinate.every(Number.isFinite)
  );
}

function compareOperationalTimes(
  left: { id: string; providerObservedAt: string; retrievedAt: string },
  right: { id: string; providerObservedAt: string; retrievedAt: string }
): number {
  return Date.parse(left.providerObservedAt) - Date.parse(right.providerObservedAt) ||
    Date.parse(left.retrievedAt) - Date.parse(right.retrievedAt) ||
    left.id.localeCompare(right.id);
}

export function deriveRoadConditionFreshness(
  providerObservedAt: string,
  retrievedAt: string,
  now: Date,
  policy: RoadProviderPolicy | undefined
): RoadConditionFreshness {
  if (!policy || !isAbsoluteRoadTimestamp(providerObservedAt) || !isAbsoluteRoadTimestamp(retrievedAt)) {
    return "unknown";
  }
  const observedMs = Date.parse(providerObservedAt);
  const retrievedMs = Date.parse(retrievedAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs) || observedMs > retrievedMs || retrievedMs > nowMs) return "unknown";
  const ageSeconds = (nowMs - observedMs) / 1_000;
  if (ageSeconds <= policy.currentMaxAgeSeconds) return "current";
  if (ageSeconds <= policy.freshnessLimitSeconds) return "delayed";
  return "stale";
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
  const deriveFreshness = (item: { dataPosture: string; providerObservedAt: string; retrievedAt: string }) => (
    item.dataPosture === "fixed-demo"
      ? "stale" as const
      : dataset.provider?.state === "unavailable"
      ? "unavailable" as const
      : deriveRoadConditionFreshness(
          item.providerObservedAt,
          item.retrievedAt,
          now,
          dataset.provider?.policy
        )
  );
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
      freshness: deriveFreshness(item),
      displayLifecycleLabel: item.dataPosture === "fixed-demo"
        ? "デモシナリオ内で発生中"
        : null,
      speed: normalizeRoadQuantitativeField(item.speed, "speed"),
      congestionLength: normalizeRoadQuantitativeField(item.congestionLength, "congestionLength"),
      delay: normalizeRoadQuantitativeField(item.delay, "delay"),
      travelTime: normalizeRoadQuantitativeField(item.travelTime, "travelTime")
    }));
  const restrictions: RoadRestrictionViewModel[] = (dataset.restrictionEvents ?? [])
    .filter((item) => {
      const matchedSegment = segmentById.get(item.segmentId);
      return Boolean(item.direction && matchedSegment && item.direction === matchedSegment.direction);
    })
    .map((item) => ({
      ...item,
      freshness: deriveFreshness(item),
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
    ? conditions
        .filter((item) => item.freshness === "current" && item.dataPosture !== "fixed-demo")
        .sort(compareOperationalTimes)
    : [];
  const currentRestrictions = provider.state === "available"
    ? restrictions
        .filter((item) => (
          item.freshness === "current" && item.lifecycle === "current" && item.dataPosture !== "fixed-demo"
        ))
        .sort(compareOperationalTimes)
    : [];
  const segments = validSegments.map((segment) => {
    const matches = conditions.filter((item) => (
      item.segmentId === segment.id && item.direction === segment.direction
    ));
    const currentMatches = currentConditions.filter((item) => (
      item.segmentId === segment.id && item.direction === segment.direction
    ));
    return {
      ...segment,
      condition: currentMatches.at(-1)?.condition ?? ("unknown" as const),
      conditionIds: matches.map((item) => item.id),
      restrictionIds: restrictions.filter((item) => (
        item.segmentId === segment.id && item.direction === segment.direction
      )).map((item) => item.id)
    };
  });
  const rejectedSegmentIds = allSegments
    .filter((segment) => !hasFiniteLineGeometry(segment))
    .map((segment) => segment.id);
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
