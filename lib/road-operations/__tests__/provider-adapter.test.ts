import { describe, expect, test } from "vitest";

import { isAbsoluteRoadTimestamp, normalizeRoadProviderSnapshot } from "../provider-adapter";

function policy(overrides: Record<string, unknown> = {}) {
  return {
    providerId: "provider:test-road",
    termsUrl: "https://provider.example/terms",
    accessMethod: "licensed-feed" as const,
    coverageLabel: "test corridor",
    refreshIntervalSeconds: 300,
    currentMaxAgeSeconds: 600,
    freshnessLimitSeconds: 1800,
    attribution: "Test road provider",
    cachingPermitted: true,
    redistributionPermitted: true,
    ...overrides
  };
}

describe("road provider adapter", () => {
  test("rejects non-absolute and calendar-invalid timestamps", () => {
    expect(isAbsoluteRoadTimestamp("2026-08-08T08:55:00")).toBe(false);
    expect(isAbsoluteRoadTimestamp("2026-02-30T08:55:00+09:00")).toBe(false);
    expect(isAbsoluteRoadTimestamp("2026-08-08T08:55:00+09:00")).toBe(true);
  });
  test("normalizes an immutable snapshot and reports unmatched segments", () => {
    const rawSnapshot = {
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: [
        {
          id: "provider-record:matched",
          recordType: "condition" as const,
          providerSegmentId: "provider:known",
          direction: "東行き" as const,
          condition: "slow" as const,
          sourceIds: ["source:jartic-road-provider-service"]
        },
        {
          id: "provider-record:unmatched",
          recordType: "condition" as const,
          providerSegmentId: "provider:unknown",
          direction: "東行き" as const,
          condition: "congestion" as const,
          sourceIds: ["source:jartic-road-provider-service"]
        }
      ]
    };
    const providerPolicy = policy();
    const segmentIndex = {
      "provider:known": "road-segment:known"
    };

    const result = normalizeRoadProviderSnapshot(rawSnapshot, providerPolicy, segmentIndex);

    expect(result.snapshot).toMatchObject({
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      ingestOutcome: "partial"
    });
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.records)).toBe(true);
    expect(result.diagnostics.unmatchedSegmentIds).toEqual(["provider:unknown"]);
  });

  test("blocks normalization when caching is not permitted", () => {
    const rawSnapshot = {
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: []
    };

    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, policy({ cachingPermitted: false }), {})).toThrow(/caching/);
  });

  test("blocks normalization when public redistribution is not permitted", () => {
    const rawSnapshot = {
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: []
    };

    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, policy({ redistributionPermitted: false }), {})).toThrow(/redistribution/);
  });

  test("rejects a provider record whose direction is missing", () => {
    const result = normalizeRoadProviderSnapshot({
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: [{
        id: "provider-record:no-direction",
        recordType: "condition" as const,
        providerSegmentId: "provider:known",
        condition: "slow" as const,
        sourceIds: ["source:jartic-road-provider-service"]
      }]
    }, policy(), {
      "provider:known": "road-segment:known"
    });

    expect(result.snapshot.ingestOutcome).toBe("rejected");
    expect(result.snapshot.records).toEqual([]);
    expect(result.diagnostics.rejectedRecords).toEqual([{
      providerRecordId: "provider-record:no-direction",
      reason: "direction is required"
    }]);
  });

  test("requires an approved complete policy for the same provider and preserves its terms", () => {
    const rawSnapshot = {
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: []
    };

    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, policy({
      providerId: "provider:other"
    }), {})).toThrow(/providerId/);
    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, policy({
      termsUrl: ""
    }), {})).toThrow(/terms/);

    expect(normalizeRoadProviderSnapshot(rawSnapshot, policy(), {}).snapshot).toMatchObject({
      policy: {
        providerId: "provider:test-road",
        termsUrl: "https://provider.example/terms",
        accessMethod: "licensed-feed",
        coverageLabel: "test corridor",
        refreshIntervalSeconds: 300,
        currentMaxAgeSeconds: 600,
        freshnessLimitSeconds: 1800,
        attribution: "Test road provider"
      }
    });
  });

  test("preserves event timing and affected range during normalization", () => {
    const result = normalizeRoadProviderSnapshot({
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: [{
        id: "provider-record:event",
        recordType: "restriction" as const,
        providerSegmentId: "provider:known",
        direction: "東行き" as const,
        restrictionKind: "construction" as const,
        lifecycle: "planned" as const,
        startsAt: "2026-08-08T10:00:00+09:00",
        endsAt: "2026-08-08T12:00:00+09:00",
        affectedRange: { fromLabel: "A", toLabel: "B", startRatio: 0.2, endRatio: 0.7 },
        sourceIds: ["source:test"]
      }]
    }, policy(), { "provider:known": "road-segment:known" });

    expect(result.snapshot.records[0]).toMatchObject({
      startsAt: "2026-08-08T10:00:00+09:00",
      endsAt: "2026-08-08T12:00:00+09:00",
      affectedRange: { fromLabel: "A", toLabel: "B", startRatio: 0.2, endRatio: 0.7 }
    });
  });

  test("rejects an object-index carriageway mismatch", () => {
    const result = normalizeRoadProviderSnapshot({
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: [{
        id: "provider-record:wrong-carriageway",
        recordType: "condition" as const,
        providerSegmentId: "provider:known",
        direction: "東行き" as const,
        condition: "slow" as const,
        sourceIds: ["source:test"]
      }]
    }, policy(), {
      "provider:known": { segmentId: "road-segment:known", direction: "西行き" }
    });

    expect(result.snapshot.records).toEqual([]);
    expect(result.diagnostics.rejectedRecords).toEqual([{
      providerRecordId: "provider-record:wrong-carriageway",
      reason: "direction does not match segment carriageway"
    }]);
  });

  test("drops non-finite, unsupported-unit, and non-absolute quantities", () => {
    const result = normalizeRoadProviderSnapshot({
      providerId: "provider:test-road",
      providerObservedAt: "2026-08-08T08:55:00+09:00",
      retrievedAt: "2026-08-08T09:00:00+09:00",
      schemaVersion: "1",
      coverageLabel: "test corridor",
      records: [{
        id: "provider-record:quantities",
        recordType: "condition" as const,
        providerSegmentId: "provider:known",
        direction: "東行き" as const,
        condition: "slow" as const,
        sourceIds: ["source:test"],
        speed: { value: Number.NaN, unit: "km/h", observedAt: "2026-08-08T08:55:00+09:00" },
        congestionLength: { value: Number.POSITIVE_INFINITY, unit: "km", observedAt: "2026-08-08T08:55:00+09:00" },
        delay: { value: 5, unit: "mph", observedAt: "2026-08-08T08:55:00+09:00" },
        travelTime: { value: 12, unit: "min", observedAt: "2026-08-08T08:55:00" }
      }]
    }, policy(), { "provider:known": "road-segment:known" });

    expect(result.snapshot.records[0]).toMatchObject({
      speed: undefined,
      congestionLength: undefined,
      delay: undefined,
      travelTime: undefined
    });
  });
});
