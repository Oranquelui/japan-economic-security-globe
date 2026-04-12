import type {
  DependencyFlow,
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
