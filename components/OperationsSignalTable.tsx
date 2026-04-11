"use client";

import type { OperationRow } from "../lib/presentation/operations";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { getStatusTone, getUrgencyTone, resolveToneColor } from "../lib/presentation/palette";

interface OperationsSignalTableProps {
  activeId: string;
  collapsed: boolean;
  collapsible?: boolean;
  onSelect: (id: string) => void;
  onToggleCollapsed: () => void;
  query: string;
  rows: OperationRow[];
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

export function OperationsSignalTable({
  activeId,
  collapsed,
  collapsible = true,
  onSelect,
  onToggleCollapsed,
  query,
  rows,
  statusPalette,
  themePalette
}: OperationsSignalTableProps) {
  if (collapsible && collapsed) {
    return (
      <section
        className="mx-auto max-w-md rounded-2xl border shadow-2xl shadow-black/35"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanel
        }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em]" style={{ color: themePalette.textMuted }}>
              比較表
            </p>
            <div className="mt-1 text-sm font-semibold text-white">日本向け依存シグナル {rows.length}件</div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg border px-3 py-2 text-xs transition"
            style={{
              borderColor: themePalette.accent,
              background: themePalette.accentSoft,
              color: themePalette.textPrimary
            }}
          >
            表を開く
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex h-full flex-col overflow-hidden border-t"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanel
        }}
      >
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em]" style={{ color: themePalette.textMuted }}>
            比較表
          </p>
          <h2 className="mt-1 text-base font-semibold text-white">日本向け依存シグナル</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em]" style={{ color: themePalette.textMuted }}>
          <span
            className="rounded border px-3 py-2"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            {rows.length} 件表示
          </span>
          {query ? (
            <span
              className="rounded border px-3 py-2"
              style={buildWidgetButtonStyle(statusPalette.monitoring)}
            >
              絞り込み中
            </span>
          ) : null}
          <span
            className="rounded border px-3 py-2"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            出典あり
          </span>
          {collapsible ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded border px-3 py-2 text-[0.68rem] transition"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanelElevated,
                color: themePalette.textMuted
              }}
            >
              閉じる
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead
            className="sticky top-0 z-10 text-[0.62rem] uppercase tracking-[0.22em] backdrop-blur"
            style={{
              background: themePalette.surfacePanelElevated,
              color: themePalette.textMuted
            }}
          >
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.id);
                  }
                }}
                className="cursor-pointer transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                role="button"
                tabIndex={0}
                aria-label={row.label}
                aria-pressed={activeId === row.id}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: activeId === row.id ? themePalette.accentSoft : "transparent",
                  color: activeId === row.id ? themePalette.textPrimary : "#cbd5e1",
                  outlineColor: themePalette.accent
                }}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                  {row.type}
                </td>
                <td className="min-w-64 px-4 py-3 font-semibold">{row.label}</td>
                <td className="whitespace-nowrap px-4 py-3" style={{ color: themePalette.textMuted }}>
                  {row.subject}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={buildBadgeStyle(resolveToneColor(getUrgencyTone(row.urgency), themePalette, statusPalette))}
                  >
                    {row.urgency}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={buildBadgeStyle(resolveToneColor(getStatusTone(row.status), themePalette, statusPalette))}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="min-w-40 px-4 py-3 text-slate-300">{row.action}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" style={{ color: themePalette.textMuted }}>
                  {row.period}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildBadgeStyle(color: string) {
  return {
    borderColor: `${color}55`,
    background: `${color}14`,
    color
  };
}

function buildWidgetButtonStyle(color: string) {
  return {
    borderColor: `${color}55`,
    background: `${color}14`,
    color
  };
}
