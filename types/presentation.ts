import type { OperationMapMode } from "../lib/presentation/operations";
import type {
  DependencyFlow,
  EntityKind,
  GraphEdge,
  Observation,
  SemanticEntity,
  SourceDocument,
  ThemeId
} from "./semantic";

export interface ThemeView {
  id: ThemeId;
  title: string;
  headline: string;
  accent: string;
  entities: SemanticEntity[];
  flows: DependencyFlow[];
  observations: Observation[];
  sources: SourceDocument[];
  japanImpacts: SemanticEntity[];
  evidenceEdges: GraphEdge[];
}

export interface GlobeFlowViewModel {
  id: string;
  label: string;
  origin: SemanticEntity;
  destination: SemanticEntity;
  route: SemanticEntity[];
  theme: ThemeId;
  magnitudeLabel?: string;
  riskLabel?: string;
}

export interface JapanImpactViewModel {
  id: string;
  label: string;
  kind: SemanticEntity["kind"];
  summary: string;
  themeIds: ThemeId[];
  coordinates?: SemanticEntity["coordinates"];
}

export interface EvidenceGraphViewModel {
  nodes: Array<{
    id: string;
    label: string;
    kind: string;
    theme?: ThemeId;
  }>;
  links: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
}

export interface SparqlPreviewViewModel {
  title: string;
  query: string;
}

export interface SignalNarrativeViewModel {
  category: string;
  severity: "高" | "中" | "通常";
  status: "監視中" | "要確認" | "表示対象";
  recommendedAction: string;
  watchpoints: string[];
}

export interface DetailSourceHighlightViewModel {
  sourceId: string;
  claim: string;
}

export interface DetailViewModel {
  id: string;
  label: string;
  kind: string;
  summary: string;
  whyItMatters: string;
  signal: SignalNarrativeViewModel;
  sources: SourceDocument[];
  sourceHighlights: DetailSourceHighlightViewModel[];
  relatedEntities: SemanticEntity[];
  linkedFlows: DependencyFlow[];
  sparql: SparqlPreviewViewModel;
}

export interface MapPopupAnchor {
  placement: "left" | "right";
  x: number;
  y: number;
}

export type WorkspaceView = "map" | "signals" | "comparison";

export type SemanticLayerId =
  | "rice-harvest"
  | "rice-price"
  | "rice-inventory-policy"
  | "rice-logistics-inputs"
  | "energy-supply"
  | "energy-price"
  | "energy-route"
  | "logistics-domestic"
  | "logistics-arrival"
  | "logistics-impact"
  | "regional-security-public-events"
  | "regional-security-impact"
  | "regional-security-route"
  | "defense-capability-budget"
  | "defense-sites"
  | "defense-dependencies"
  | "semiconductors-production"
  | "semiconductors-route"
  | "semiconductors-signals"
  | "water-fill-rate"
  | "water-sources"
  | "water-supply";

export interface ScopeSummaryMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  periodLabel?: string;
  sourceIds: string[];
}

export interface ScopeSummary {
  title: string;
  description: string;
  coverage: { label: string; value: string };
  periodLabel: string;
  metrics: ScopeSummaryMetric[];
  sourceIds: string[];
}

export interface LayerLegend {
  kind: "continuous" | "categorical";
  title: string;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  items?: Array<{ colorToken: string; label: string }>;
  missingLabel: "データなし";
}

export interface LayerDefinition {
  id: SemanticLayerId;
  themeId: ThemeId;
  label: string;
  description: string;
  renderMode: OperationMapMode;
  periodLabel: string;
  sourceIds: string[];
  legend: LayerLegend;
  available: boolean;
  content: LayerContentDefinition;
}

export type LayerContentDefinition =
  | {
      kind: "regional-metric";
      entityKind: "Prefecture" | "Reservoir";
      property: "riceMainUseHarvestTonsR5" | "latestFillRatePercent";
    }
  | { kind: "observations"; observationIds: string[] }
  | { kind: "flows"; flowIds: string[] | "theme" }
  | { kind: "entities"; entityKinds: EntityKind[] }
  | { kind: "live-logistics"; view: "domestic" | "arrival" | "impact" }
  | { kind: "theme-composite" };

export interface WorkspacePresentation {
  defaultLayerId: SemanticLayerId;
  scope: ScopeSummary;
  layers: LayerDefinition[];
}

export interface SelectionInspectorViewModel {
  detail: DetailViewModel;
  primaryMetric: {
    valueLabel: string;
    unitLabel?: string;
    periodLabel?: string;
  } | null;
}

export interface MetricSeriesPoint {
  id: string;
  label: string;
  value: number;
  unit: string;
  period: string;
  sourceIds: string[];
}
