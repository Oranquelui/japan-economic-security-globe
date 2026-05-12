import type { ThemeId } from "./semantic";

export type LiveLogisticsSignalTone = "high" | "watch" | "monitoring" | "normal";
export type LiveLogisticsLaneId = "maritime" | "domestic";

export interface LiveLogisticsEvent {
  confidenceLabel: string;
  corridorLabel: string;
  disclosureLabel: string;
  etaLabel: string;
  id: string;
  kindLabel: string;
  laneId?: LiveLogisticsLaneId;
  lastSeenAt?: string;
  lastSeenLabel?: string;
  pointIds: string[];
  priority?: number;
  relatedIds: string[];
  signalTone: LiveLogisticsSignalTone;
  sourceLabel: string;
  statusLabel: string;
  themeIds: ThemeId[];
  title: string;
}

export interface LiveLogisticsItemViewModel {
  confidenceLabel: string;
  corridorLabel: string;
  disclosureLabel: string;
  etaLabel: string;
  id: string;
  kindLabel: string;
  laneId: LiveLogisticsLaneId;
  lastSeenLabel: string;
  pointIds: string[];
  priority: number;
  relatedIds: string[];
  signalTone: LiveLogisticsSignalTone;
  sourceLabel: string;
  statusLabel: string;
  title: string;
}

export interface LiveLogisticsLaneViewModel {
  id: LiveLogisticsLaneId;
  items: LiveLogisticsItemViewModel[];
  subtitle: string;
  title: string;
}

export interface LiveLogisticsMapRoute {
  id: string;
  label: string;
  pointIds: string[];
  relatedIds: string[];
}

export interface LiveLogisticsViewModel {
  disclosureLabel: string;
  items: LiveLogisticsItemViewModel[];
  lanes: LiveLogisticsLaneViewModel[];
  mapRoutes: LiveLogisticsMapRoute[];
  subtitle: string;
  title: string;
  updatedLabel: string;
}
