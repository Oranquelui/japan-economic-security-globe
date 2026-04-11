"use client";

import type { ReactNode } from "react";

import type { OperationRow } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";

interface MapInboxPanelProps {
  activeId: string;
  highRiskCount: number;
  monitoringCount: number;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  themeLabel: string;
  themePalette: ThemePalette;
}

export function MapInboxPanel({
  activeId,
  highRiskCount,
  monitoringCount,
  onQueryChange,
  onSelect,
  query,
  rows,
  themeLabel,
  themePalette
}: MapInboxPanelProps) {
  return (
    <aside
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/25"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${themePalette.borderSubtle}` }}>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
              監視インボックス
            </p>
            <div className="mt-1 text-sm font-semibold text-white">{themeLabel}</div>
          </div>
          <PaneBadge themePalette={themePalette}>{rows.length}件</PaneBadge>
        </div>

        <div
          className="mt-4 rounded-xl border p-4"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated
          }}
        >
          <div className="text-[1.8rem] font-semibold leading-none text-white">{rows.length}</div>
          <div className="mt-2 text-sm" style={{ color: themePalette.textMuted }}>
            現在の表示シグナル
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <PaneBadge themePalette={themePalette}>高リスク {highRiskCount}</PaneBadge>
            <PaneBadge themePalette={themePalette}>監視中 {monitoringCount}</PaneBadge>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
              検索
            </div>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="LNG、港湾、コメ、予算"
              className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-500"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanelElevated,
                color: themePalette.textPrimary
              }}
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            絞り込み
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "全部", value: "" },
              { label: "高リスク", value: "高" },
              { label: "監視中", value: "監視中" }
            ].map((filter) => {
              const active = query === filter.value;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => onQueryChange(filter.value)}
                  className="rounded-full border px-3 py-2 text-[0.68rem] transition"
                  style={
                    active
                      ? {
                          borderColor: themePalette.accent,
                          background: themePalette.accentSoft,
                          color: themePalette.textPrimary
                        }
                      : {
                          borderColor: themePalette.borderSubtle,
                          background: themePalette.surfacePanelElevated,
                          color: themePalette.textMuted
                        }
                  }
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1">
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            シグナル
          </div>
          <div
            className="mt-2 h-full overflow-auto rounded-xl border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            {rows.slice(0, 6).map((row) => {
              const isActive = row.id === activeId;

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className="w-full border-b px-3 py-3 text-left transition last:border-b-0"
                  style={
                    isActive
                      ? {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: `2px solid ${themePalette.accent}`,
                          background: "rgba(255,255,255,0.03)",
                          color: themePalette.textPrimary
                        }
                      : {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: "2px solid transparent",
                          background: "transparent",
                          color: themePalette.textMuted
                        }
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{row.label}</div>
                      <div className="mt-1 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                        {row.subject} / {row.status}
                      </div>
                    </div>
                    <PaneBadge themePalette={themePalette}>{row.urgency}</PaneBadge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PaneBadge({
  children,
  themePalette
}: {
  children: ReactNode;
  themePalette: ThemePalette;
}) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[0.68rem]"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel,
        color: themePalette.textMuted
      }}
    >
      {children}
    </span>
  );
}
