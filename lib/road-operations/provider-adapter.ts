import type {
  ProviderSnapshot,
  RoadConditionKind,
  RoadDataPosture,
  RoadDirection,
  RoadAffectedRange,
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
  startsAt?: string;
  endsAt?: string;
  affectedRange?: RoadAffectedRange;
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

const SUPPORTED_ROAD_UNITS = new Set(["km/h", "km", "m", "min", "s", "h", "vehicles/h", "台/時"]);
const ABSOLUTE_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/;

export function isAbsoluteRoadTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ABSOLUTE_TIMESTAMP.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const offsetHour = match[7] ? Number(match[7]) : 0;
  const offsetMinute = match[8] ? Number(match[8]) : 0;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth &&
    hour <= 23 && minute <= 59 && second <= 59 && offsetHour <= 23 && offsetMinute <= 59;
}

export function normalizeRoadQuantitativeField(
  field: Partial<RoadQuantitativeField> | undefined
): RoadQuantitativeField | undefined {
  return typeof field?.value === "number" && Number.isFinite(field.value) &&
    typeof field?.unit === "string" &&
    field.unit.trim() === field.unit &&
    SUPPORTED_ROAD_UNITS.has(field.unit) &&
    isAbsoluteRoadTimestamp(field.observedAt)
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
      affectedRange: record.affectedRange,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      speed: normalizeRoadQuantitativeField(record.speed),
      congestionLength: normalizeRoadQuantitativeField(record.congestionLength),
      delay: normalizeRoadQuantitativeField(record.delay),
      travelTime: normalizeRoadQuantitativeField(record.travelTime)
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
  if (policy.providerId !== rawSnapshot.providerId) {
    throw new Error("Provider policy providerId must match raw snapshot providerId");
  }
  if (
    !isAbsoluteRoadTimestamp(rawSnapshot.providerObservedAt) ||
    !isAbsoluteRoadTimestamp(rawSnapshot.retrievedAt)
  ) {
    throw new Error(`Provider ${policy.providerId} snapshot times must be absolute timestamps`);
  }
  if (
    typeof policy.termsUrl !== "string" || !policy.termsUrl.startsWith("https://")
  ) {
    throw new Error(`Provider ${policy.providerId} terms URL is required`);
  }
  if (!["api", "download", "licensed-feed"].includes(policy.accessMethod)) {
    throw new Error(`Provider ${policy.providerId} access method is required`);
  }
  if (!policy.coverageLabel.trim() || !policy.attribution.trim()) {
    throw new Error(`Provider ${policy.providerId} coverage and attribution are required`);
  }
  if (
    !Number.isFinite(policy.refreshIntervalSeconds) || policy.refreshIntervalSeconds <= 0 ||
    !Number.isFinite(policy.currentMaxAgeSeconds) || policy.currentMaxAgeSeconds < 0 ||
    !Number.isFinite(policy.freshnessLimitSeconds) ||
    policy.freshnessLimitSeconds < policy.currentMaxAgeSeconds
  ) {
    throw new Error(`Provider ${policy.providerId} refresh and freshness limits are invalid`);
  }
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
    if (typeof match !== "string" && match.direction && match.direction !== rawRecord.direction) {
      rejectedRecords.push({
        providerRecordId: rawRecord.id,
        reason: "direction does not match segment carriageway"
      });
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
  const frozenPolicy = Object.freeze({ ...policy });
  const snapshot = Object.freeze({
    providerId: rawSnapshot.providerId,
    providerObservedAt: rawSnapshot.providerObservedAt,
    retrievedAt: rawSnapshot.retrievedAt,
    schemaVersion: rawSnapshot.schemaVersion,
    coverageLabel: rawSnapshot.coverageLabel,
    ingestOutcome,
    records: frozenRecords,
    cachingPermitted: policy.cachingPermitted,
    redistributionPermitted: policy.redistributionPermitted,
    policy: frozenPolicy
  }) satisfies ProviderSnapshot;

  return {
    snapshot,
    diagnostics: { unmatchedSegmentIds, rejectedRecords }
  };
}
