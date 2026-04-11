export type ThemeId =
  | "energy"
  | "rice"
  | "water"
  | "defense"
  | "semiconductors";

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
  | "Organization"
  | "Facility"
  | "Route"
  | "Chokepoint"
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
  | "PolicySignal";

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

export interface SourceDocument {
  id: string;
  label: string;
  url: string;
  publisher: string;
  published?: string;
  accessed: string;
  description?: string;
  official?: boolean;
  accessMode?: "api" | "sparql" | "csv" | "excel" | "pdf" | "html";
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
