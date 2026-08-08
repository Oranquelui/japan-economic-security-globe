import type {
  ProviderSnapshot,
  RoadConditionKind,
  RoadDataPosture,
  RoadDirection,
  RoadIngestDiagnostics,
  RoadOperationalRecord,
  RoadProviderPolicy,
  RoadQuantitativeField,
  RoadRestrictionKind
} from "../../types/road-operations";

export interface RoadProviderRawRecord {
  id: string;
  recordType: "condition" | "restriction";
  providerSegmentId: string;
  direction?: RoadDirection;
  condition?: RoadConditionKind;
  restrictionKind?: RoadRestrictionKind;
  lifecycle?: "current" | "planned" | "ended";
  observedAt?: string;
  sourceIds: string[];
  dataPosture?: RoadDataPosture;
  disclosureLabel?: string;
  speed?: Partial<RoadQuantitativeField>;
  congestionLength?: Partial<RoadQuantitativeField>;
  delay?: Partial<RoadQuantitativeField>;
  travelTime?: Partial<RoadQuantitativeField>;
}

export interface RawRoadProviderSnapshot<TRawRecord = RoadProviderRawRecord> {
  providerId: string;
  providerObservedAt: string;
  retrievedAt: string;
  schemaVersion: string;
  coverageLabel: string;
  records: TRawRecord[];
}

export type RoadProviderSegmentIndex = Record<
  string,
  string | { segmentId: string; direction?: RoadDirection }
>;

export interface RoadProviderNormalizationContext {
  segmentId: string;
  providerObservedAt: string;
  retrievedAt: string;
}

export interface RoadProviderAdapter<TRawRecord> {
  normalize(
    record: TRawRecord,
    context: RoadProviderNormalizationContext
  ): RoadOperationalRecord | null;
}

export interface RoadProviderNormalizationResult {
  snapshot: ProviderSnapshot;
  diagnostics: RoadIngestDiagnostics;
}

function normalizeQuantitativeField(
  field: Partial<RoadQuantitativeField> | undefined
): RoadQuantitativeField | undefined {
  return typeof field?.value === "number" && typeof field.unit === "string" && typeof field.observedAt === "string"
    ? { value: field.value, unit: field.unit, observedAt: field.observedAt }
    : undefined;
}

const defaultAdapter: RoadProviderAdapter<RoadProviderRawRecord> = {
  normalize(record, context) {
    if (!record.direction) return null;

    const base = {
      id: record.id,
      segmentId: context.segmentId,
      direction: record.direction,
      dataPosture: record.dataPosture ?? ("authorized-provider" as const),
      freshness: "unknown" as const,
      providerObservedAt: record.observedAt ?? context.providerObservedAt,
      retrievedAt: context.retrievedAt,
      sourceIds: record.sourceIds,
      disclosureLabel: record.disclosureLabel ?? "認可済みproviderデータ",
      speed: normalizeQuantitativeField(record.speed),
      congestionLength: normalizeQuantitativeField(record.congestionLength),
      delay: normalizeQuantitativeField(record.delay),
      travelTime: normalizeQuantitativeField(record.travelTime)
    };

    if (record.recordType === "condition" && record.condition) {
      return { ...base, recordType: "condition", condition: record.condition };
    }
    if (record.recordType === "restriction" && record.restrictionKind && record.lifecycle) {
      const { speed: _speed, congestionLength: _length, delay: _delay, travelTime: _time, ...eventBase } = base;
      return {
        ...eventBase,
        recordType: "restriction",
        restrictionKind: record.restrictionKind,
        lifecycle: record.lifecycle
      };
    }
    return null;
  }
};

function freezeRecord(record: RoadOperationalRecord): RoadOperationalRecord {
  return Object.freeze(record);
}

export function normalizeRoadProviderSnapshot<TRawRecord extends RoadProviderRawRecord>(
  rawSnapshot: RawRoadProviderSnapshot<TRawRecord>,
  policy: RoadProviderPolicy,
  segmentIndex: RoadProviderSegmentIndex,
  adapter: RoadProviderAdapter<TRawRecord> = defaultAdapter as RoadProviderAdapter<TRawRecord>
): RoadProviderNormalizationResult {
  if (!policy.cachingPermitted) {
    throw new Error(`Provider ${policy.providerId} policy blocks caching`);
  }
  if (!policy.redistributionPermitted) {
    throw new Error(`Provider ${policy.providerId} policy blocks public redistribution`);
  }
  const records: RoadOperationalRecord[] = [];
  const unmatchedSegmentIds: string[] = [];
  const rejectedRecords: RoadIngestDiagnostics["rejectedRecords"] = [];

  for (const rawRecord of rawSnapshot.records) {
    const match = segmentIndex[rawRecord.providerSegmentId];
    if (!match) {
      if (!unmatchedSegmentIds.includes(rawRecord.providerSegmentId)) {
        unmatchedSegmentIds.push(rawRecord.providerSegmentId);
      }
      continue;
    }
    const segmentId = typeof match === "string" ? match : match.segmentId;
    if (!rawRecord.direction) {
      rejectedRecords.push({ providerRecordId: rawRecord.id, reason: "direction is required" });
      continue;
    }
    const normalized = adapter.normalize(rawRecord, {
      segmentId,
      providerObservedAt: rawSnapshot.providerObservedAt,
      retrievedAt: rawSnapshot.retrievedAt
    });
    if (!normalized) {
      rejectedRecords.push({ providerRecordId: rawRecord.id, reason: "record rejected by adapter" });
      continue;
    }
    records.push(freezeRecord(normalized));
  }

  const hasIssues = unmatchedSegmentIds.length > 0 || rejectedRecords.length > 0;
  const ingestOutcome = hasIssues ? (records.length > 0 ? "partial" : "rejected") : "complete";
  const frozenRecords = Object.freeze(records.slice());
  const snapshot = Object.freeze({
    providerId: rawSnapshot.providerId,
    providerObservedAt: rawSnapshot.providerObservedAt,
    retrievedAt: rawSnapshot.retrievedAt,
    schemaVersion: rawSnapshot.schemaVersion,
    coverageLabel: rawSnapshot.coverageLabel,
    ingestOutcome,
    records: frozenRecords,
    cachingPermitted: policy.cachingPermitted,
    redistributionPermitted: policy.redistributionPermitted
  }) satisfies ProviderSnapshot;

  return {
    snapshot,
    diagnostics: { unmatchedSegmentIds, rejectedRecords }
  };
}
