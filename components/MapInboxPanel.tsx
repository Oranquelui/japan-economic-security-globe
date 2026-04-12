"use client";

import type { ReactNode } from "react";

import { buildInboxSections } from "../lib/presentation/inbox";
import type { OperationRow } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";
import type { ThemeId } from "../types/semantic";

interface MapInboxPanelProps {
  activeId: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  themeId: ThemeId;
  themeLabel: string;
  themePalette: ThemePalette;
}

export function MapInboxPanel({
  activeId,
  onQueryChange,
  onSelect,
  query,
  rows,
  themeId,
  themeLabel,
  themePalette
}: MapInboxPanelProps) {
  const sections = buildInboxSections(themeId, rows).filter((section) => section.rows.length > 0);

  return (
    <aside
      className="flex h-full min-w-0 flex-col overflow-hidden"
      style={{ background: themePalette.surfacePanel }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
              監視インボックス
            </p>
            <div className="mt-1 text-sm font-semibold text-white">{themeLabel}</div>
          </div>
          <PaneBadge themePalette={themePalette}>{rows.length}件</PaneBadge>
        </div>

        <section className="border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
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
        </section>

        <section className="border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
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
        </section>

        <section className="min-h-0 flex-1 overflow-hidden px-4 py-4">
          <div
            data-testid="monitoring-inbox-scroll"
            className="h-full overflow-y-auto overscroll-contain border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            <div className="space-y-4 p-3">
              {sections.map((section) => (
                <section key={section.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
                        {section.label}
                      </div>
                      <p className="mt-1 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                        {section.description}
                      </p>
                    </div>
                    <PaneBadge themePalette={themePalette}>{section.rows.length}件</PaneBadge>
                  </div>

                  <div className="mt-2 overflow-hidden rounded-xl border" style={{ borderColor: themePalette.borderSubtle }}>
                    {section.rows.map((row) => {
                      const isActive = row.id === activeId;

                      return (
                        <button
                          key={`${section.id}-${row.id}`}
                          type="button"
                          onClick={() => onSelect(row.id)}
                          className="w-full border-b px-3 py-3 text-left transition last:border-b-0"
                          style={
                            isActive
                              ? {
                                  borderBottomColor: themePalette.borderSubtle,
                                  borderLeft: `2px solid ${themePalette.accent}`,
                                  background: themePalette.surfacePanel,
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
                </section>
              ))}
            </div>
          </div>
        </section>
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
