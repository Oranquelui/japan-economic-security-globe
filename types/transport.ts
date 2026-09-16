export const TRANSPORT_CATEGORIES = ["expressway", "shinkansen", "railway", "air", "sea"] as const;
export type TransportCategory = typeof TRANSPORT_CATEGORIES[number];
export type TransportPurpose = "passenger" | "freight";
export type TransportBounds = [number, number, number, number];

/** Physical infrastructure and scheduled connections never imply current operating status. */
export interface TransportRoute {
  id: string;
  label: string;
  operator: string;
  originalLabel?: string;
  category: TransportCategory;
  mode: "road" | "rail" | "air" | "sea";
  service: string;
  scope: "domestic" | "international";
  purposes: TransportPurpose[];
  information: "infrastructure" | "scheduled-connection";
  geometryKind: "surveyed" | "connection";
  sourceIds: string[];
  period: string;
  bounds: TransportBounds;
  segmentCount: number;
  endpoints?: { label: string; coordinates: [number, number] }[];
}
export interface TransportSource {
  id: string;
  label: string;
  url: string;
  role: "geometry" | "service" | "name";
  period: string;
  license: string;
  coverage: string;
}
export function isTransportCategory(value: unknown): value is TransportCategory {
  return TRANSPORT_CATEGORIES.includes(value as TransportCategory);
}
