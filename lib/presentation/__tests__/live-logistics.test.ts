import { describe, expect, test } from "vitest";

import type { LiveLogisticsEvent } from "../../../types/logistics";
import { buildLiveLogisticsView } from "../live-logistics";

const events: Array<LiveLogisticsEvent & { laneId: "maritime" | "domestic" }> = [
  {
    id: "live-logistics:tanker-qatar-tokyo-bay",
    themeIds: ["logistics", "energy"],
    title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
    currentPosition: {
      lat: 12.4,
      lon: 110.8,
      label: "AIS tanker 042"
    },
    kindLabel: "AIS tanker",
    statusLabel: "Underway",
    lastSeenLabel: "18分前",
    etaLabel: "ETA 42h",
    sourceLabel: "AIS provider fixture",
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
    id: "live-logistics:domestic-keihin-tokyo",
    themeIds: ["logistics", "energy"],
    title: "Domestic logistics: Yokohama → Keihin/Sodegaura → Tokyo",
    kindLabel: "Domestic logistics",
    statusLabel: "接続監視",
    lastSeenLabel: "22分前",
    etaLabel: "次回更新 15分",
    sourceLabel: "xROAD / Cyber Port fixture",
    disclosureLabel: "公開系統 / route-level only",
    confidenceLabel: "公式/準公式",
    corridorLabel: "Yokohama → Keihin/Sodegaura → Tokyo",
    pointIds: ["port:yokohama", "refinery:keihin", "terminal:sodegaura-lng", "prefecture:tokyo"],
    relatedIds: ["flow:japan-linked-maritime-watch"],
    laneId: "domestic",
    signalTone: "monitoring",
    priority: 94
  }
];

describe("live logistics view", () => {
  test("builds a delayed route-level logistics surface for matching themes", () => {
    const view = buildLiveLogisticsView("logistics", "flow:japan-linked-maritime-watch", events, new Date("2026-05-11T00:30:00.000Z"));

    expect(view?.title).toBe("JAPAN-BOUND TANKER WATCH");
    expect(view?.disclosureLabel).toContain("AIS coverage");
    expect(view?.items.map((item) => item.kindLabel)).toEqual(["AIS tanker", "Domestic logistics"]);
    expect(view?.lanes.map((lane) => lane.title)).toEqual(["日本向けタンカー", "国内接続"]);
    expect(view?.lanes[0].items.map((item) => item.kindLabel)).toEqual(["AIS tanker"]);
    expect(view?.lanes[1].items.map((item) => item.kindLabel)).toEqual(["Domestic logistics"]);
    expect(view?.items[0].sourceLabel).toBe("AIS provider fixture");
    expect(view?.mapVessels).toEqual([
      {
        id: "live-vessel:tanker-qatar-tokyo-bay",
        label: "AIS tanker 042",
        lat: 12.4,
        lon: 110.8,
        relatedIds: ["flow:japan-linked-maritime-watch"],
        etaLabel: "ETA 42h",
        lastSeenLabel: "18分前"
      }
    ]);
    expect(view?.mapRoutes[0]).toMatchObject({
      id: "live-logistics:tanker-qatar-tokyo-bay",
      pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"]
    });
  });

  test("returns no surface for themes with no live logistics feed", () => {
    expect(buildLiveLogisticsView("defense", null, events)).toBeNull();
  });
});
