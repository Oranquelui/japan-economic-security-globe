export const THEME_IDS = [
  "energy",
  "logistics",
  "regional-security",
  "defense",
  "semiconductors",
  "rice",
  "water"
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type EntityKind =
  | "Country"
  | "Prefecture"
  | "WorldRegion"
  | "Resource"
  | "Product"
  | "PolicyDocument"
  | "Law"
  | "BudgetLine"
  | "CapabilityArea"
  | "StrategicLayer"
  | "SecurityActivity"
  | "MissileTest"
  | "LaunchSite"
  | "ImpactArea"
  | "MilitaryActivityRoute"
  | "PublicAlertSignal"
  | "Organization"
  | "Facility"
  | "Route"
  | "TransportCorridor"
  | "PortHinterlandCorridor"
  | "HighwaySegment"
  | "RailFreightCorridor"
  | "DomesticDistributionNode"
  | "Chokepoint"
  | "Airport"
  | "Port"
  | "Terminal"
  | "Refinery"
  | "Reservoir"
  | "SeaLane"
  | "SourceDocument";

export type ObservationKind =
  | "Observation"
  | "PriceObservation"
  | "ImportObservation"
  | "ReservoirObservation"
  | "WaterObservation"
  | "BudgetObservation"
  | "DependencyObservation"
  | "PolicySignal"
  | "RegionalSecurityObservation"
  | "LogisticsImpactSignal"
  | "VisualObservation";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface ProvenanceRef {
  sourceId: string;
  claim?: string;
  retrievedAt?: string;
}

export interface SemanticEntity {
  id: string;
  kind: EntityKind;
  label: string;
  labelJa?: string;
  summary: string;
  whyItMatters: string;
  themes: ThemeId[];
  coordinates?: GeoPoint;
  countryCode?: string;
  flagEmoji?: string;
  parentId?: string;
  sourceIds?: string[];
  provenance: string[];
  properties?: Record<string, string | number | boolean>;
}

export interface DependencyFlow {
  id: string;
  theme: ThemeId;
  label: string;
  originId: string;
  destinationId: string;
  resourceId?: string;
  productId?: string;
  routeIds: string[];
  mapLineKind?: "route" | "bridge";
  sourceIds: string[];
  period: string;
  summary: string;
  magnitudeLabel?: string;
  riskLabel?: string;
}

export interface Observation {
  id: string;
  kind: ObservationKind;
  theme: ThemeId;
  subjectId: string;
  label: string;
  metric: string;
  value: number | string;
  unit?: string;
  period: string;
  sourceIds: string[];
  summary: string;
  provenance: ProvenanceRef[];
}

export type SourceCategory = "official" | "open-data" | "private";

export interface SourceRights {
  licenseLabel: string;
  licenseUrl: string;
  sourceVersion: string;
  immutableArchiveUrl: string;
  immutableArchiveSha256: string;
  processingStatement: string;
  limitationStatement: string;
}

export interface SourceDocument {
  id: string;
  label: string;
  url: string;
  publisher: string;
  published?: string;
  accessed: string;
  description?: string;
  official?: boolean;
  sourceCategory?: SourceCategory;
  rights?: SourceRights;
  accessMode?: "api" | "sparql" | "ckan" | "csv" | "excel" | "geojson" | "tile" | "pdf" | "html";
  tier?: "A" | "B" | "C";
}

export interface GraphEdge {
  id: string;
  subjectId: string;
  predicate: string;
  objectId: string;
  sourceIds: string[];
  theme?: ThemeId;
}

export interface SemanticGraph {
  entities: SemanticEntity[];
  flows: DependencyFlow[];
  observations: Observation[];
  sources: SourceDocument[];
  edges: GraphEdge[];
}
