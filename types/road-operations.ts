export type RoadDirection = "東行き" | "西行き";
export type RoadDataPosture = "authorized-provider" | "fixed-demo";
export type RoadConditionFreshness = "current" | "delayed" | "stale" | "unavailable" | "unknown";
export type RoadEventLifecycle = "current" | "planned" | "ended";

export type RoadCoordinate = [number, number];
export type RoadConditionKind = "normal" | "slow" | "congestion";
export type RoadRestrictionKind =
  | "accident"
  | "construction"
  | "lane-restriction"
  | "closure"
  | "other";
export type RoadProviderIngestOutcome = "complete" | "partial" | "rejected" | "unavailable";

export interface RoadAffectedRange {
  fromLabel: string;
  toLabel: string;
  startRatio?: number;
  endRatio?: number;
}

export interface RoadQuantitativeField {
  value: number;
  unit: string;
  observedAt: string;
}

interface RoadOperationalRecordBase {
  id: string;
  segmentId: string;
  direction: RoadDirection;
  dataPosture: RoadDataPosture;
  freshness?: RoadConditionFreshness;
  providerObservedAt: string;
  retrievedAt: string;
  sourceIds: string[];
  disclosureLabel: string;
  affectedRange?: RoadAffectedRange;
}

export interface RoadConditionObservation extends RoadOperationalRecordBase {
  recordType: "condition";
  condition: RoadConditionKind;
  speed?: RoadQuantitativeField;
  congestionLength?: RoadQuantitativeField;
  delay?: RoadQuantitativeField;
  travelTime?: RoadQuantitativeField;
}

export interface RoadRestrictionEvent extends RoadOperationalRecordBase {
  recordType: "restriction";
  restrictionKind: RoadRestrictionKind;
  lifecycle: RoadEventLifecycle;
}

export type RoadOperationalRecord = RoadConditionObservation | RoadRestrictionEvent;

export interface RoadSegment {
  id: string;
  routeId: string;
  label: string;
  fromAnchorId: string;
  toAnchorId: string;
  direction: RoadDirection;
  coordinates: RoadCoordinate[];
  sourceIds: string[];
}

export interface RoadJunction {
  id: string;
  routeId: string;
  label: string;
  coordinates: RoadCoordinate;
  sourceIds: string[];
}

export interface RoadProviderPolicy {
  providerId: string;
  cachingPermitted: boolean;
  redistributionPermitted: boolean;
  cacheTtlSeconds?: number;
}

export interface ProviderSnapshot {
  readonly providerId: string;
  readonly providerObservedAt: string;
  readonly retrievedAt: string;
  readonly schemaVersion: string;
  readonly coverageLabel: string;
  readonly ingestOutcome: RoadProviderIngestOutcome;
  readonly records: readonly RoadOperationalRecord[];
  readonly cachingPermitted: boolean;
  readonly redistributionPermitted: boolean;
}

export interface RoadRejectedRecord {
  providerRecordId: string;
  reason: string;
}

export interface RoadIngestDiagnostics {
  unmatchedSegmentIds: string[];
  rejectedRecords: RoadRejectedRecord[];
}

export interface RoadProviderState {
  id: string;
  label: string;
  state: "available" | "unavailable";
  dataPosture: RoadDataPosture;
  sourceIds: string[];
  lastSuccessfulRetrievalAt?: string;
  snapshot?: ProviderSnapshot;
}

export interface RoadRoute {
  id: string;
  label: string;
  version: string;
  direction: RoadDirection;
  anchorIds: string[];
  segmentIds: string[];
  topologySourceIds: string[];
  geometrySourceId: string;
  geometryVersion: string;
  geometryExtractedAt: string;
  geometrySourceUrl: string;
  geometryLicense: "ODbL-1.0";
  attribution: "© OpenStreetMap contributors";
  redistributionPermitted: boolean;
}

export interface RoadRouteAnchorClaim {
  anchorId: string;
  sourceUrl: string;
  accessedAt: string;
  claim: string;
  directionEvidence: string;
  reviewStatus: "approved" | "blocked" | "pending";
}

export interface RoadRouteEvidenceManifest {
  routeId: string;
  routeVersion: string;
  directionClaim: {
    direction: RoadDirection;
    sourceUrl: string;
    accessedAt: string;
    claim: string;
    directionEvidence: string;
    reviewStatus: "approved" | "blocked" | "pending";
  };
  anchorClaims: RoadRouteAnchorClaim[];
}

export interface RoadOperationsDataset {
  datasetId: string;
  dataPosture: RoadDataPosture;
  licenseNoticePath: string;
  routes: RoadRoute[];
  segments?: RoadSegment[];
  junctions?: RoadJunction[];
  conditionObservations?: RoadConditionObservation[];
  restrictionEvents?: RoadRestrictionEvent[];
  provider?: RoadProviderState;
  ingestDiagnostics?: RoadIngestDiagnostics;
  evidenceManifest: RoadRouteEvidenceManifest;
}
