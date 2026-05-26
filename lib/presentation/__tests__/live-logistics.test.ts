import { describe, expect, test } from "vitest";

import type { LiveLogisticsEvent } from "../../../types/logistics";
import { buildLiveLogisticsView } from "../live-logistics";

const events: LiveLogisticsEvent[] = [
  {
    id: "live-logistics:tanker-qatar-tokyo-bay",
    themeIds: ["energy"],
    title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
    currentPosition: {
      lat: 12.4,
      lon: 110.8,
      label: "AIS tanker 042"
    },
    kindLabel: "外航海上補助",
    statusLabel: "Underway",
    lastSeenLabel: "18分前",
    etaLabel: "ETA 42h",
    sourceLabel: "AIS demo fixture (supporting context)",
    disclosureLabel: "15-60分遅延 / aggregated vessel signal",
    confidenceLabel: "集約信号",
    corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
    pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "maritime",
    signalTone: "watch",
    priority: 98
  },
  {
    id: "live-logistics:road-keihin-tokyo",
    themeIds: ["logistics"],
    title: "陸路: 横浜港 → 首都圏配送",
    kindLabel: "道路物流",
    statusLabel: "接続監視",
    lastSeenLabel: "22分前",
    etaLabel: "次回更新 15分",
    sourceLabel: "Domestic logistics demo fixture (public route-level)",
    disclosureLabel: "公開系統 / route-level only",
    confidenceLabel: "デモ / 公開粒度",
    corridorLabel: "横浜港 → 東京",
    pointIds: ["port:yokohama", "prefecture:tokyo"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "road",
    signalTone: "monitoring",
    priority: 94
  },
  {
    id: "live-logistics:rail-tokyo-osaka",
    themeIds: ["logistics"],
    title: "鉄道: 東京貨物圏 → 名古屋 → 大阪",
    kindLabel: "鉄道物流",
    statusLabel: "幹線監視",
    lastSeenLabel: "35分前",
    etaLabel: "次回更新 30分",
    sourceLabel: "Domestic logistics demo fixture (corridor-level)",
    disclosureLabel: "公開系統 / corridor-level only",
    confidenceLabel: "デモ / 公開粒度",
    corridorLabel: "東京 → 愛知 → 大阪",
    pointIds: ["prefecture:tokyo", "prefecture:aichi", "prefecture:osaka"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "rail",
    signalTone: "normal",
    priority: 84
  },
  {
    id: "live-logistics:coastal-tokyo-osaka",
    themeIds: ["logistics"],
    title: "内航海運: 東京湾 → 阪神圏",
    kindLabel: "内航海運",
    statusLabel: "港湾後続",
    lastSeenLabel: "41分前",
    etaLabel: "港湾後続 +8h",
    sourceLabel: "Domestic logistics demo fixture (port follow-through)",
    disclosureLabel: "公開系統 / route-level only",
    confidenceLabel: "デモ / 公開粒度",
    corridorLabel: "横浜港 → 大阪圏",
    pointIds: ["port:yokohama", "prefecture:osaka"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "coastal",
    signalTone: "normal",
    priority: 83
  },
  {
    id: "live-logistics:air-tokyo-fukuoka",
    themeIds: ["logistics"],
    title: "空路: 首都圏 → 福岡圏",
    kindLabel: "航空物流",
    statusLabel: "便枠監視",
    lastSeenLabel: "47分前",
    etaLabel: "次回更新 60分",
    sourceLabel: "Domestic logistics demo fixture (route-level)",
    disclosureLabel: "公開系統 / route-level only",
    confidenceLabel: "デモ / 公開粒度",
    corridorLabel: "東京 → 福岡",
    pointIds: ["prefecture:tokyo", "prefecture:fukuoka"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "air",
    signalTone: "normal",
    priority: 82
  },
  {
    id: "live-logistics:airport-haneda-narita-ops",
    themeIds: ["logistics"],
    title: "空港運用: 羽田・成田 貨物/滑走路集約",
    kindLabel: "空港運用",
    statusLabel: "公開集約監視",
    lastSeenLabel: "55分前",
    etaLabel: "次回更新 60分",
    sourceLabel: "MLIT/CAB public airport information + JMA public weather context",
    disclosureLabel: "公開集約 / airport-level only / delayed",
    confidenceLabel: "公的公開情報 / 集約粒度",
    corridorLabel: "羽田/成田 → 首都圏航空貨物",
    pointIds: ["airport:haneda", "airport:narita", "prefecture:tokyo"],
    relatedIds: ["flow:japan-linked-maritime-watch", "airport:haneda", "airport:narita"],
    laneId: "air",
    signalTone: "monitoring",
    priority: 88
  },
  {
    id: "live-logistics:container-asia-yokohama",
    themeIds: ["logistics"],
    title: "コンテナ一般貨物: 東アジア → 横浜港 → 首都圏配送",
    kindLabel: "コンテナ一般貨物",
    statusLabel: "港湾到着前後の公開集約",
    lastSeenLabel: "64分前",
    etaLabel: "港湾後続 +12h",
    sourceLabel: "Public port/logistics aggregate demo fixture (non-energy cargo)",
    disclosureLabel: "公開集約 / cargo-category only / delayed",
    confidenceLabel: "デモ / 公開粒度",
    corridorLabel: "東アジア航路 → 横浜港 → 首都圏",
    pointIds: ["chokepoint:malacca", "port:yokohama", "prefecture:tokyo"],
    relatedIds: ["flow:japan-linked-maritime-watch", "port:yokohama", "prefecture:tokyo"],
    laneId: "maritime",
    signalTone: "normal",
    priority: 86
  }
];

describe("live logistics view", () => {
  test("builds a delayed multimodal domestic-first logistics surface for matching themes", () => {
    const view = buildLiveLogisticsView("logistics", "flow:japan-linked-maritime-watch", events, new Date("2026-05-11T00:30:00.000Z"));

    expect(view?.title).toBe("JAPAN DOMESTIC LOGISTICS WATCH");
    expect(view?.subtitle).toContain("道路・鉄道・内航海運・航空貨物・空港運用");
    expect(view?.subtitle).toContain("エネルギー系タンカーは Energy 側で扱う");
    expect(view?.disclosureLabel).toContain("陸路/鉄道/内航/航空貨物/空港運用");
    expect(view?.disclosureLabel).toContain("一般貨物補助");
    expect(view?.items.map((item) => item.kindLabel)).toEqual(["道路物流", "鉄道物流", "内航海運", "空港運用", "航空物流", "コンテナ一般貨物"]);
    expect(view?.lanes.map((lane) => lane.title)).toEqual([
      "陸路・トラック",
      "鉄道貨物",
      "内航海運・港湾後続",
      "航空貨物・空港運用",
      "外航海上補助"
    ]);
    expect(view?.lanes[0].items.map((item) => item.kindLabel)).toEqual(["道路物流"]);
    expect(view?.lanes[1].items.map((item) => item.kindLabel)).toEqual(["鉄道物流"]);
    expect(view?.lanes[2].items.map((item) => item.kindLabel)).toEqual(["内航海運"]);
    expect(view?.lanes[3].subtitle).toContain("空港運用");
    expect(view?.lanes[3].items.map((item) => item.kindLabel)).toEqual(["空港運用", "航空物流"]);
    expect(view?.lanes[4].items.map((item) => item.kindLabel)).toEqual(["コンテナ一般貨物"]);
    expect(view?.items[0].sourceLabel).toBe("Domestic logistics demo fixture (public route-level)");
    expect(view?.mapVessels).toEqual([]);
    expect(view?.mapRoutes[0]).toMatchObject({
      id: "live-logistics:road-keihin-tokyo",
      pointIds: ["port:yokohama", "prefecture:tokyo"]
    });
    expect(view?.mapRoutes.map((route) => route.id)).toEqual([
      "live-logistics:road-keihin-tokyo",
      "live-logistics:rail-tokyo-osaka",
      "live-logistics:coastal-tokyo-osaka",
      "live-logistics:airport-haneda-narita-ops",
      "live-logistics:air-tokyo-fukuoka",
      "live-logistics:container-asia-yokohama"
    ]);
  });

  test("returns no surface for themes with no live logistics feed", () => {
    expect(buildLiveLogisticsView("defense", null, events)).toBeNull();
  });
});
