"use client";

import type { CSSProperties, ReactNode } from "react";

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
import type { RoadOperationsViewModel } from "../types/road-operations";
import { LogisticsImpactBoard } from "./LogisticsImpactBoard";
import { WatchboardBriefing } from "./WatchboardBriefing";

interface MapInboxPanelProps {
  activeId: string;
  briefing?: WatchboardBriefingViewModel | null;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  liveLogistics?: LiveLogisticsViewModel | null;
  roadOperations?: RoadOperationsViewModel | null;
  showLogisticsImpactBoard?: boolean;
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
  roadOperations = null,
  showLogisticsImpactBoard = true,
  themeId,
  themeLabel,
  themePalette,
  watchOverlays = []
}: MapInboxPanelProps) {
  const sections = buildInboxSections(themeId, rows).filter((section) => section.rows.length > 0);

  return (
    <aside
      className="flex h-full w-full min-w-0 flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${themePalette.surfacePanelElevated} 0%, ${themePalette.surfacePanel} 100%)`
      }}
    >
      <div data-testid="command-pane-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {briefing ? (
          <section className="border-b p-2.5" style={{ borderColor: themePalette.borderSubtle }}>
            <WatchboardBriefing briefing={briefing} themePalette={themePalette} variant="pane" />
          </section>
        ) : null}

        {showLogisticsImpactBoard && themeId === "logistics" && liveLogistics ? (
          <LogisticsImpactBoard
            activeId={activeId}
            liveLogistics={liveLogistics}
            roadOperations={roadOperations}
            onSelect={onSelect}
            themePalette={themePalette}
          />
        ) : null}

        {liveLogistics ? (
          <section className="border-b px-3 py-3" style={{ borderColor: themePalette.borderSubtle }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="ops-label" style={{ color: themePalette.accentText }}>
                  {liveLogistics.title}
                </div>
                <p className="mt-1 line-clamp-2 text-[0.66rem] leading-4" style={{ color: themePalette.textMuted }}>
                  {liveLogistics.subtitle}
                </p>
              </div>
              <PaneBadge themePalette={themePalette}>{liveLogistics.items.length}件</PaneBadge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <OverlayChip themePalette={themePalette}>{liveLogistics.updatedLabel}</OverlayChip>
              <OverlayChip themePalette={themePalette}>{liveLogistics.disclosureLabel}</OverlayChip>
            </div>
            <div className="mt-3 space-y-3">
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
          <section className="border-b px-3 py-3" style={{ borderColor: themePalette.borderSubtle }}>
            <div className="flex items-center justify-between gap-2">
              <div className="ops-label" style={{ color: themePalette.textMuted }}>
                近接監視
              </div>
              <PaneBadge themePalette={themePalette}>{watchOverlays.length}件</PaneBadge>
            </div>
            <div className="mt-2 space-y-1.5">
              {watchOverlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="rounded-[10px] border px-2.5 py-2"
                  style={{
                    borderColor: themePalette.borderSubtle,
                    background: "rgba(255,255,255,0.025)"
                  }}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <OverlayChip themePalette={themePalette}>{overlay.freshnessLabel}</OverlayChip>
                    <OverlayChip themePalette={themePalette}>{overlay.trustLabel}</OverlayChip>
                  </div>
                  <div className="mt-1.5 text-[0.8rem] font-semibold leading-5 text-white">{overlay.title}</div>
                  <p className="mt-1 line-clamp-2 text-[0.68rem] leading-4" style={{ color: themePalette.textMuted }}>
                    {overlay.summary}
                  </p>
                  <div className="mt-1 text-[0.62rem]" style={{ color: themePalette.textMuted }}>
                    {overlay.disclosureLabel}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div
          className="sticky top-0 z-10 border-b px-3 py-2.5 backdrop-blur-xl"
          style={{
            borderColor: themePalette.borderSubtle,
            background: "rgba(8, 12, 20, 0.88)"
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="ops-label" style={{ color: themePalette.textMuted }}>
                監視インボックス
              </p>
              <div className="mt-0.5 truncate text-[0.84rem] font-semibold text-white">{themeLabel}</div>
            </div>
            <PaneBadge themePalette={themePalette}>{rows.length}件</PaneBadge>
          </div>

          <label className="mt-2 block">
            <div className="ops-label" style={{ color: themePalette.textMuted }}>
              検索
            </div>
            <input
              suppressHydrationWarning
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="LNG、港湾、コメ、予算"
              className="mt-1.5 w-full rounded-[10px] border px-3 py-2 text-[0.8rem] outline-none transition [background-color:var(--map-inbox-input-bg)] [border-color:var(--map-inbox-input-border)] [color:var(--map-inbox-input-text)] placeholder:text-slate-500"
              style={{
                "--map-inbox-input-bg": "rgba(255,255,255,0.03)",
                "--map-inbox-input-border": themePalette.borderSubtle,
                "--map-inbox-input-text": themePalette.textPrimary
              } as CSSProperties}
            />
          </label>

          <div className="mt-2">
            <div className="ops-label" style={{ color: themePalette.textMuted }}>
              絞り込み
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                  className="ops-chip transition"
                  style={
                    active
                      ? {
                          borderColor: `${themePalette.accent}99`,
                          background: themePalette.accentSoft,
                          color: themePalette.textPrimary
                        }
                      : {
                          borderColor: themePalette.borderSubtle,
                          background: "rgba(255,255,255,0.03)",
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
        </div>

        <section className="px-2.5 py-2.5">
          <div
            data-testid="monitoring-inbox-scroll"
            className="max-h-[40rem] overflow-y-auto overscroll-contain rounded-[12px] border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: "rgba(0,0,0,0.16)"
            }}
          >
            <div className="space-y-3 p-2">
              {sections.map((section) => (
                <section key={section.id}>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="min-w-0">
                      <div className="ops-label" style={{ color: themePalette.textMuted }}>
                        {section.label}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[0.64rem] leading-4" style={{ color: themePalette.textMuted }}>
                        {section.description}
                      </p>
                    </div>
                    <PaneBadge themePalette={themePalette}>{section.rows.length}件</PaneBadge>
                  </div>

                  <div className="mt-1.5 overflow-hidden rounded-[10px] border" style={{ borderColor: themePalette.borderSubtle }}>
                    {section.rows.map((row) => {
                      const isActive = row.id === activeId;
                      const ranking = row.ranking;

                      return (
                        <button
                          key={`${section.id}-${row.id}`}
                          type="button"
                          onClick={() => onSelect(row.id)}
                          className="w-full border-b px-2.5 py-2 text-left transition last:border-b-0"
                          style={
                            isActive
                              ? {
                                  borderBottomColor: themePalette.borderSubtle,
                                  borderLeft: `2px solid ${themePalette.accent}`,
                                  background: themePalette.accentSoft,
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {ranking ? (
                                <div className="mb-1 flex flex-wrap items-center gap-1">
                                  <span
                                    className="ops-chip font-semibold"
                                    style={{
                                      borderColor: `${themePalette.accent}88`,
                                      background: themePalette.accentSoft,
                                      color: themePalette.textPrimary
                                    }}
                                  >
                                    #{ranking.rank}
                                  </span>
                                  <OverlayChip themePalette={themePalette}>{ranking.primaryAxisLabel}</OverlayChip>
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
                              <div className="truncate text-[0.8rem] font-semibold leading-5">{row.label}</div>
                              <div className="mt-0.5 truncate text-[0.64rem]" style={{ color: themePalette.textMuted }}>
                                {row.subject} / {row.status}
                              </div>
                              {ranking ? (
                                <p className="mt-1 line-clamp-2 text-[0.64rem] leading-4" style={{ color: themePalette.textMuted }}>
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
    <section className="border-t pt-2.5 first:border-t-0 first:pt-0" style={{ borderColor: themePalette.borderSubtle }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[0.72rem] font-semibold leading-4 text-white">{lane.title}</div>
          <p className="mt-0.5 line-clamp-1 text-[0.62rem] leading-4" style={{ color: themePalette.textMuted }}>
            {lane.subtitle}
          </p>
        </div>
        <PaneBadge themePalette={themePalette}>{lane.items.length}件</PaneBadge>
      </div>
      <div className="mt-1.5 space-y-1.5">
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
      onClick={() => onSelect(item.id)}
      className="w-full rounded-[10px] border px-2.5 py-2 text-left transition"
      style={{
        borderColor: isActive ? `${themePalette.accent}99` : themePalette.borderSubtle,
        background: isActive ? themePalette.accentSoft : "rgba(255,255,255,0.025)"
      }}
    >
      <div className="flex flex-wrap items-center gap-1">
        <OverlayChip themePalette={themePalette}>{item.kindLabel}</OverlayChip>
        <OverlayChip themePalette={themePalette}>{item.statusLabel}</OverlayChip>
        <OverlayChip themePalette={themePalette}>{item.lastSeenLabel}</OverlayChip>
      </div>
      <div className="mt-1.5 line-clamp-2 min-w-0 text-[0.8rem] font-semibold leading-5 text-white">{item.title}</div>
      <div className="mt-0.5 line-clamp-1 min-w-0 text-[0.66rem] leading-4" style={{ color: themePalette.textMuted }}>
        {item.corridorLabel}
      </div>
      <div className="mt-1 grid grid-cols-1 gap-0.5 text-[0.62rem]" style={{ color: themePalette.textMuted }}>
        <span className="truncate">{item.etaLabel}</span>
        <span className="truncate">{item.sourceLabel}</span>
        <span className="truncate">{item.confidenceLabel}</span>
        <span className="truncate">{item.disclosureLabel}</span>
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
      className="ops-chip"
      style={{
        borderColor: themePalette.borderSubtle,
        background: "rgba(255,255,255,0.03)",
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
      className="ops-chip shrink-0"
      style={{
        borderColor: themePalette.borderSubtle,
        background: "rgba(255,255,255,0.03)",
        color: themePalette.textMuted
      }}
    >
      {children}
    </span>
  );
}
