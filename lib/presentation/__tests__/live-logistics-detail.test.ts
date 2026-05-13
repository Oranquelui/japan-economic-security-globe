import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import type { LiveLogisticsItemViewModel } from "../../../types/logistics";
import { buildLiveLogisticsDetail } from "../live-logistics-detail";

const item: LiveLogisticsItemViewModel = {
  confidenceLabel: "集約信号",
  corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
  disclosureLabel: "15-60分遅延 / aggregated vessel signal",
  etaLabel: "ETA 42h",
  id: "live-logistics:tanker-qatar-tokyo-bay",
  kindLabel: "AIS tanker",
  laneId: "maritime",
  lastSeenLabel: "18分前",
  pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
  priority: 98,
  relatedIds: ["flow:japan-linked-maritime-watch"],
  signalTone: "watch",
  sourceLabel: "AIS provider fixture",
  statusLabel: "Underway",
  title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay"
};

describe("live logistics detail", () => {
  test("builds a map popup detail for an individual Japan-bound tanker item", () => {
    const graph = loadSeedGraph();
    const detail = buildLiveLogisticsDetail(graph, item);

    expect(detail.id).toBe("live-logistics:tanker-qatar-tokyo-bay");
    expect(detail.label).toBe("Tanker corridor: Hormuz → Malacca → Tokyo Bay");
    expect(detail.kind).toBe("AIS tanker");
    expect(detail.summary).toContain("Hormuz → Malacca");
    expect(detail.whyItMatters).toContain("日本向けタンカー");
    expect(detail.linkedFlows.map((flow) => flow.id)).toContain("flow:japan-linked-maritime-watch");
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining(["chokepoint:hormuz", "chokepoint:malacca", "port:yokohama"])
    );
    expect(detail.sources.length).toBeGreaterThan(0);
  });
});
