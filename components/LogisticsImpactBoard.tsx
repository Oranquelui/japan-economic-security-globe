"use client";

import type { ReactNode } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import type { LiveLogisticsItemViewModel, LiveLogisticsViewModel } from "../types/logistics";

interface LogisticsImpactBoardProps {
  activeId: string;
  liveLogistics: LiveLogisticsViewModel;
  onSelect: (id: string) => void;
  themePalette: ThemePalette;
}

export function LogisticsImpactBoard({
  activeId,
  liveLogistics,
  onSelect,
  themePalette
}: LogisticsImpactBoardProps) {
  const primaryItem = resolvePrimaryImpactItem(liveLogistics.items, activeId);
  const affectedRegions = dedupeStrings(liveLogistics.items.flatMap((item) => item.affectedRegions ?? [])).slice(0, 4);
  const portHinterlandItems = liveLogistics.items
    .filter((item) => item.operationClass !== "energy_maritime_support")
    .filter((item) => !isEnergySupportItem(item))
    .slice(0, 4);

  if (!primaryItem) {
    return null;
  }

  return (
    <section
      data-testid="logistics-impact-board"
      className="border-b px-4 py-4"
      style={{
        borderColor: themePalette.borderSubtle,
        background:
          `linear-gradient(180deg, rgba(6, 17, 24, 0.54), rgba(6, 17, 24, 0.22)), ${themePalette.surfacePanel}`
      }}
    >
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.accentText }}>
        JAPAN LOGISTICS IMPACT BOARD
      </div>
      <div className="mt-2 grid gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            今日の国内物流インパクト
          </h2>
          <p className="mt-1 text-[0.72rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            港湾後続から高速道路・鉄道貨物・内航へ波及する経済影響を、Energy系海上輸送と分けて判断する。
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelect(primaryItem.id)}
          className="w-full border-l-4 py-3 pl-3 pr-2 text-left transition hover:bg-white/[0.04]"
          style={{
            borderColor: themePalette.accent,
            background: "rgba(255,255,255,0.035)"
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <BoardChip themePalette={themePalette}>{primaryItem.sourceFreshness ?? primaryItem.lastSeenLabel}</BoardChip>
            <BoardChip themePalette={themePalette}>{primaryItem.statusLabel}</BoardChip>
            <BoardChip themePalette={themePalette}>{formatRegions(primaryItem)}</BoardChip>
          </div>
          <div className="mt-2 text-base font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            {formatImpactScope(primaryItem)}
          </div>
          <div className="mt-1 text-[0.72rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            {primaryItem.title}
          </div>
        </button>

        <div className="grid grid-cols-1 gap-2">
          <BoardMetric label="詰まりの場所" themePalette={themePalette}>
            {primaryItem.corridorLabel}
          </BoardMetric>
          <BoardMetric label="代替余力" themePalette={themePalette}>
            {primaryItem.substitutionCapacity ?? "鉄道貨物・内航・陸路の代替余力を確認"}
          </BoardMetric>
          <BoardMetric label="根拠ソース" themePalette={themePalette}>
            {primaryItem.sourceLabel}
          </BoardMetric>
        </div>

        <div className="flex flex-wrap gap-2">
          {affectedRegions.map((region) => (
            <BoardChip key={region} themePalette={themePalette}>
              {region}
            </BoardChip>
          ))}
          <BoardChip themePalette={themePalette}>{formatEvidenceClass(primaryItem.evidenceClass)}</BoardChip>
        </div>

        <div className="border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="mb-2 font-mono text-[0.56rem] uppercase tracking-[0.24em]" style={{ color: themePalette.textMuted }}>
            Impact Queue
          </div>
          <div className="space-y-1.5">
            {portHinterlandItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="grid w-full grid-cols-[4.25rem,1fr] gap-2 px-0 py-1.5 text-left text-[0.72rem] leading-5 transition hover:text-white"
                style={{ color: item.id === activeId ? themePalette.textPrimary : themePalette.textMuted }}
              >
                <span className="font-mono text-[0.62rem]" style={{ color: themePalette.accentText }}>
                  {formatOperationClass(item.operationClass)}
                </span>
                <span className="[overflow-wrap:anywhere]">{formatImpactScope(item)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function resolvePrimaryImpactItem(items: LiveLogisticsItemViewModel[], activeId: string) {
  return items.find((item) => item.id === activeId)
    ?? items.find((item) => item.operationClass === "port_hinterland_highway")
    ?? items.find((item) => item.laneId === "road")
    ?? items[0]
    ?? null;
}

function BoardMetric({
  children,
  label,
  themePalette
}: {
  children: ReactNode;
  label: string;
  themePalette: ThemePalette;
}) {
  return (
    <div className="grid grid-cols-[5.5rem,1fr] gap-2 text-[0.72rem] leading-5">
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.18em]" style={{ color: themePalette.accentText }}>
        {label}
      </div>
      <div className="[overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
        {children}
      </div>
    </div>
  );
}

function BoardChip({
  children,
  themePalette
}: {
  children: ReactNode;
  themePalette: ThemePalette;
}) {
  return (
    <span
      className="rounded border px-2 py-1 text-[0.62rem]"
      style={{
        borderColor: themePalette.borderSubtle,
        background: "rgba(255,255,255,0.04)",
        color: themePalette.textMuted
      }}
    >
      {children}
    </span>
  );
}

function dedupeStrings(values: string[]) {
  return [...new Set(values)];
}

function formatRegions(item: LiveLogisticsItemViewModel) {
  return item.affectedRegions?.length ? item.affectedRegions.join(" / ") : "国内主要圏";
}

function formatImpactScope(item: LiveLogisticsItemViewModel) {
  if (item.impactScope) {
    return item.impactScope;
  }

  if (item.laneId === "road" || item.kindLabel.includes("道路")) {
    return "首都圏の小売・部品・港湾後背地配送";
  }

  return item.title;
}

function formatEvidenceClass(evidenceClass: LiveLogisticsItemViewModel["evidenceClass"]) {
  switch (evidenceClass) {
    case "official_public":
      return "公的公開情報";
    case "official_public_plus_demo":
      return "公的公開 + demo";
    case "provider_gated_aggregate":
      return "provider集約";
    default:
      return "公開集約demo";
  }
}

function formatOperationClass(operationClass: LiveLogisticsItemViewModel["operationClass"]) {
  switch (operationClass) {
    case "port_hinterland_highway":
      return "ROAD";
    case "rail_freight_corridor":
      return "RAIL";
    case "coastal_port_follow_through":
      return "SEA";
    case "air_cargo_airport_ops":
      return "AIR";
    case "maritime_general_cargo":
      return "PORT";
    default:
      return "SUP";
  }
}

function isEnergySupportItem(item: LiveLogisticsItemViewModel) {
  return /tanker|LNG|crude|Hormuz|Malacca|AIS|タンカー|ホルムズ|マラッカ/i.test(
    `${item.title} ${item.kindLabel} ${item.corridorLabel}`
  );
}
