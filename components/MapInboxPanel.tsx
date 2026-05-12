"use client";

import type { ReactNode } from "react";

import { buildInboxSections } from "../lib/presentation/inbox";
import type {
  LiveLogisticsItemViewModel,
  LiveLogisticsLaneViewModel,
  LiveLogisticsViewModel
} from "../types/logistics";
import type { OperationRow } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";
import type { WatchboardBriefingViewModel } from "../lib/presentation/watchboard";
import type { WatchOverlayItemViewModel } from "../lib/presentation/watch-overlays";
import type { ThemeId } from "../types/semantic";
import { WatchboardBriefing } from "./WatchboardBriefing";

interface MapInboxPanelProps {
  activeId: string;
  briefing?: WatchboardBriefingViewModel | null;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  liveLogistics?: LiveLogisticsViewModel | null;
  themeId: ThemeId;
  themeLabel: string;
  themePalette: ThemePalette;
  watchOverlays?: WatchOverlayItemViewModel[];
}

export function MapInboxPanel({
  activeId,
  briefing = null,
  onQueryChange,
  onSelect,
  query,
  rows,
  liveLogistics = null,
  themeId,
  themeLabel,
  themePalette,
  watchOverlays = []
}: MapInboxPanelProps) {
  const sections = buildInboxSections(themeId, rows).filter((section) => section.rows.length > 0);

  return (
    <aside
      className="flex h-full w-full min-w-0 flex-col overflow-hidden"
      style={{ background: themePalette.surfacePanel }}
    >
      <div data-testid="command-pane-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {briefing ? (
          <section className="border-b p-3" style={{ borderColor: themePalette.borderSubtle }}>
            <WatchboardBriefing briefing={briefing} themePalette={themePalette} variant="pane" />
          </section>
        ) : null}

        {liveLogistics ? (
          <section className="border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.accentText }}>
                  {liveLogistics.title}
                </div>
                <p className="mt-1 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                  {liveLogistics.subtitle}
                </p>
              </div>
              <PaneBadge themePalette={themePalette}>{liveLogistics.items.length}件</PaneBadge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OverlayChip themePalette={themePalette}>{liveLogistics.updatedLabel}</OverlayChip>
              <OverlayChip themePalette={themePalette}>{liveLogistics.disclosureLabel}</OverlayChip>
            </div>
            <div className="mt-4 space-y-4">
              {getLiveLogisticsLanes(liveLogistics).map((lane) => (
                <LiveLogisticsLaneSection
                  key={lane.id}
                  activeId={activeId}
                  lane={lane}
                  onSelect={onSelect}
                  themePalette={themePalette}
                />
              ))}
            </div>
          </section>
        ) : null}

        {watchOverlays.length ? (
          <section className="border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
                  近接監視
                </div>
                <p className="mt-1 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                  公開可能な範囲に絞った、bounded な近接監視オーバーレイです。
                </p>
              </div>
              <PaneBadge themePalette={themePalette}>{watchOverlays.length}件</PaneBadge>
            </div>
            <div className="mt-3 space-y-2">
              {watchOverlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="rounded-xl border px-3 py-3"
                  style={{
                    borderColor: themePalette.borderSubtle,
                    background: themePalette.surfacePanelElevated
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <OverlayChip themePalette={themePalette}>{overlay.freshnessLabel}</OverlayChip>
                    <OverlayChip themePalette={themePalette}>{overlay.trustLabel}</OverlayChip>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{overlay.title}</div>
                  <p className="mt-1 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>
                    {overlay.summary}
                  </p>
                  <div className="mt-2 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                    {overlay.disclosureLabel}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

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

        <section className="px-4 py-4">
          <div
            data-testid="monitoring-inbox-scroll"
            className="max-h-[36rem] overflow-y-auto overscroll-contain border"
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
                      const ranking = row.ranking;

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
                              {ranking ? (
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className="rounded-full border px-2 py-1 text-[0.62rem] font-semibold"
                                    style={{
                                      borderColor: themePalette.accent,
                                      background: themePalette.accentSoft,
                                      color: themePalette.textPrimary
                                    }}
                                  >
                                    #{ranking.rank}
                                  </span>
                                  <span
                                    className="rounded-full border px-2 py-1 text-[0.62rem]"
                                    style={{
                                      borderColor: themePalette.borderSubtle,
                                      background: themePalette.surfacePanelElevated,
                                      color: themePalette.textMuted
                                    }}
                                  >
                                    {ranking.primaryAxisLabel}
                                  </span>
                                  {ranking.freshnessLabel ? (
                                    <OverlayChip themePalette={themePalette}>{ranking.freshnessLabel}</OverlayChip>
                                  ) : null}
                                  {ranking.confidenceLabel ? (
                                    <OverlayChip themePalette={themePalette}>{ranking.confidenceLabel}</OverlayChip>
                                  ) : null}
                                  {ranking.sourceTrustLabel ? (
                                    <OverlayChip themePalette={themePalette}>{ranking.sourceTrustLabel}</OverlayChip>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="truncate text-sm font-semibold">{row.label}</div>
                              <div className="mt-1 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                                {row.subject} / {row.status}
                              </div>
                              {ranking ? (
                                <p className="mt-2 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                                  {ranking.whyRanked}
                                </p>
                              ) : null}
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

function getLiveLogisticsLanes(liveLogistics: LiveLogisticsViewModel): LiveLogisticsLaneViewModel[] {
  const lanes = liveLogistics.lanes ?? [];

  if (lanes.length > 0) {
    return lanes;
  }

  return [
    {
      id: "maritime",
      items: liveLogistics.items,
      subtitle: liveLogistics.subtitle,
      title: "物流シグナル"
    }
  ];
}

function LiveLogisticsLaneSection({
  activeId,
  lane,
  onSelect,
  themePalette
}: {
  activeId: string;
  lane: LiveLogisticsLaneViewModel;
  onSelect: (id: string) => void;
  themePalette: ThemePalette;
}) {
  return (
    <section className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: themePalette.borderSubtle }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.72rem] font-semibold leading-5 text-white [overflow-wrap:anywhere]">{lane.title}</div>
          <p className="mt-0.5 text-[0.66rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            {lane.subtitle}
          </p>
        </div>
        <PaneBadge themePalette={themePalette}>{lane.items.length}件</PaneBadge>
      </div>
      <div className="mt-2 space-y-2">
        {lane.items.map((item) => (
          <LiveLogisticsItemButton
            key={item.id}
            activeId={activeId}
            item={item}
            onSelect={onSelect}
            themePalette={themePalette}
          />
        ))}
      </div>
    </section>
  );
}

function LiveLogisticsItemButton({
  activeId,
  item,
  onSelect,
  themePalette
}: {
  activeId: string;
  item: LiveLogisticsItemViewModel;
  onSelect: (id: string) => void;
  themePalette: ThemePalette;
}) {
  const isActive = activeId === item.id || item.relatedIds.includes(activeId);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.relatedIds[0] ?? item.id)}
      className="w-full rounded-lg border px-3 py-3 text-left transition hover:border-slate-300/40"
      style={{
        borderColor: isActive ? themePalette.accent : themePalette.borderSubtle,
        background: isActive ? themePalette.accentSoft : themePalette.surfacePanelElevated
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <OverlayChip themePalette={themePalette}>{item.kindLabel}</OverlayChip>
        <OverlayChip themePalette={themePalette}>{item.statusLabel}</OverlayChip>
        <OverlayChip themePalette={themePalette}>{item.lastSeenLabel}</OverlayChip>
      </div>
      <div className="mt-2 min-w-0 text-sm font-semibold leading-5 text-white [overflow-wrap:anywhere]">{item.title}</div>
      <div className="mt-1 min-w-0 text-[0.72rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
        {item.corridorLabel}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
        <span className="[overflow-wrap:anywhere]">{item.etaLabel}</span>
        <span className="[overflow-wrap:anywhere]">{item.sourceLabel}</span>
        <span className="[overflow-wrap:anywhere]">{item.confidenceLabel}</span>
        <span className="[overflow-wrap:anywhere]">{item.disclosureLabel}</span>
      </div>
    </button>
  );
}

function OverlayChip({
  children,
  themePalette
}: {
  children: ReactNode;
  themePalette: ThemePalette;
}) {
  return (
    <span
      className="rounded-full border px-2 py-1 text-[0.62rem]"
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
