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
  kindLabel: "外航海上補助",
  laneId: "maritime",
  lastSeenLabel: "18分前",
  pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
  priority: 98,
  relatedIds: ["flow:japan-linked-maritime-watch"],
  signalTone: "watch",
  sourceLabel: "AIS demo fixture (supporting context)",
  statusLabel: "Underway",
  title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay"
};

describe("live logistics detail", () => {
  test("builds a map popup detail for maritime AIS supporting context", () => {
    const graph = loadSeedGraph();
    const detail = buildLiveLogisticsDetail(graph, item);

    expect(detail.id).toBe("live-logistics:tanker-qatar-tokyo-bay");
    expect(detail.label).toBe("Tanker corridor: Hormuz → Malacca → Tokyo Bay");
    expect(detail.kind).toBe("外航海上補助");
    expect(detail.summary).toContain("Hormuz → Malacca");
    expect(detail.whyItMatters).toContain("外航AISは国内物流面への補助線");
    expect(detail.signal.category).toBe("外航AIS補助");
    expect(detail.linkedFlows.map((flow) => flow.id)).toContain("flow:japan-linked-maritime-watch");
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining(["chokepoint:hormuz", "chokepoint:malacca", "port:yokohama"])
    );
    expect(detail.sources.length).toBeGreaterThan(0);
  });

  test("marks domestic demo fallback sources as non-official", () => {
    const graph = loadSeedGraph();
    const detail = buildLiveLogisticsDetail(graph, {
      ...item,
      confidenceLabel: "デモ / 公開粒度",
      disclosureLabel: "公開系統 / route-level only",
      id: "live-logistics:road-keihin-tokyo",
      kindLabel: "道路物流",
      laneId: "road",
      pointIds: ["port:yokohama", "refinery:keihin", "terminal:sodegaura-lng", "prefecture:tokyo"],
      sourceLabel: "Domestic logistics demo fixture (public route-level)",
      title: "陸路: 横浜港・京浜/袖ケ浦 → 首都圏配送"
    });

    expect(detail.sources).toEqual([
      expect.objectContaining({
        accessMode: "html",
        label: "Domestic logistics demo fixture (public route-level)",
        official: false
      })
    ]);
    expect(detail.sources[0].description).toContain("not an official live-provider feed");
  });
});
