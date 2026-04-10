"use client";

import type { OperationRow } from "../lib/presentation/operations";

interface OperationsSignalTableProps {
  activeId: string;
  onSelect: (id: string) => void;
  rows: OperationRow[];
}

export function OperationsSignalTable({ activeId, onSelect, rows }: OperationsSignalTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#07101b]/95 shadow-2xl shadow-black/35">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 bg-[#0c1624] px-5 py-3">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-slate-500">Operations Grid</p>
          <h2 className="mt-1 text-base font-semibold text-white">日本向け依存シグナル</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
          <span className="rounded border border-slate-700 bg-black/30 px-3 py-2">{rows.length} 件表示</span>
          <span className="rounded border border-slate-700 bg-black/30 px-3 py-2">出典あり</span>
        </div>
      </div>

      <div className="max-h-72 overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0c1624]/95 text-[0.62rem] uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
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
                  activeId === row.id ? "bg-sky-300/[0.12] text-white" : "bg-transparent text-slate-300 hover:bg-white/[0.05]"
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
