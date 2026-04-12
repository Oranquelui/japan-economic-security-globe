import type { ThemeView } from "../../types/presentation";
import type { SemanticTone } from "./palette";
import type { OperationRow } from "./operations";
import { getDomesticImpactCopy } from "./domestic-copy";

export type OperationMetric = {
  id: string;
  label: string;
  value: number;
  tone: SemanticTone;
  description: string;
};

export function buildOperationsMetrics(view: ThemeView, rows: OperationRow[]): OperationMetric[] {
  const domesticCopy = getDomesticImpactCopy(view.id);

  return [
    {
      id: "displayed",
      label: "表示中",
      value: rows.length,
      tone: "accent",
      description: "現在のテーマで地図と表に出しているシグナル数"
    },
    {
      id: "high-risk",
      label: "高リスク",
      value: rows.filter((row) => row.urgency === "高").length,
      tone: "high",
      description: "優先監視すべき依存・価格・供給不安シグナル"
    },
    {
      id: "monitoring",
      label: "監視中",
      value: rows.filter((row) => row.status === "監視中").length,
      tone: "monitoring",
      description: "継続監視している依存ルートと着地点"
    },
    {
      id: "domestic-impacts",
      label: domesticCopy.label,
      value: view.japanImpacts.length,
      tone: "watch",
      description: domesticCopy.description
    },
    {
      id: "sources",
      label: "出典",
      value: new Set([
        ...view.flows.flatMap((flow) => flow.sourceIds),
        ...view.observations.flatMap((observation) => observation.sourceIds)
      ]).size,
      tone: "normal",
      description: "このテーマに結びついた一次出典と根拠文書"
    }
  ];
}
