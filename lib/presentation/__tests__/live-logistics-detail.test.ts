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
  relatedIds: ["flow:qatar-lng-japan"],
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
    expect(detail.whyItMatters).toContain("外航AISは Energy theme の補助線");
    expect(detail.signal.category).toBe("外航AIS補助");
    expect(detail.linkedFlows.map((flow) => flow.id)).toContain("flow:qatar-lng-japan");
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining(["chokepoint:hormuz", "chokepoint:malacca", "port:yokohama"])
    );
    expect(detail.sources.length).toBeGreaterThan(0);
  });

  test("frames non-energy maritime cargo as port follow-through rather than AIS tracking", () => {
    const graph = loadSeedGraph();
    const detail = buildLiveLogisticsDetail(graph, {
      ...item,
      confidenceLabel: "デモ / 公開粒度",
      corridorLabel: "東アジア航路 → 横浜港 → 首都圏",
      disclosureLabel: "公開集約 / cargo-category only / delayed",
      etaLabel: "港湾後続 +12h",
      id: "live-logistics:container-asia-yokohama",
      kindLabel: "コンテナ一般貨物",
      pointIds: ["chokepoint:malacca", "port:yokohama", "prefecture:tokyo"],
      relatedIds: ["flow:japan-linked-maritime-watch", "port:yokohama", "prefecture:tokyo"],
      sourceLabel: "Public port/logistics aggregate demo fixture (non-energy cargo)",
      statusLabel: "港湾到着前後の公開集約",
      title: "コンテナ一般貨物: 東アジア → 横浜港 → 首都圏配送"
    });

    expect(detail.signal.category).toBe("一般貨物・港湾後続");
    expect(detail.summary).toContain("公開集約シグナル");
    expect(detail.summary).not.toContain("ライブ監視");
    expect(detail.whyItMatters).toContain("非エネルギー一般貨物");
    expect(detail.signal.recommendedAction).toContain("港湾到着前後の公開集約");
    expect(detail.whyItMatters).not.toMatch(/AIS|タンカー|LNG|ホルムズ/);
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
      pointIds: ["port:yokohama", "prefecture:tokyo"],
      sourceLabel: "Domestic logistics demo fixture (public route-level)",
      title: "陸路: 横浜港 → 首都圏配送"
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

  test("frames airport operations as public aggregate logistics rather than flight tracking", () => {
    const graph = loadSeedGraph();
    const detail = buildLiveLogisticsDetail(graph, {
      ...item,
      confidenceLabel: "公的公開情報 / 集約粒度",
      corridorLabel: "羽田/成田 → 首都圏航空貨物",
      disclosureLabel: "公開集約 / airport-level only / delayed",
      etaLabel: "次回更新 60分",
      id: "live-logistics:airport-haneda-narita-ops",
      kindLabel: "空港運用",
      laneId: "air",
      lastSeenLabel: "55分前",
      pointIds: ["airport:haneda", "airport:narita", "prefecture:tokyo"],
      relatedIds: ["airport:haneda", "airport:narita"],
      sourceLabel: "MLIT/CAB public airport information + JMA public weather context",
      statusLabel: "公開集約監視",
      title: "空港運用: 羽田・成田 貨物/滑走路集約"
    });

    expect(detail.signal.category).toBe("空港運用・航空貨物");
    expect(detail.summary).toContain("airport-level公開集約シグナル");
    expect(detail.summary).not.toContain("ライブ監視");
    expect(detail.whyItMatters).toContain("個別便ではなく airport-level の公開集約");
    expect(detail.signal.recommendedAction).toContain("個別旅客・個別便・軍用機は対象外");
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining(["airport:haneda", "airport:narita", "prefecture:tokyo"])
    );
  });
});
