import type {
  LiveLogisticsEvent,
  LiveLogisticsItemViewModel,
  LiveLogisticsLaneId,
  LiveLogisticsLaneViewModel,
  LiveLogisticsViewModel
} from "../../types/logistics";
import type { ThemeId } from "../../types/semantic";

const LIVE_LOGISTICS_LANES: Array<{
  id: LiveLogisticsLaneId;
  subtitle: string;
  title: string;
}> = [
  {
    id: "road",
    subtitle: "高速道路・港湾後背地・トラック配送を国内物流の主レイヤーとして扱う。",
    title: "陸路・トラック"
  },
  {
    id: "rail",
    subtitle: "主要貨物幹線と代替輸送力を corridor-level で見る。",
    title: "鉄道貨物"
  },
  {
    id: "coastal",
    subtitle: "内航海運と港湾後続を、外航船の捕捉とは分けて見る。",
    title: "内航海運・港湾後続"
  },
  {
    id: "air",
    subtitle: "航空貨物・空港運用・高付加価値品の国内空路を airport-level / route-level で見る。",
    title: "航空貨物・空港運用"
  },
  {
    id: "domestic",
    subtitle: "複数モードにまたがる国内接続をまとめて見る。",
    title: "国内接続（複合）"
  },
  {
    id: "maritime",
    subtitle: "外航船・港湾ETA・公開集約情報を、国内モードへ入る前段の補助線として扱う。",
    title: "外航海上補助"
  }
];

export function buildLiveLogisticsView(
  themeId: ThemeId,
  activeId: string | null | undefined,
  events: LiveLogisticsEvent[] = [],
  now = new Date()
): LiveLogisticsViewModel | null {
  // Public e-Stat spine: energy surface must not open as AIS tanker theater.
  // Maritime demo remains available only as logistics supporting context (and map context layers elsewhere).
  if (themeId === "energy") {
    return null;
  }

  const items = events
    .filter((event) => event.themeIds.includes(themeId))
    .map((event) => toViewItem(event, now))
    .toSorted((left, right) => {
      return getActiveScore(right, activeId) - getActiveScore(left, activeId)
        || getLanePriority(right, themeId) - getLanePriority(left, themeId)
        || right.priority - left.priority
        || left.title.localeCompare(right.title, "ja");
    })
    .slice(0, 8);

  if (items.length === 0) {
    return null;
  }

  return {
    disclosureLabel: getSurfaceDisclosureLabel(themeId),
    items,
    lanes: buildLiveLogisticsLanes(items, themeId),
    mapRoutes: items
      .filter((item) => item.pointIds.length >= 2)
      .map((item) => ({
        id: item.id,
        label: item.kindLabel,
        pointIds: item.pointIds,
        relatedIds: [item.id, ...item.relatedIds]
      })),
    mapVessels: buildLiveMapVessels(items, themeId),
    subtitle: getSurfaceSubtitle(themeId),
    title: getSurfaceTitle(themeId),
    updatedLabel: items[0]?.lastSeenLabel ?? "更新待ち"
  };
}

function toViewItem(event: LiveLogisticsEvent, now: Date): LiveLogisticsItemViewModel {
  const laneId = event.laneId ?? inferLiveLogisticsLane(event);
  const operationClass = event.operationClass ?? inferOperationClass(event, laneId);

  return {
    affectedRegions: event.affectedRegions ?? inferAffectedRegions(event, laneId),
    confidenceLabel: event.confidenceLabel,
    corridorLabel: event.corridorLabel,
    currentPosition: event.currentPosition,
    disclosureLabel: event.disclosureLabel,
    etaLabel: event.etaLabel,
    evidenceClass: event.evidenceClass ?? inferEvidenceClass(event, laneId),
    id: event.id,
    impactScope: event.impactScope ?? inferImpactScope(event, laneId),
    kindLabel: event.kindLabel,
    laneId,
    lastSeenLabel: event.lastSeenLabel ?? formatRelativeTime(event.lastSeenAt, now),
    operationClass,
    pointIds: event.pointIds,
    priority: event.priority ?? getTonePriority(event.signalTone),
    relatedIds: event.relatedIds,
    signalTone: event.signalTone,
    sourceLabel: event.sourceLabel,
    sourceFreshness: event.sourceFreshness ?? inferSourceFreshness(event, laneId),
    statusLabel: event.statusLabel,
    substitutionCapacity: event.substitutionCapacity ?? inferSubstitutionCapacity(event, laneId),
    title: event.title
  };
}

function buildLiveLogisticsLanes(items: LiveLogisticsItemViewModel[], themeId: ThemeId): LiveLogisticsLaneViewModel[] {
  return LIVE_LOGISTICS_LANES.map((lane) => ({
    ...formatLaneForTheme(lane, themeId),
    items: items.filter((item) => item.laneId === lane.id)
  })).filter((lane) => lane.items.length > 0);
}

function buildLiveMapVessels(
  items: LiveLogisticsItemViewModel[],
  themeId: ThemeId
): LiveLogisticsViewModel["mapVessels"] {
  if (themeId === "logistics") {
    return [];
  }

  return items
    .filter((item) => item.currentPosition)
    .map((item) => ({
      id: item.id.replace("live-logistics:", "live-vessel:"),
      label: item.currentPosition?.label ?? item.kindLabel,
      lat: item.currentPosition!.lat,
      lon: item.currentPosition!.lon,
      relatedIds: [item.id, ...item.relatedIds],
      selectionId: item.id,
      etaLabel: item.etaLabel,
      lastSeenLabel: item.lastSeenLabel
    }));
}

function formatLaneForTheme(
  lane: (typeof LIVE_LOGISTICS_LANES)[number],
  themeId: ThemeId
): Omit<LiveLogisticsLaneViewModel, "items"> {
  if (themeId === "logistics" && lane.id === "maritime") {
    return {
      id: lane.id,
      subtitle: "非エネルギー一般貨物の港湾到着前後を、国内モードへ入る前段の補助線として扱う。",
      title: "一般貨物・港湾前後"
    };
  }

  return lane;
}

function inferLiveLogisticsLane(event: LiveLogisticsEvent): LiveLogisticsLaneId {
  const marker = `${event.id} ${event.kindLabel} ${event.title}`.toLowerCase();

  if (marker.includes("rail") || marker.includes("鉄道")) {
    return "rail";
  }

  if (marker.includes("air") || marker.includes("aviation") || marker.includes("空路") || marker.includes("航空")) {
    return "air";
  }

  if (marker.includes("coastal") || marker.includes("内航")) {
    return "coastal";
  }

  if (marker.includes("road") || marker.includes("truck") || marker.includes("陸路") || marker.includes("道路")) {
    return "road";
  }

  return marker.includes("domestic") || marker.includes("国内") ? "domestic" : "maritime";
}

function getActiveScore(item: LiveLogisticsItemViewModel, activeId: string | null | undefined) {
  if (!activeId) {
    return 0;
  }

  return item.id === activeId || item.relatedIds.includes(activeId) || item.pointIds.includes(activeId) ? 1 : 0;
}

function getLanePriority(item: LiveLogisticsItemViewModel, themeId: ThemeId) {
  if (themeId !== "logistics") {
    return 0;
  }

  switch (item.laneId) {
    case "road":
      return 60;
    case "rail":
      return 50;
    case "coastal":
      return 40;
    case "air":
      return 30;
    case "domestic":
      return 20;
    case "maritime":
      return 0;
  }
}

function getSurfaceDisclosureLabel(themeId: ThemeId) {
  if (themeId === "logistics") {
    return "公開系統 / route-level only / 陸路/鉄道/内航/航空貨物/空港運用 / 一般貨物補助 / 15-60分遅延";
  }

  return "AIS coverage / 15-60分遅延 / provider-gated";
}

function getSurfaceSubtitle(themeId: ThemeId) {
  if (themeId === "logistics") {
    return "国内物流の着地点と港湾後続を主表示し、道路・鉄道・内航海運・航空貨物・空港運用を分けて表示する。エネルギー系の海上輸送は Energy 側で扱う";
  }

  return "エネルギー系タンカーの公開集約・遅延AIS文脈を、Energy theme の補助線として監視";
}

function getSurfaceTitle(themeId: ThemeId) {
  if (themeId === "logistics") {
    return "JAPAN DOMESTIC LOGISTICS WATCH";
  }

  return "JAPAN MARITIME AIS SUPPORT WATCH";
}

function getTonePriority(tone: LiveLogisticsItemViewModel["signalTone"]) {
  if (tone === "high") {
    return 100;
  }

  if (tone === "watch") {
    return 80;
  }

  if (tone === "monitoring") {
    return 70;
  }

  return 50;
}

function inferOperationClass(
  event: LiveLogisticsEvent,
  laneId: LiveLogisticsLaneId
): LiveLogisticsItemViewModel["operationClass"] {
  if (event.kindLabel.includes("コンテナ") || event.kindLabel.includes("一般貨物")) {
    return "maritime_general_cargo";
  }

  switch (laneId) {
    case "road":
      return "port_hinterland_highway";
    case "rail":
      return "rail_freight_corridor";
    case "coastal":
      return "coastal_port_follow_through";
    case "air":
      return "air_cargo_airport_ops";
    case "maritime":
      return event.themeIds.includes("energy") ? "energy_maritime_support" : "maritime_general_cargo";
    case "domestic":
      return "port_hinterland_highway";
  }
}

function inferAffectedRegions(event: LiveLogisticsEvent, laneId: LiveLogisticsLaneId): string[] {
  const marker = `${event.corridorLabel} ${event.title}`;
  const regions = [
    marker.includes("東京") || marker.includes("首都圏") ? "首都圏" : null,
    marker.includes("愛知") || marker.includes("名古屋") || marker.includes("中京") ? "中京圏" : null,
    marker.includes("大阪") || marker.includes("阪神") || marker.includes("関西") ? "関西圏" : null,
    marker.includes("福岡") ? "九州北部" : null
  ].filter((region): region is string => Boolean(region));

  if (regions.length > 0) {
    return regions;
  }

  return laneId === "air" ? ["首都圏"] : ["国内主要圏"];
}

function inferImpactScope(event: LiveLogisticsEvent, laneId: LiveLogisticsLaneId): string {
  if (laneId === "road") {
    return "首都圏の小売・部品・港湾後背地配送";
  }

  if (laneId === "rail") {
    return "中京・関西向け幹線貨物と翌日配送";
  }

  if (laneId === "coastal") {
    return "関西圏向けの港湾後続と長距離代替輸送";
  }

  if (laneId === "air") {
    return event.kindLabel === "空港運用" ? "高付加価値品・医薬品・航空貨物の首都圏接続" : "高付加価値品の国内即日/翌日配送";
  }

  if (event.kindLabel.includes("コンテナ") || event.kindLabel.includes("一般貨物")) {
    return "非エネルギー一般貨物の港湾到着前後と国内引き込み";
  }

  return "国内物流ネットワークへの波及";
}

function inferSubstitutionCapacity(event: LiveLogisticsEvent, laneId: LiveLogisticsLaneId): string {
  if (laneId === "road") {
    return "鉄道貨物・内航へ一部迂回可 / 即時代替は限定";
  }

  if (laneId === "rail") {
    return "トラックへ一部代替可 / 長距離幹線は容量制約あり";
  }

  if (laneId === "coastal") {
    return "陸路へ一部代替可 / 港湾処理と長距離輸送費に制約";
  }

  if (laneId === "air") {
    return "陸路・海上へ代替可 / リードタイムは延びる";
  }

  return event.themeIds.includes("energy") ? "Energy側で評価" : "港湾後続・陸路へ接続して評価";
}

function inferSourceFreshness(event: LiveLogisticsEvent, laneId: LiveLogisticsLaneId): string {
  if (event.lastSeenLabel?.includes("分") || event.etaLabel.includes("15分")) {
    return "15分級";
  }

  if (laneId === "rail" || laneId === "air") {
    return "30-60分級";
  }

  return "60分級";
}

function inferEvidenceClass(
  event: LiveLogisticsEvent,
  laneId: LiveLogisticsLaneId
): LiveLogisticsItemViewModel["evidenceClass"] {
  if (event.sourceLabel.includes("MLIT") || event.sourceLabel.includes("JMA")) {
    return "official_public";
  }

  if (event.themeIds.includes("energy")) {
    return "public_aggregate_demo";
  }

  return laneId === "road" ? "official_public_plus_demo" : "public_aggregate_demo";
}

function formatRelativeTime(isoTimestamp: string | undefined, now: Date) {
  if (!isoTimestamp) {
    return "更新待ち";
  }

  const timestamp = new Date(isoTimestamp);
  const diffMinutes = Math.max(0, Math.round((now.getTime() - timestamp.getTime()) / 60000));

  if (diffMinutes < 90) {
    return `${diffMinutes}分前`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) {
    return `${diffHours}時間前`;
  }

  return `${Math.round(diffHours / 24)}日前`;
}
