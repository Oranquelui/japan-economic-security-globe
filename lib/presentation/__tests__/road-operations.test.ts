import { describe, expect, test } from "vitest";

import { loadSeedRoadOperations } from "../../data/seed-loader";
import { buildRoadOperationsView } from "../road-operations";
import type {
  RoadConditionObservation,
  RoadOperationsDataset,
  RoadRestrictionEvent,
  RoadSegment
} from "../../../types/road-operations";

const NOW = new Date("2026-08-08T09:00:00+09:00");

function segment(overrides: Partial<RoadSegment> = {}): RoadSegment {
  return {
    id: "road-segment:honmoku-daikoku-east",
    routeId: "live-logistics:road-keihin-tokyo",
    label: "本牧JCT → 大黒JCT",
    fromAnchorId: "road-junction:honmoku-jct",
    toAnchorId: "road-junction:daikoku-jct",
    direction: "東行き",
    coordinates: [[139.666, 35.417], [139.691, 35.462]],
    sourceIds: ["source:openstreetmap-road-geometry"],
    ...overrides
  };
}

function dataset(overrides: Partial<RoadOperationsDataset> = {}): RoadOperationsDataset {
  const seed = structuredClone(loadSeedRoadOperations());
  seed.routes[0].segmentIds = ["road-segment:honmoku-daikoku-east"];
  return {
    ...seed,
    segments: [segment()],
    junctions: [],
    conditionObservations: [],
    restrictionEvents: [],
    provider: {
      id: "provider:jartic-road",
      label: "JARTIC",
      state: "available",
      dataPosture: "authorized-provider",
      sourceIds: ["source:jartic-road-provider-service"]
    },
    ingestDiagnostics: { unmatchedSegmentIds: [], rejectedRecords: [] },
    ...overrides
  };
}

function condition(overrides: Partial<RoadConditionObservation> = {}): RoadConditionObservation {
  return {
    id: "road-condition:test",
    recordType: "condition",
    segmentId: "road-segment:honmoku-daikoku-east",
    direction: "東行き",
    condition: "slow",
    dataPosture: "authorized-provider",
    providerObservedAt: "2026-08-08T08:55:00+09:00",
    retrievedAt: "2026-08-08T08:58:00+09:00",
    sourceIds: ["source:jartic-road-provider-service"],
    disclosureLabel: "認可済みproviderデータ",
    ...overrides
  };
}

function restriction(overrides: Partial<RoadRestrictionEvent> = {}): RoadRestrictionEvent {
  return {
    id: "road-restriction:test",
    recordType: "restriction",
    segmentId: "road-segment:honmoku-daikoku-east",
    direction: "東行き",
    restrictionKind: "construction",
    lifecycle: "current",
    dataPosture: "authorized-provider",
    providerObservedAt: "2026-08-08T08:55:00+09:00",
    retrievedAt: "2026-08-08T08:58:00+09:00",
    sourceIds: ["source:jartic-road-provider-service"],
    disclosureLabel: "認可済みproviderデータ",
    ...overrides
  };
}

describe("road operations presentation", () => {
  test("rejects invalid line geometry while retaining valid segments", () => {
    const input = dataset({
      segments: [
        segment(),
        segment({ id: "road-segment:invalid-short", coordinates: [[139.7, 35.5]] }),
        segment({ id: "road-segment:invalid-nan", coordinates: [[139.7, 35.5], [Number.NaN, 35.6]] })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.segments.map((item) => item.id)).toEqual(["road-segment:honmoku-daikoku-east"]);
    expect(view.diagnostics.rejectedSegmentIds).toEqual([
      "road-segment:invalid-short",
      "road-segment:invalid-nan"
    ]);
  });

  test("represents missing condition data as unknown rather than normal", () => {
    const view = buildRoadOperationsView(dataset(), NOW)!;

    expect(view.segments[0]).toMatchObject({ condition: "unknown", conditionIds: [] });
    expect(view.segments[0]).not.toMatchObject({ condition: "normal" });
  });

  test("matches normal, slow, and congestion only by segment and direction", () => {
    const segments = [
      segment({ id: "segment:normal" }),
      segment({ id: "segment:slow" }),
      segment({ id: "segment:congestion" }),
      segment({ id: "segment:west", direction: "西行き" })
    ];
    const input = dataset({
      segments,
      conditionObservations: [
        condition({ id: "condition:normal", segmentId: "segment:normal", condition: "normal" }),
        condition({ id: "condition:slow", segmentId: "segment:slow", condition: "slow" }),
        condition({ id: "condition:congestion", segmentId: "segment:congestion", condition: "congestion" }),
        condition({ id: "condition:wrong-direction", segmentId: "segment:west", direction: "東行き" })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.segments.map((item) => item.condition)).toEqual([
      "normal", "slow", "congestion", "unknown"
    ]);
    expect(view.conditions.map((item) => item.id)).toEqual([
      "condition:normal", "condition:slow", "condition:congestion"
    ]);
  });

  test("reports missing directions and unmatched segment records instead of applying them", () => {
    const missingDirection = condition({ id: "condition:missing-direction" }) as unknown as Record<string, unknown>;
    delete missingDirection.direction;
    const input = dataset({
      conditionObservations: [
        missingDirection as unknown as RoadConditionObservation,
        condition({ id: "condition:unmatched", segmentId: "segment:not-present" })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.conditions).toEqual([]);
    expect(view.diagnostics.rejectedRecords).toContainEqual({
      providerRecordId: "condition:missing-direction",
      reason: "direction is required"
    });
    expect(view.diagnostics.unmatchedSegmentIds).toContain("segment:not-present");
  });

  test("derives every freshness state independently and summarizes only current observations", () => {
    const input = dataset({
      conditionObservations: [
        condition({ id: "condition:current", retrievedAt: "2026-08-08T08:55:00+09:00" }),
        condition({ id: "condition:delayed", retrievedAt: "2026-08-08T08:40:00+09:00" }),
        condition({
          id: "condition:stale",
          retrievedAt: "2026-08-08T07:00:00+09:00",
          dataPosture: "fixed-demo"
        }),
        condition({ id: "condition:unavailable", freshness: "unavailable" }),
        condition({ id: "condition:unknown", retrievedAt: "not-a-time" })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.conditions.map((item) => item.freshness)).toEqual([
      "current", "delayed", "stale", "unavailable", "unknown"
    ]);
    expect(view.conditions[2].dataPosture).toBe("fixed-demo");
    expect(view.currentSummary.conditionIds).toEqual(["condition:current"]);
  });

  test("keeps restriction kind, lifecycle, freshness, and partial affected range independent", () => {
    const input = dataset({
      restrictionEvents: [
        restriction({ id: "restriction:accident", restrictionKind: "accident" }),
        restriction({
          id: "restriction:construction",
          restrictionKind: "construction",
          lifecycle: "planned"
        }),
        restriction({
          id: "restriction:lane",
          restrictionKind: "lane-restriction",
          lifecycle: "ended"
        }),
        restriction({
          id: "restriction:closure",
          restrictionKind: "closure",
          retrievedAt: "2026-08-08T07:00:00+09:00",
          affectedRange: {
            fromLabel: "本牧JCT",
            toLabel: "区間中間",
            startRatio: 0,
            endRatio: 0.45
          }
        })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.restrictions.map((item) => item.restrictionKind)).toEqual([
      "accident", "construction", "lane-restriction", "closure"
    ]);
    expect(view.restrictions.map((item) => item.displayLifecycleLabel)).toEqual([
      "発生中", "予定", "終了", "発生中"
    ]);
    expect(view.restrictions.map((item) => item.freshness)).toEqual([
      "current", "current", "current", "stale"
    ]);
    expect(view.restrictions[3].affectedRange?.endRatio).toBe(0.45);
    expect(view.currentSummary.restrictionIds).toEqual(["restriction:accident"]);
  });

  test("keeps fixed-demo posture permanently labeled without live lifecycle semantics", () => {
    const fixedTimes = {
      providerObservedAt: "2026-06-03T09:00:00+09:00",
      retrievedAt: "2026-06-03T09:05:00+09:00",
      dataPosture: "fixed-demo" as const,
      disclosureLabel: "固定デモ / 現在情報ではありません",
      sourceIds: ["source:logistics-road-demo-fixture"]
    };
    const input = dataset({
      conditionObservations: [condition({ id: "condition:demo", ...fixedTimes })],
      restrictionEvents: [
        restriction({ id: "restriction:demo-current", ...fixedTimes, lifecycle: "current" }),
        restriction({ id: "restriction:demo-planned", ...fixedTimes, lifecycle: "planned" })
      ]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.conditions[0]).toMatchObject({
      dataPosture: "fixed-demo",
      freshness: "stale",
      providerObservedAt: "2026-06-03T09:00:00+09:00",
      retrievedAt: "2026-06-03T09:05:00+09:00",
      disclosureLabel: "固定デモ / 現在情報ではありません",
      displayLifecycleLabel: "デモシナリオ内で発生中"
    });
    expect(view.restrictions.map((item) => item.displayLifecycleLabel)).toEqual([
      "デモシナリオ内で発生中",
      "デモシナリオ内の予定"
    ]);
    expect(view.currentSummary.conditionIds).toEqual([]);
    expect(view.currentSummary.restrictionIds).toEqual([]);
  });

  test("omits quantities unless value, unit, and observation timestamp are all present", () => {
    const malformed = condition({
      speed: { value: 35, unit: "km/h", observedAt: "2026-08-08T08:55:00+09:00" }
    }) as unknown as Record<string, unknown>;
    malformed.congestionLength = { value: 2.4, observedAt: "2026-08-08T08:55:00+09:00" };
    malformed.delay = { value: 8, unit: "min" };
    malformed.travelTime = { unit: "min", observedAt: "2026-08-08T08:55:00+09:00" };

    const view = buildRoadOperationsView(dataset({
      conditionObservations: [malformed as unknown as RoadConditionObservation]
    }), NOW)!;

    expect(view.conditions[0].speed).toEqual({
      value: 35,
      unit: "km/h",
      observedAt: "2026-08-08T08:55:00+09:00"
    });
    expect(view.conditions[0].congestionLength).toBeUndefined();
    expect(view.conditions[0].delay).toBeUndefined();
    expect(view.conditions[0].travelTime).toBeUndefined();
  });

  test("retains the last successful retrieval when the provider becomes unavailable", () => {
    const input = dataset({
      provider: {
        id: "provider:jartic-road",
        label: "JARTIC",
        state: "unavailable",
        dataPosture: "authorized-provider",
        sourceIds: ["source:jartic-road-provider-service"],
        lastSuccessfulRetrievalAt: "2026-08-08T08:40:00+09:00"
      },
      conditionObservations: [condition()]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.provider).toMatchObject({
      state: "unavailable",
      label: "公式道路交通フィード未接続",
      lastSuccessfulRetrievalAt: "2026-08-08T08:40:00+09:00"
    });
    expect(view.segments[0].condition).toBe("unknown");
    expect(view.conditions[0].id).toBe("road-condition:test");
    expect(view.currentSummary.conditionIds).toEqual([]);
  });

  test("builds route impact summaries only from matched records with citations", () => {
    const input = dataset({
      conditionObservations: [condition({
        id: "condition:cited",
        sourceIds: ["source:condition"]
      })],
      restrictionEvents: [restriction({
        id: "restriction:cited",
        restrictionKind: "accident",
        sourceIds: ["source:restriction"]
      })]
    });

    const view = buildRoadOperationsView(input, NOW)!;

    expect(view.currentSummary.routeImpacts).toEqual([{
      routeId: "live-logistics:road-keihin-tokyo",
      affectedSegmentIds: ["road-segment:honmoku-daikoku-east"],
      conditionIds: ["condition:cited"],
      restrictionIds: ["restriction:cited"],
      sourceIds: ["source:condition", "source:restriction"],
      citations: [
        { recordId: "condition:cited", sourceIds: ["source:condition"] },
        { recordId: "restriction:cited", sourceIds: ["source:restriction"] }
      ]
    }]);
  });

  test("loads a complete generalized route with permanently labeled fixed-demo examples", () => {
    const seed = loadSeedRoadOperations();
    const view = buildRoadOperationsView(seed, NOW)!;
    const expectedAnchors = seed.routes[0].anchorIds;

    expect(seed.segments).toHaveLength(expectedAnchors.length - 1);
    expect(seed.segments?.map((item) => item.fromAnchorId)).toEqual(expectedAnchors.slice(0, -1));
    expect(seed.segments?.map((item) => item.toAnchorId)).toEqual(expectedAnchors.slice(1));
    expect(seed.routes[0].segmentIds).toEqual(seed.segments?.map((item) => item.id));
    expect(seed.segments?.every((item) => (
      item.coordinates.length >= 2 && item.coordinates.flat().every(Number.isFinite)
    ))).toBe(true);
    expect(seed.junctions?.map((item) => item.id)).toEqual(expectedAnchors);
    expect(view.conditions).toHaveLength(1);
    expect(view.conditions[0]).toMatchObject({
      condition: "congestion",
      dataPosture: "fixed-demo",
      freshness: "stale",
      providerObservedAt: "2026-06-03T09:00:00+09:00",
      retrievedAt: "2026-06-03T09:05:00+09:00",
      sourceIds: ["source:logistics-road-demo-fixture"],
      disclosureLabel: "固定デモ / 現在情報ではありません"
    });
    expect(view.restrictions.map((item) => item.restrictionKind)).toEqual([
      "construction", "lane-restriction"
    ]);
    expect(view.restrictions.map((item) => item.displayLifecycleLabel)).toEqual([
      "デモシナリオ内で発生中",
      "デモシナリオ内の予定"
    ]);
    expect(view.counts).toEqual({ routeCount: 1, modeCount: 1, segmentCount: 6 });
  });
});
