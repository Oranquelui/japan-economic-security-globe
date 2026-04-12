import type { ThemeView } from "../../types/presentation";
import type { DependencyFlow, Observation, SemanticEntity } from "../../types/semantic";
import { buildSignalNarrativeForFlow, buildSignalNarrativeForObservation } from "../semantic/signal-narrative";
import { getDomesticImpactCopy } from "./domestic-copy";
import {
  localizeAnyLabel,
  localizeFlowLabel,
  localizeKind,
  localizeObservationLabel
} from "./japanese";

export type OperationMapMode = "point" | "cluster" | "choropleth" | "route" | "static";

export type OperationRow = {
  id: string;
  type: string;
  label: string;
  subject: string;
  urgency: string;
  status: string;
  action: string;
  period: string;
};

const OPERATION_MODE_LABELS: Record<OperationMapMode, string> = {
  choropleth: "地域塗り",
  cluster: "集約",
  point: "地点",
  route: "ルート",
  static: "固定"
};

export function getOperationModeLabel(mode: OperationMapMode): string {
  return OPERATION_MODE_LABELS[mode];
}

export function buildOperationRows(view: ThemeView): OperationRow[] {
  return [
    ...view.flows.map((flow) => flowToRow(flow, view.entities)),
    ...view.observations.map((observation) => observationToRow(observation, view.entities)),
    ...view.japanImpacts.map((impact) => impactToRow(impact, view.id))
  ];
}

export function filterOperationRows(rows: OperationRow[], query: string): OperationRow[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    [row.type, row.label, row.subject, row.urgency, row.status, row.action, row.period]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function flowToRow(flow: DependencyFlow, entities: SemanticEntity[]): OperationRow {
  const subject = entities.find((entity) => entity.id === flow.resourceId || entity.id === flow.productId);
  const signal = buildSignalNarrativeForFlow(flow);

  return {
    id: flow.id,
    type: signal.category,
    label: localizeFlowLabel(flow.id, flow.label),
    subject: subject ? localizeAnyLabel(subject.id, subject.label) : "日本",
    urgency: signal.severity,
    status: signal.status,
    action: signal.recommendedAction,
    period: localizePeriod(flow.period)
  };
}

function observationToRow(observation: Observation, entities: SemanticEntity[]): OperationRow {
  const subject = entities.find((entity) => entity.id === observation.subjectId);
  const signal = buildSignalNarrativeForObservation(observation);

  return {
    id: observation.id,
    type: signal.category,
    label: localizeObservationLabel(observation.id, observation.label),
    subject: subject ? localizeAnyLabel(subject.id, subject.label) : "日本",
    urgency: signal.severity,
    status: signal.status,
    action: signal.recommendedAction,
    period: localizePeriod(observation.period)
  };
}

function impactToRow(impact: SemanticEntity, themeId: ThemeView["id"]): OperationRow {
  const domesticCopy = getDomesticImpactCopy(themeId);

  return {
    id: impact.id,
    type: localizeKind(impact.kind),
    label: localizeAnyLabel(impact.id, impact.label),
    subject: domesticCopy.subject,
    urgency: "通常",
    status: "表示対象",
    action: domesticCopy.action,
    period: "第0段階"
  };
}

function localizePeriod(period: string): string {
  if (period === "FY2026") {
    return "2026年度";
  }

  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    return `${year}年${Number(month)}月`;
  }

  return period;
}
