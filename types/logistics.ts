import type { ThemeId } from "./semantic";

export type LiveLogisticsSignalTone = "high" | "watch" | "monitoring" | "normal";
export type LiveLogisticsLaneId = "road" | "rail" | "coastal" | "air" | "maritime" | "domestic";

export interface LiveLogisticsEvent {
  confidenceLabel: string;
  corridorLabel: string;
  currentPosition?: {
    label?: string;
    lat: number;
    lon: number;
  };
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
  currentPosition?: {
    label?: string;
    lat: number;
    lon: number;
  };
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

export interface LiveLogisticsMapVessel {
  etaLabel: string;
  id: string;
  label: string;
  lastSeenLabel: string;
  lat: number;
  lon: number;
  relatedIds: string[];
  selectionId: string;
}

export interface LiveLogisticsViewModel {
  disclosureLabel: string;
  items: LiveLogisticsItemViewModel[];
  lanes: LiveLogisticsLaneViewModel[];
  mapRoutes: LiveLogisticsMapRoute[];
  mapVessels: LiveLogisticsMapVessel[];
  subtitle: string;
  title: string;
  updatedLabel: string;
}
