export const SOURCE_ACCESS_METHODS = [
  "api",
  "sparql",
  "ckan",
  "csv",
  "excel",
  "geojson",
  "tile",
  "pdf",
  "html"
] as const;

export type SourceAccessMethod = (typeof SOURCE_ACCESS_METHODS)[number];

export const SOURCE_OUTPUT_KINDS = [
  "SourceSnapshot",
  "EvidenceClaim",
  "GeoFeature",
  "TimeSeriesObservation",
  "PolicySignal"
] as const;

export type SourceOutputKind = (typeof SOURCE_OUTPUT_KINDS)[number];

export interface SourceAdapterDefinition {
  id: `adapter:${string}`;
  label: string;
  sourceIds: string[];
  accessMethod: SourceAccessMethod;
  outputKinds: SourceOutputKind[];
  updateCadence: "realtime" | "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "ad-hoc";
  rightsNote: string;
  requiresCredential: boolean;
  nonLiveBoundary: boolean;
}

export interface SourceAdapterResultInput {
  sourceId: string;
  capturedAt: string;
  sourceUrl: string;
  accessMethod: SourceAccessMethod;
  outputKinds: SourceOutputKind[];
  provenanceNote: string;
}

export interface SourceSnapshot {
  id: `source-snapshot:${string}:${string}`;
  sourceId: string;
  capturedAt: string;
  sourceUrl: string;
  accessMethod: SourceAccessMethod;
  outputKinds: SourceOutputKind[];
  provenanceNote: string;
}
