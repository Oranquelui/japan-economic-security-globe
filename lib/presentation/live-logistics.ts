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
    lanes: buildLiveLogisticsLanes(items),
    mapRoutes: items
      .filter((item) => item.pointIds.length >= 2)
      .map((item) => ({
        id: item.id,
        label: item.kindLabel,
        pointIds: item.pointIds,
        relatedIds: [item.id, ...item.relatedIds]
      })),
    mapVessels: items
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
      })),
    subtitle: getSurfaceSubtitle(themeId),
    title: getSurfaceTitle(themeId),
    updatedLabel: items[0]?.lastSeenLabel ?? "更新待ち"
  };
}

function toViewItem(event: LiveLogisticsEvent, now: Date): LiveLogisticsItemViewModel {
  return {
    confidenceLabel: event.confidenceLabel,
    corridorLabel: event.corridorLabel,
    currentPosition: event.currentPosition,
    disclosureLabel: event.disclosureLabel,
    etaLabel: event.etaLabel,
    id: event.id,
    kindLabel: event.kindLabel,
    laneId: event.laneId ?? inferLiveLogisticsLane(event),
    lastSeenLabel: event.lastSeenLabel ?? formatRelativeTime(event.lastSeenAt, now),
    pointIds: event.pointIds,
    priority: event.priority ?? getTonePriority(event.signalTone),
    relatedIds: event.relatedIds,
    signalTone: event.signalTone,
    sourceLabel: event.sourceLabel,
    statusLabel: event.statusLabel,
    title: event.title
  };
}

function buildLiveLogisticsLanes(items: LiveLogisticsItemViewModel[]): LiveLogisticsLaneViewModel[] {
  return LIVE_LOGISTICS_LANES.map((lane) => ({
    ...lane,
    items: items.filter((item) => item.laneId === lane.id)
  })).filter((lane) => lane.items.length > 0);
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
    return "国内物流の着地点と港湾後続を主表示し、道路・鉄道・内航海運・航空貨物・空港運用を分けて表示する。エネルギー系タンカーは Energy 側で扱う";
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
