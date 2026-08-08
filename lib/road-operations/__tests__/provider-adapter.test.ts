import { describe, expect, test } from "vitest";

import { normalizeRoadProviderSnapshot } from "../provider-adapter";

describe("road provider adapter", () => {
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
    const providerPolicy = {
      providerId: "provider:test-road",
      cachingPermitted: true,
      redistributionPermitted: true
    };
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

    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, {
      providerId: "provider:test-road",
      cachingPermitted: false,
      redistributionPermitted: true
    }, {})).toThrow(/caching/);
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

    expect(() => normalizeRoadProviderSnapshot(rawSnapshot, {
      providerId: "provider:test-road",
      cachingPermitted: true,
      redistributionPermitted: false
    }, {})).toThrow(/redistribution/);
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
    }, {
      providerId: "provider:test-road",
      cachingPermitted: true,
      redistributionPermitted: true
    }, {
      "provider:known": "road-segment:known"
    });

    expect(result.snapshot.ingestOutcome).toBe("rejected");
    expect(result.snapshot.records).toEqual([]);
    expect(result.diagnostics.rejectedRecords).toEqual([{
      providerRecordId: "provider-record:no-direction",
      reason: "direction is required"
    }]);
  });
});
