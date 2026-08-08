"use client";

import type { ReactNode } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import type { LiveLogisticsItemViewModel, LiveLogisticsViewModel } from "../types/logistics";
import type { RoadOperationsViewModel } from "../types/road-operations";
import { LogisticsRouteOverviewPanel } from "./LogisticsRouteOverviewPanel";

interface LogisticsImpactBoardProps {
  activeId: string;
  liveLogistics: LiveLogisticsViewModel;
  roadOperations?: RoadOperationsViewModel | null;
  onSelect: (id: string) => void;
  themePalette: ThemePalette;
}

export function LogisticsImpactBoard({
  activeId,
  liveLogistics,
  roadOperations = null,
  onSelect,
  themePalette
}: LogisticsImpactBoardProps) {
  const primaryItem = resolvePrimaryImpactItem(liveLogistics.items, activeId);
  const primaryPosture = primaryItem ? getItemEvidencePosture(primaryItem) : null;
  const domesticItems = portHinterlandCandidates(liveLogistics.items);
  const boardEvidenceSummary = buildBoardEvidenceSummary(domesticItems);
  const affectedRegions = dedupeStrings(primaryItem?.affectedRegions ?? []).slice(0, 4);
  const portHinterlandItems = domesticItems.slice(0, 4);

  if (roadOperations) {
    return (
      <div className="border-b px-3 py-3" style={{ borderColor: themePalette.borderSubtle }}>
        <LogisticsRouteOverviewPanel
          activeId={activeId}
          liveLogistics={liveLogistics}
          roadOperations={roadOperations}
          onSelect={onSelect}
          themePalette={themePalette}
        />
      </div>
    );
  }

  return (
    <section
      data-testid="logistics-impact-board"
      role="region"
      aria-label="国内物流の代表シナリオ"
      className="border-b px-4 py-4"
      style={{
        borderColor: themePalette.borderSubtle,
        background:
          `linear-gradient(180deg, rgba(6, 17, 24, 0.54), rgba(6, 17, 24, 0.22)), ${themePalette.surfacePanel}`
      }}
    >
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.accentText }}>
        JAPAN LOGISTICS SCENARIO BOARD
      </div>
      <div className="mt-2 grid gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            国内物流の代表シナリオ
          </h2>
          <p className="mt-1 text-[0.72rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            {boardEvidenceSummary} Energy系海上輸送とは分けて確認する。現在情報ではありません。
          </p>
        </div>

        {primaryItem && primaryPosture ? (
          <>
            <button
              type="button"
              aria-label={`代表シナリオ ${primaryItem.title} ${formatAccessiblePosture(primaryPosture)}`}
              aria-pressed="true"
              onClick={() => onSelect(primaryItem.id)}
              className="w-full border-l-4 py-3 pl-3 pr-2 text-left transition hover:bg-white/[0.04]"
              style={{
                borderColor: themePalette.accent,
                background: "rgba(255,255,255,0.035)"
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {primaryPosture.chips.map((chip) => (
                  <BoardChip key={chip} themePalette={themePalette}>{chip}</BoardChip>
                ))}
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
          </>
        ) : (
          <div
            role="status"
            className="rounded border border-dashed px-3 py-4 text-center text-[0.72rem] leading-5"
            style={{ borderColor: themePalette.borderStrong, color: themePalette.textMuted }}
          >
            経路または道路イベントを選択してください
          </div>
        )}

        <div className="border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="mb-2 font-mono text-[0.56rem] uppercase tracking-[0.24em]" style={{ color: themePalette.textMuted }}>
            Impact Queue
          </div>
          <div className="space-y-1.5">
            {portHinterlandItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${formatOperationClass(item.operationClass)} 代表シナリオ ${formatImpactScope(item)} ${formatAccessiblePosture(getItemEvidencePosture(item))}`}
                aria-pressed={item.id === activeId}
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
  if (!activeId) return null;
  const exactItem = items.find((item) => item.id === activeId);
  return exactItem && isEligibleDomesticImpactItem(exactItem) ? exactItem : null;
}

function isEligibleDomesticImpactItem(item: LiveLogisticsItemViewModel) {
  if (item.operationClass === "energy_maritime_support" || isEnergySupportItem(item)) return false;
  if (item.operationClass === "maritime_general_cargo") return item.laneId === "maritime";
  return item.laneId === "road"
    || item.laneId === "rail"
    || item.laneId === "coastal"
    || item.laneId === "air";
}

function portHinterlandCandidates(items: LiveLogisticsItemViewModel[]) {
  return items.filter(isEligibleDomesticImpactItem);
}

function getItemEvidencePosture(item: LiveLogisticsItemViewModel) {
  switch (item.evidenceClass) {
    case "official_public":
      return {
        label: "公的公開情報 / 遅延集約 / 現在情報ではありません",
        chips: ["公的公開情報", "遅延集約", "現在情報ではありません"]
      };
    case "provider_gated_aggregate":
      return {
        label: "事業者集約 / 遅延集約 / 現在情報ではありません",
        chips: ["事業者集約", "遅延集約", "現在情報ではありません"]
      };
    case "official_public_plus_demo":
      return {
        label: "固定デモ / 現在情報ではありません / 更新なし",
        chips: ["固定デモ", "現在情報ではありません", "更新なし"]
      };
    default:
      return {
        label: "固定デモ / 現在情報ではありません / 更新なし",
        chips: ["固定デモ", "現在情報ではありません", "更新なし"]
      };
  }
}

function formatAccessiblePosture(posture: ReturnType<typeof getItemEvidencePosture>) {
  return posture.label.split(" / ").join(" ");
}

function buildBoardEvidenceSummary(items: LiveLogisticsItemViewModel[]) {
  const hasOfficialDelayed = items.some((item) => item.evidenceClass === "official_public");
  const hasProviderDelayed = items.some((item) => item.evidenceClass === "provider_gated_aggregate");
  const hasDemo = items.some((item) => (
    item.evidenceClass === "official_public_plus_demo"
    || item.evidenceClass === "public_aggregate_demo"
    || !item.evidenceClass
  ));
  const evidenceLabels = [
    hasDemo ? "固定デモ" : null,
    hasOfficialDelayed ? "公的公開情報の遅延集約" : null,
    hasProviderDelayed ? "事業者集約の遅延情報" : null
  ].filter((label): label is string => Boolean(label));
  return `${evidenceLabels.length > 0 ? evidenceLabels.join("と") : "情報姿勢未確認"}を含む代表シナリオ。`;
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
