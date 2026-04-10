"use client";

import type { ThemeView } from "../types/presentation";
import type { DependencyFlow, Observation, SemanticEntity } from "../types/semantic";
import {
  localizeAnyLabel,
  localizeFlowLabel,
  localizeKind,
  localizeObservationLabel
} from "../lib/presentation/japanese";

interface OperationsSignalTableProps {
  activeId: string;
  onSelect: (id: string) => void;
  view: ThemeView;
}

type SignalRow = {
  id: string;
  type: string;
  label: string;
  subject: string;
  urgency: string;
  status: string;
  action: string;
  period: string;
};

export function OperationsSignalTable({ activeId, onSelect, view }: OperationsSignalTableProps) {
  const rows = buildRows(view);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101b]/90 shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-5 py-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-slate-500">オペレーション表</p>
          <h2 className="mt-1 text-lg font-semibold text-white">日本向け依存シグナル</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-2">{rows.length} 件表示</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-2">出典あり</span>
        </div>
      </div>

      <div className="max-h-80 overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#111a26]/95 text-[0.62rem] uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3 font-medium">種別</th>
              <th className="px-4 py-3 font-medium">シグナル</th>
              <th className="px-4 py-3 font-medium">対象</th>
              <th className="px-4 py-3 font-medium">緊急度</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3 font-medium">必要アクション</th>
              <th className="px-4 py-3 font-medium">期間</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row.id)}
                className={`cursor-pointer border-t border-white/[0.06] transition ${
                  activeId === row.id ? "bg-white/[0.10] text-white" : "bg-transparent text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.68rem] text-slate-500">{row.type}</td>
                <td className="min-w-64 px-4 py-3 font-semibold">{row.label}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{row.subject}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-slate-200">
                    {row.urgency}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{row.status}</td>
                <td className="min-w-40 px-4 py-3 text-slate-300">{row.action}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildRows(view: ThemeView): SignalRow[] {
  return [
    ...view.flows.map((flow) => flowToRow(flow, view.entities)),
    ...view.observations.map((observation) => observationToRow(observation, view.entities)),
    ...view.japanImpacts.map((impact) => impactToRow(impact))
  ];
}

function flowToRow(flow: DependencyFlow, entities: SemanticEntity[]): SignalRow {
  const subject = entities.find((entity) => entity.id === flow.resourceId || entity.id === flow.productId);

  return {
    id: flow.id,
    type: "依存ルート",
    label: localizeFlowLabel(flow.id, flow.label),
    subject: subject ? localizeAnyLabel(subject.id, subject.label) : "日本",
    urgency: flowUrgency(flow.id),
    status: "監視中",
    action: "ルートと根拠を確認",
    period: localizePeriod(flow.period)
  };
}

function observationToRow(observation: Observation, entities: SemanticEntity[]): SignalRow {
  const subject = entities.find((entity) => entity.id === observation.subjectId);

  return {
    id: observation.id,
    type: localizeKind(observation.kind),
    label: localizeObservationLabel(observation.id, observation.label),
    subject: subject ? localizeAnyLabel(subject.id, subject.label) : "日本",
    urgency: observationUrgency(observation.id),
    status: "要確認",
    action: "出典と政策文脈を確認",
    period: localizePeriod(observation.period)
  };
}

function impactToRow(impact: SemanticEntity): SignalRow {
  return {
    id: impact.id,
    type: localizeKind(impact.kind),
    label: localizeAnyLabel(impact.id, impact.label),
    subject: "国内着地点",
    urgency: "通常",
    status: "表示対象",
    action: "地図上の位置を確認",
    period: "第0段階"
  };
}

function flowUrgency(id: string): string {
  if (id.includes("oil") || id.includes("lng")) {
    return "高";
  }

  if (id.includes("rice") || id.includes("semiconductor")) {
    return "中";
  }

  return "通常";
}

function observationUrgency(id: string): string {
  if (id.includes("rice") || id.includes("lng") || id.includes("reservoir")) {
    return "高";
  }

  return "中";
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
