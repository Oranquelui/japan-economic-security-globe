import type { ThemeId } from "./semantic";

export type LiveLogisticsSignalTone = "high" | "watch" | "monitoring" | "normal";
export type LiveLogisticsLaneId = "road" | "rail" | "coastal" | "air" | "maritime" | "domestic";
export type LiveLogisticsOperationClass =
  | "port_hinterland_highway"
  | "rail_freight_corridor"
  | "coastal_port_follow_through"
  | "air_cargo_airport_ops"
  | "maritime_general_cargo"
  | "energy_maritime_support";
export type LiveLogisticsEvidenceClass =
  | "official_public"
  | "official_public_plus_demo"
  | "public_aggregate_demo"
  | "provider_gated_aggregate";

export interface LiveLogisticsEvent {
  confidenceLabel: string;
  corridorLabel: string;
  affectedRegions?: string[];
  currentPosition?: {
    label?: string;
    lat: number;
    lon: number;
  };
  disclosureLabel: string;
  etaLabel: string;
  evidenceClass?: LiveLogisticsEvidenceClass;
  id: string;
  impactScope?: string;
  kindLabel: string;
  laneId?: LiveLogisticsLaneId;
  lastSeenAt?: string;
  lastSeenLabel?: string;
  operationClass?: LiveLogisticsOperationClass;
  pointIds: string[];
  priority?: number;
  relatedIds: string[];
  signalTone: LiveLogisticsSignalTone;
  sourceLabel: string;
  sourceFreshness?: string;
  statusLabel: string;
  substitutionCapacity?: string;
  themeIds: ThemeId[];
  title: string;
}

export interface LiveLogisticsItemViewModel {
  confidenceLabel: string;
  corridorLabel: string;
  affectedRegions?: string[];
  currentPosition?: {
    label?: string;
    lat: number;
    lon: number;
  };
  disclosureLabel: string;
  etaLabel: string;
  evidenceClass?: LiveLogisticsEvidenceClass;
  id: string;
  impactScope?: string;
  kindLabel: string;
  laneId: LiveLogisticsLaneId;
  lastSeenLabel: string;
  operationClass?: LiveLogisticsOperationClass;
  pointIds: string[];
  priority: number;
  relatedIds: string[];
  signalTone: LiveLogisticsSignalTone;
  sourceLabel: string;
  sourceFreshness?: string;
  statusLabel: string;
  substitutionCapacity?: string;
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
