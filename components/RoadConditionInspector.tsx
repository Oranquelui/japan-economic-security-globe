"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import type {
  RoadConditionFreshness,
  RoadConditionViewModel,
  RoadOperationsViewModel,
  RoadQuantitativeField,
  RoadRestrictionViewModel,
  RoadRoute,
  RoadSegmentViewModel
} from "../types/road-operations";
import type { SemanticGraph, SourceDocument } from "../types/semantic";

interface RoadConditionInspectorProps {
  graph: SemanticGraph;
  idPrefix?: string;
  onClose: () => void;
  roadOperations: RoadOperationsViewModel;
  selectedId: string;
  themePalette: ThemePalette;
}

type RoadEvent = RoadConditionViewModel | RoadRestrictionViewModel;

export function RoadConditionInspector({
  graph,
  idPrefix = "road-condition",
  onClose,
  roadOperations,
  selectedId,
  themePalette
}: RoadConditionInspectorProps) {
  const resolved = resolveRoadSelection(roadOperations, selectedId);
  if (!resolved) return null;

  const { event, route, segments } = resolved;
  const eventSegment = event
    ? segments.find((segment) => segment.id === event.segmentId) ?? null
    : null;
  const title = event ? `${eventCategoryLabel(event)} — ${eventSegment?.label ?? route.label}` : route.label;
  const sourceIds = new Set([
    ...route.topologySourceIds,
    route.geometrySourceId,
    ...segments.flatMap((segment) => segment.sourceIds),
    ...(event?.sourceIds ?? []),
    ...roadOperations.provider.sourceIds
  ]);
  const sources = graph.sources.filter((source) => sourceIds.has(source.id));
  const headingId = `${idPrefix}-heading`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <section
      aria-describedby={descriptionId}
      aria-labelledby={headingId}
      data-testid="road-condition-inspector"
      className="flex h-full min-h-0 flex-col overflow-hidden border-l"
      style={{ borderColor: themePalette.borderStrong, background: themePalette.surfacePanel }}
    >
      <header className="flex items-start justify-between gap-3 border-b px-4 py-4" style={{ borderColor: themePalette.borderSubtle }}>
        <div className="min-w-0">
          <div className="font-mono text-[0.58rem] tracking-[0.22em]" style={{ color: themePalette.accentText }}>
            ROAD CONDITION DETAIL
          </div>
          <h2 id={headingId} tabIndex={-1} className="mt-1 text-base font-semibold leading-6 text-white [overflow-wrap:anywhere]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="道路状況の詳細を閉じる"
          onClick={onClose}
          className="shrink-0 rounded border px-2 py-1 text-xs"
          style={{ borderColor: themePalette.borderStrong, color: themePalette.textPrimary }}
        >
          閉じる
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-xs leading-5">
        <p id={descriptionId} className="rounded border px-3 py-2" style={{ borderColor: themePalette.borderStrong, color: themePalette.textPrimary }}>
          固定デモ / 現在情報ではありません。公式道路交通フィード未接続のため、現在の渋滞・規制判断には使用できません。
        </p>

        <InspectorGroup title="経路・区間" themePalette={themePalette}>
          <InspectorRow label="代表経路" value={route.label} />
          <InspectorRow label="道路" value={formatRoadNames(segments)} />
          <InspectorRow label="方向" value={event?.direction ?? route.direction} />
          <InspectorRow
            label="経路関係"
            value={eventSegment
              ? `${route.label} / ${eventSegment.label}`
              : `${route.label} / ${segments.map((segment) => segment.label).join(" / ")}`}
          />
          {event ? (
            <InspectorRow
              label="影響範囲"
              value={event.affectedRange
                ? `${event.affectedRange.fromLabel} → ${event.affectedRange.toLabel}`
                : eventSegment?.label ?? "データなし"}
            />
          ) : null}
        </InspectorGroup>

        {event ? (
          <InspectorGroup title="道路状態" themePalette={themePalette}>
            <InspectorRow label="区分" value={eventCategoryLabel(event)} />
            <InspectorRow label="状態" value={eventStateLabel(event)} />
            <InspectorRow label="鮮度" value={freshnessLabel(event.freshness)} />
            <InspectorRow label="開始" value={event.startsAt ?? "データなし"} />
            <InspectorRow label="終了" value={event.endsAt ?? "データなし"} />
            <InspectorRow label="提供元観測時刻" value={event.providerObservedAt} />
            <InspectorRow label="取得時刻" value={event.retrievedAt} />
            <QuantitativeRows event={event} />
          </InspectorGroup>
        ) : null}

        <InspectorGroup title="提供状態" themePalette={themePalette}>
          <InspectorRow
            label="提供元"
            value={`${roadOperations.provider.dataPosture === "authorized-provider" ? "JARTIC" : roadOperations.provider.label} / ${roadOperations.provider.state === "available" ? "利用可能" : "利用不可"}`}
          />
          <InspectorRow label="最終成功取得" value={roadOperations.provider.lastSuccessfulRetrievalAt ?? "データなし"} />
          <InspectorRow label="到着見込み" value="データなし" />
          <InspectorRow label="物流影響" value="データなし" />
        </InspectorGroup>

        <InspectorGroup title="出典・利用条件" themePalette={themePalette}>
          <ul className="space-y-2">
            {sources.map((source) => <SourceLink key={source.id} source={source} themePalette={themePalette} />)}
          </ul>
          <p className="mt-3" style={{ color: themePalette.textMuted }}>
            {route.attribution} / 道路形状は表示用の一般化形状です。法的な道路境界、ナビゲーション精度、ライブ交通を保証しません。
          </p>
          {event ? (
            <p className="mt-2" style={{ color: themePalette.textMuted }}>{event.disclosureLabel}</p>
          ) : null}
        </InspectorGroup>
      </div>
    </section>
  );
}

export function isRoadOperationsSelection(roadOperations: RoadOperationsViewModel | null, selectedId: string | null) {
  return Boolean(roadOperations && selectedId && resolveRoadSelection(roadOperations, selectedId));
}

function resolveRoadSelection(roadOperations: RoadOperationsViewModel, selectedId: string) {
  const route = roadOperations.routes.find((candidate) => candidate.id === selectedId);
  if (route) {
    return {
      event: null,
      route,
      segments: getRouteSegments(roadOperations, route)
    };
  }
  const event = [...roadOperations.conditions, ...roadOperations.restrictions]
    .find((candidate) => candidate.id === selectedId);
  if (!event) return null;
  const segment = roadOperations.segments.find((candidate) => candidate.id === event.segmentId);
  if (!segment) return null;
  const eventRoute = roadOperations.routes.find((candidate) => candidate.id === segment.routeId);
  if (!eventRoute) return null;
  return {
    event,
    route: eventRoute,
    segments: getRouteSegments(roadOperations, eventRoute)
  };
}

function getRouteSegments(roadOperations: RoadOperationsViewModel, route: RoadRoute) {
  const segmentById = new Map(roadOperations.segments.map((segment) => [segment.id, segment]));
  return route.segmentIds.flatMap((segmentId) => {
    const segment = segmentById.get(segmentId);
    return segment ? [segment] : [];
  });
}

function eventCategoryLabel(event: RoadEvent) {
  if (event.recordType === "condition") {
    return { normal: "平常例", slow: "低速例", congestion: "渋滞例" }[event.condition];
  }
  return {
    accident: "事故例",
    construction: "工事例",
    "lane-restriction": "車線規制例",
    closure: "通行止例",
    other: "規制例"
  }[event.restrictionKind];
}

function eventStateLabel(event: RoadEvent) {
  const lifecycle = event.recordType === "restriction"
    ? event.lifecycle === "planned" ? "予定" : event.lifecycle === "ended" ? "終了" : "発生中"
    : event.displayLifecycleLabel ?? "発生中";
  return `${lifecycle} / ${freshnessLabel(event.freshness)}`;
}

function freshnessLabel(freshness: RoadConditionFreshness) {
  return {
    current: "現在",
    delayed: "遅延",
    stale: "期限切れ",
    unavailable: "利用不可",
    unknown: "状況不明"
  }[freshness];
}

function formatRoadNames(segments: RoadSegmentViewModel[]) {
  return [...new Set(segments.map((segment) => `${segment.roadName} ${segment.routeNumber}`))].join(" / ");
}

function QuantitativeRows({ event }: { event: RoadEvent }) {
  if (event.recordType !== "condition") return null;
  return (
    <>
      <QuantitativeRow label="渋滞長" field={event.congestionLength} />
      <QuantitativeRow label="速度" field={event.speed} />
      <QuantitativeRow label="遅延" field={event.delay} />
      <QuantitativeRow label="所要時間" field={event.travelTime} />
    </>
  );
}

function QuantitativeRow({ field, label }: { field?: RoadQuantitativeField; label: string }) {
  if (!field || !Number.isFinite(field.value) || !field.unit.trim()) return null;
  return <InspectorRow label={label} value={`${field.value} ${field.unit}`} />;
}

function InspectorGroup({ children, themePalette, title }: { children: React.ReactNode; themePalette: ThemePalette; title: string }) {
  return (
    <section className="border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
      <h3 className="mb-2 font-mono text-[0.62rem] tracking-[0.15em]" style={{ color: themePalette.accentText }}>{title}</h3>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem,minmax(0,1fr)] gap-2">
      <dt className="text-slate-400">{label}: </dt>
      <dd className="text-slate-100 [overflow-wrap:anywhere]"> {value}</dd>
    </div>
  );
}

function SourceLink({ source, themePalette }: { source: SourceDocument; themePalette: ThemePalette }) {
  return (
    <li>
      <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2" style={{ color: themePalette.accentText }}>
        {source.label}
      </a>
      {source.description ? <p className="mt-0.5" style={{ color: themePalette.textMuted }}>{source.description}</p> : null}
    </li>
  );
}
