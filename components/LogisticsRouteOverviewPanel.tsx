"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import type {
  LiveLogisticsItemViewModel,
  LiveLogisticsLaneId,
  LiveLogisticsMapRoute,
  LiveLogisticsOperationClass,
  LiveLogisticsViewModel
} from "../types/logistics";
import type {
  RoadConditionViewModel,
  RoadOperationsViewModel,
  RoadRestrictionViewModel
} from "../types/road-operations";

interface LogisticsRouteOverviewPanelProps {
  activeId: string;
  liveLogistics: LiveLogisticsViewModel;
  roadOperations?: RoadOperationsViewModel | null;
  onSelect: (id: string) => void;
  themePalette: ThemePalette;
}

type RepresentativeLane = "road" | "rail" | "coastal" | "air";

const REPRESENTATIVE_LANES: readonly RepresentativeLane[] = ["road", "rail", "coastal", "air"];

const LANE_PRESENTATION: Record<RepresentativeLane, { label: string; symbol: string }> = {
  road: { label: "道路", symbol: "◆" },
  rail: { label: "鉄道", symbol: "╫" },
  coastal: { label: "内航", symbol: "≈" },
  air: { label: "航空", symbol: "✈" }
};

const EXPECTED_OPERATION_CLASS: Record<RepresentativeLane, LiveLogisticsOperationClass> = {
  road: "port_hinterland_highway",
  rail: "rail_freight_corridor",
  coastal: "coastal_port_follow_through",
  air: "air_cargo_airport_ops"
};

export function LogisticsRouteOverviewPanel({
  activeId,
  liveLogistics,
  roadOperations = null,
  onSelect,
  themePalette
}: LogisticsRouteOverviewPanelProps) {
  const itemById = new Map(liveLogistics.items.map((item) => [item.id, item]));
  const representativeRoutes = liveLogistics.mapRoutes.filter((route) => (
    isRepresentativeLane(route.laneId)
    && itemById.get(route.id)?.operationClass === EXPECTED_OPERATION_CLASS[route.laneId]
  ));
  const maritimeSupportRoutes = liveLogistics.mapRoutes.filter((route) => {
    const item = itemById.get(route.id);
    return route.laneId === "maritime" && item?.operationClass === "maritime_general_cargo";
  });
  const regions = uniqueStrings(representativeRoutes.flatMap((route) => (
    itemById.get(route.id)?.affectedRegions ?? []
  )));
  const modeCount = new Set(representativeRoutes.map((route) => route.laneId)).size;
  const roadEvents = roadOperations
    ? buildRoadEventChoices(roadOperations, new Set(
        representativeRoutes.filter((route) => route.laneId === "road").map((route) => route.id)
      ))
    : [];

  return (
    <section
      role="region"
      aria-label="国内物流の代表経路"
      data-testid="logistics-route-overview"
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: themePalette.borderStrong,
        background: `linear-gradient(160deg, ${themePalette.surfacePanelElevated}, rgba(6, 15, 22, 0.96))`
      }}
    >
      <div className="border-b px-3 py-3" style={{ borderColor: themePalette.borderSubtle }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[0.56rem] uppercase tracking-[0.24em]" style={{ color: themePalette.accentText }}>
              JAPAN DOMESTIC ROUTE CONTROL
            </div>
            <h2 className="mt-1 text-sm font-semibold text-white">国内物流の代表経路</h2>
          </div>
          <span
            className="shrink-0 rounded border px-2 py-1 font-mono text-[0.56rem] tracking-[0.12em]"
            style={{ borderColor: themePalette.borderStrong, color: themePalette.accentText }}
          >
            固定デモ
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded border" style={{ borderColor: themePalette.borderSubtle }}>
          <SummaryMetric value={`${representativeRoutes.length}代表経路`} themePalette={themePalette} />
          <SummaryMetric value={`${modeCount}輸送モード`} themePalette={themePalette} />
          <SummaryMetric value={`港湾前後 ${maritimeSupportRoutes.length}補助`} themePalette={themePalette} />
        </div>

        <dl className="mt-2 grid gap-1 text-[0.64rem] leading-4">
          <StateRow label="道路情報" themePalette={themePalette}>
            {roadOperations
              ? `${roadOperations.provider.label} / ${roadOperations.provider.state === "available" ? "接続済み" : "利用不可"}`
              : "公式道路交通フィード未接続 / 利用不可"}
          </StateRow>
          <StateRow label="情報姿勢" themePalette={themePalette}>
            固定デモ / 現在情報ではありません / 更新なし
          </StateRow>
          <StateRow label="対象地域" themePalette={themePalette}>
            {regions.length > 0 ? regions.join(" / ") : "データなし"}
          </StateRow>
          <StateRow label="判断項目" themePalette={themePalette}>
            到着見込み: データなし / 物流影響: データなし
          </StateRow>
        </dl>
      </div>

      <div className="space-y-3 px-3 py-3">
        {REPRESENTATIVE_LANES.map((laneId) => {
          const routes = representativeRoutes.filter((route) => route.laneId === laneId);
          if (routes.length === 0) return null;
          const presentation = LANE_PRESENTATION[laneId];

          return (
            <div key={laneId} role="group" aria-label={`${presentation.label}の代表経路`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  data-logistics-mode-symbol={laneId}
                  className="flex h-5 w-5 items-center justify-center rounded-sm border font-mono text-[0.62rem]"
                  style={{ borderColor: themePalette.borderStrong, color: themePalette.accentText }}
                >
                  {presentation.symbol}
                </span>
                <span className="font-mono text-[0.58rem] font-semibold tracking-[0.18em]" style={{ color: themePalette.textMuted }}>
                  {presentation.label}
                </span>
                <span className="text-[0.58rem] tabular-nums" style={{ color: themePalette.textMuted }}>
                  {routes.length}経路
                </span>
              </div>
              <div className="space-y-1.5">
                {routes.map((route) => {
                  const item = itemById.get(route.id);
                  return item ? (
                    <RouteChoice
                      key={route.id}
                      activeId={activeId}
                      item={item}
                      modeLabel={presentation.label}
                      onSelect={onSelect}
                      route={route}
                      themePalette={themePalette}
                    />
                  ) : null;
                })}
                {laneId === "road" && roadEvents.length > 0 ? (
                  <div className="ml-2 border-l pl-2" style={{ borderColor: themePalette.borderSubtle }}>
                    <div className="mb-1 font-mono text-[0.54rem] tracking-[0.16em]" style={{ color: themePalette.textMuted }}>
                      道路状態デモ
                    </div>
                    <div className="space-y-1">
                      {roadEvents.map((event) => (
                        <ChoiceButton
                          key={event.id}
                          active={activeId === event.id}
                          accessibleLabel={`道路 ${event.categoryLabel} ${event.label} ${event.stateLabel}`}
                          eyebrow={event.categoryLabel}
                          label={event.label}
                          meta={event.stateLabel}
                          onClick={() => onSelect(event.id)}
                          symbol={event.symbol}
                          themePalette={themePalette}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {maritimeSupportRoutes.length > 0 ? (
          <div
            role="group"
            aria-label="港湾前後の補助"
            className="border-t border-dashed pt-3"
            style={{ borderColor: themePalette.borderStrong }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span
                aria-hidden="true"
                data-logistics-mode-symbol="maritime-support"
                className="flex h-5 w-5 items-center justify-center rounded-sm border font-mono text-[0.62rem]"
                style={{ borderColor: themePalette.borderStrong, color: themePalette.textMuted }}
              >
                ◇
              </span>
              <span className="text-[0.64rem] font-semibold text-white">港湾前後の補助</span>
              <span className="text-[0.58rem]" style={{ color: themePalette.textMuted }}>代表経路数には含めない</span>
            </div>
            <div className="space-y-1">
              {maritimeSupportRoutes.map((route) => {
                const item = itemById.get(route.id);
                return item ? (
                  <ChoiceButton
                    key={route.id}
                    active={activeId === route.id}
                    accessibleLabel={`港湾前後の補助 ${item.title} 固定デモ 現在情報ではありません`}
                    eyebrow="一般貨物"
                    label={item.title}
                    meta="固定デモ / 現在情報ではありません"
                    onClick={() => onSelect(route.id)}
                    symbol="◇"
                    themePalette={themePalette}
                  />
                ) : null;
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SummaryMetric({ value, themePalette }: { value: string; themePalette: ThemePalette }) {
  return (
    <div className="bg-black/15 px-1.5 py-2 text-center text-[0.62rem] font-semibold tabular-nums" style={{ color: themePalette.textPrimary }}>
      {value}
    </div>
  );
}

function StateRow({
  children,
  label,
  themePalette
}: {
  children: ReactNode;
  label: string;
  themePalette: ThemePalette;
}) {
  return (
    <div className="grid grid-cols-[4.5rem,1fr] gap-2">
      <dt className="font-mono" style={{ color: themePalette.accentText }}>{label}</dt>
      <dd className="[overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>{children}</dd>
    </div>
  );
}

function RouteChoice({
  activeId,
  item,
  modeLabel,
  onSelect,
  route,
  themePalette
}: {
  activeId: string;
  item: LiveLogisticsItemViewModel;
  modeLabel: string;
  onSelect: (id: string) => void;
  route: LiveLogisticsMapRoute;
  themePalette: ThemePalette;
}) {
  const posture = item.evidenceClass === "official_public"
    ? "公開集約 / 遅延情報"
    : "固定デモ / 現在情報ではありません";

  return (
    <ChoiceButton
      active={activeId === route.id}
      accessibleLabel={`${modeLabel} 代表経路 ${item.title} ${posture.replace(" / ", " ")}`}
      eyebrow="代表経路"
      label={item.title}
      meta={posture}
      onClick={() => onSelect(route.id)}
      symbol={LANE_PRESENTATION[route.laneId as RepresentativeLane].symbol}
      themePalette={themePalette}
    />
  );
}

function ChoiceButton({
  accessibleLabel,
  active,
  eyebrow,
  label,
  meta,
  onClick,
  symbol,
  themePalette
}: {
  accessibleLabel: string;
  active: boolean;
  eyebrow: string;
  label: string;
  meta: string;
  onClick: () => void;
  symbol: string;
  themePalette: ThemePalette;
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={active}
      onClick={onClick}
      className="grid w-full grid-cols-[1.4rem,1fr] gap-2 rounded-md border px-2 py-2 text-left transition hover:bg-white/[0.04]"
      style={{
        borderColor: active ? themePalette.accent : themePalette.borderSubtle,
        background: active ? themePalette.accentSoft : "rgba(255,255,255,0.02)",
        "--route-choice-color": active ? themePalette.accentText : themePalette.textMuted
      } as CSSProperties}
    >
      <span aria-hidden="true" className="pt-0.5 text-center font-mono text-[0.62rem]" style={{ color: "var(--route-choice-color)" }}>
        {symbol}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[0.52rem] tracking-[0.14em]" style={{ color: themePalette.accentText }}>
          {eyebrow}
        </span>
        <span className="mt-0.5 block text-[0.7rem] font-semibold leading-4 text-white [overflow-wrap:anywhere]">
          {label}
        </span>
        <span className="mt-0.5 block text-[0.58rem] leading-4 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
          {meta}
        </span>
      </span>
    </button>
  );
}

interface RoadEventChoice {
  categoryLabel: string;
  id: string;
  label: string;
  stateLabel: string;
  symbol: string;
}

function buildRoadEventChoices(
  roadOperations: RoadOperationsViewModel,
  representativeRoadRouteIds: ReadonlySet<string>
): RoadEventChoice[] {
  const segmentById = new Map(roadOperations.segments.map((segment) => [segment.id, segment]));
  const matchesRepresentativeRoute = (segmentId: string) => {
    const routeId = segmentById.get(segmentId)?.routeId;
    return Boolean(routeId && representativeRoadRouteIds.has(routeId));
  };

  return [
    ...roadOperations.conditions
      .filter((event) => matchesRepresentativeRoute(event.segmentId))
      .map(conditionToChoice),
    ...roadOperations.restrictions
      .filter((event) => matchesRepresentativeRoute(event.segmentId))
      .map(restrictionToChoice)
  ];
}

function conditionToChoice(event: RoadConditionViewModel): RoadEventChoice {
  const category = {
    normal: { label: "平常例", symbol: "—" },
    slow: { label: "低速例", symbol: ":" },
    congestion: { label: "渋滞例", symbol: "≋" }
  }[event.condition];
  return {
    categoryLabel: category.label,
    id: event.id,
    label: formatAffectedRange(event),
    stateLabel: buildRoadEventState(event),
    symbol: category.symbol
  };
}

function restrictionToChoice(event: RoadRestrictionViewModel): RoadEventChoice {
  const category = {
    accident: { label: "事故例", symbol: "!" },
    construction: { label: "工事例", symbol: "◆" },
    "lane-restriction": { label: "車線規制例", symbol: "|" },
    closure: { label: "通行止例", symbol: "×" },
    other: { label: "規制例", symbol: "!" }
  }[event.restrictionKind];
  return {
    categoryLabel: category.label,
    id: event.id,
    label: formatAffectedRange(event),
    stateLabel: buildRoadEventState(event),
    symbol: category.symbol
  };
}

function formatAffectedRange(event: RoadConditionViewModel | RoadRestrictionViewModel) {
  return event.affectedRange
    ? `${event.affectedRange.fromLabel} → ${event.affectedRange.toLabel}`
    : "影響区間情報なし";
}

function buildRoadEventState(event: RoadConditionViewModel | RoadRestrictionViewModel) {
  const labels = [event.displayLifecycleLabel];
  if (event.recordType === "restriction" && event.lifecycle !== "current") {
    const lifecycleLabel = event.lifecycle === "planned" ? "予定" : "終了";
    if (!event.displayLifecycleLabel.includes(lifecycleLabel)) labels.push(lifecycleLabel);
  }
  if (event.freshness === "stale") labels.push("期限切れ");
  if (event.freshness === "unavailable") labels.push("状況不明");
  if (event.dataPosture === "fixed-demo") labels.push("固定デモ", "現在情報ではありません");
  return uniqueStrings(labels.filter((label): label is string => Boolean(label))).join(" / ");
}

function isRepresentativeLane(laneId: LiveLogisticsLaneId): laneId is RepresentativeLane {
  return REPRESENTATIVE_LANES.includes(laneId as RepresentativeLane);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
