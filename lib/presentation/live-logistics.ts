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
    id: "maritime",
    subtitle: "AIS・港湾・受入基地を海側の監視として分離。",
    title: "海上 / タンカー"
  },
  {
    id: "domestic",
    subtitle: "港から首都圏の燃料・物流接続を分離。",
    title: "国内物流"
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
        || right.priority - left.priority
        || left.title.localeCompare(right.title, "ja");
    })
    .slice(0, 4);

  if (items.length === 0) {
    return null;
  }

  return {
    disclosureLabel: "遅延・集約 / 船名非表示 / route-level only",
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
    subtitle: "海上監視と国内接続を分けた遅延・集約シグナル",
    title: "LIVE LOGISTICS",
    updatedLabel: items[0]?.lastSeenLabel ?? "更新待ち"
  };
}

function toViewItem(event: LiveLogisticsEvent, now: Date): LiveLogisticsItemViewModel {
  return {
    confidenceLabel: event.confidenceLabel,
    corridorLabel: event.corridorLabel,
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
  return marker.includes("domestic") ? "domestic" : "maritime";
}

function getActiveScore(item: LiveLogisticsItemViewModel, activeId: string | null | undefined) {
  if (!activeId) {
    return 0;
  }

  return item.id === activeId || item.relatedIds.includes(activeId) || item.pointIds.includes(activeId) ? 1 : 0;
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
