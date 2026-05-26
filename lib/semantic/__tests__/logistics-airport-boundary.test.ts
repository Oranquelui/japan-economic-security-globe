import { describe, expect, test } from "vitest";

import watchOverlaySeeds from "../../../data/seed/watch-overlays.json";
import { loadSeedGraph, loadSeedLiveLogistics } from "../../data/seed-loader";
import { buildWatchOverlayItems } from "../../presentation/watch-overlays";
import { loadRankingSignals } from "../../ranking/ranking-loader";
import { buildLiveLogisticsView } from "../../presentation/live-logistics";
import { getThemeView } from "../selectors";

const forbiddenPublicLayerPatterns = [
  /CCTV/i,
  /threat dashboard/i,
  /\brecon\b/i,
  /\bcyber\b/i,
  /military aircraft/i,
  /軍用機追跡/,
  /個別人物追跡/,
  /旅客追跡/,
  /port scanning/i,
  /WHOIS/i,
  /\bCVE\b/i,
  /\bBGP\b/i,
  /IP sweep/i
];

const forbiddenEnergyLogisticsRefs = [
  "resource:lng",
  "resource:crude-oil",
  "resource:coal",
  "route:gulf-to-japan",
  "chokepoint:hormuz",
  "terminal:sodegaura-lng",
  "refinery:keihin",
  "source:enecho-energy-trends",
  "source:meti-2026-energy-taskforce",
  "source:tepco-2026-april-power"
];

describe("logistics airport boundary", () => {
  test("models airport operations as logistics-only public aggregate infrastructure", () => {
    const graph = loadSeedGraph();
    const logisticsView = getThemeView(graph, "logistics");
    const energyView = getThemeView(graph, "energy");
    const airportIds = ["airport:haneda", "airport:narita"];

    expect(logisticsView.entities.filter((entity) => entity.kind === "Airport").map((entity) => entity.id)).toEqual(
      expect.arrayContaining(airportIds)
    );
    expect(energyView.entities.map((entity) => entity.id)).not.toEqual(expect.arrayContaining(airportIds));

    for (const airportId of airportIds) {
      const airport = graph.entities.find((entity) => entity.id === airportId);
      expect(airport?.themes).toEqual(["logistics"]);
      expect(airport?.summary).toContain("公開");
      expect(airport?.whyItMatters).toContain("航空貨物");
    }
  });

  test("keeps airport operations delayed and aggregate without aircraft or passenger tracking fields", () => {
    const airportEvents = loadSeedLiveLogistics().filter((event) => event.kindLabel === "空港運用");

    expect(airportEvents.map((event) => event.id)).toEqual(["live-logistics:airport-haneda-narita-ops"]);
    expect(airportEvents[0]).toMatchObject({
      laneId: "air",
      themeIds: ["logistics"],
      disclosureLabel: "公開集約 / airport-level only / delayed"
    });
    expect(airportEvents[0].currentPosition).toBeUndefined();
    expect(JSON.stringify(airportEvents)).not.toMatch(/flight|tail|passenger|military|軍用機|旅客|個別便/i);
  });

  test("keeps logistics maritime cargo distinct from energy tanker support", () => {
    const events = loadSeedLiveLogistics();
    const generalCargoEvents = events.filter((event) => event.kindLabel.includes("コンテナ") || event.kindLabel.includes("一般貨物") || event.kindLabel.includes("自動車船"));
    const energySupportEvents = events.filter((event) => event.kindLabel === "外航海上補助");

    expect(generalCargoEvents.map((event) => event.id)).toEqual(["live-logistics:container-asia-yokohama"]);
    expect(generalCargoEvents[0].themeIds).toEqual(["logistics"]);
    expect(generalCargoEvents[0].title).not.toMatch(/tanker|crude|LNG/i);

    expect(energySupportEvents.length).toBeGreaterThan(0);
    expect(energySupportEvents.every((event) => event.themeIds.includes("energy"))).toBe(true);
  });

  test("keeps energy tanker operations out of the logistics theme", () => {
    const events = loadSeedLiveLogistics();
    const tankerEvents = events.filter((event) => event.id.includes(":tanker-"));
    const logisticsView = buildLiveLogisticsView("logistics", null, events);
    const energyView = buildLiveLogisticsView("energy", null, events);
    const tankerIds = tankerEvents.map((event) => event.id);

    expect(tankerIds).toEqual([
      "live-logistics:tanker-qatar-tokyo-bay",
      "live-logistics:tanker-saudi-kashima",
      "live-logistics:tanker-australia-sodegaura",
      "live-logistics:tanker-singapore-yokohama"
    ]);
    expect(tankerEvents.every((event) => event.themeIds.length === 1 && event.themeIds[0] === "energy")).toBe(true);
    expect(tankerEvents.flatMap((event) => event.relatedIds)).not.toContain("flow:japan-linked-maritime-watch");
    expect(logisticsView?.items.map((item) => item.id)).not.toEqual(expect.arrayContaining(tankerIds));
    expect(logisticsView?.mapVessels).toEqual([]);
    expect(energyView?.items.map((item) => item.id)).toEqual(expect.arrayContaining(tankerIds));
  });

  test("keeps the logistics semantic maritime watch free of energy resources and tanker routes", () => {
    const graph = loadSeedGraph();
    const logisticsFlow = graph.flows.find((flow) => flow.id === "flow:japan-linked-maritime-watch");
    const logisticsThemeView = getThemeView(graph, "logistics");
    const logisticsOverlays = buildWatchOverlayItems("logistics", null, new Date("2026-05-01T00:00:00.000Z"));
    const rawLogisticsOverlays = watchOverlaySeeds.filter((overlay) => overlay.themeIds.includes("logistics"));
    const logisticsSignal = loadRankingSignals().find(
      (signal) => signal.id === "ranking-signal:logistics-japan-maritime-watch"
    );

    expect(logisticsFlow).toBeDefined();
    expect(logisticsFlow?.theme).toBe("logistics");
    expect(logisticsFlow?.resourceId).toBeUndefined();
    expect(logisticsThemeView.entities.map((entity) => entity.id)).not.toEqual(
      expect.arrayContaining(["chokepoint:hormuz", "route:gulf-to-japan", "terminal:sodegaura-lng", "refinery:keihin"])
    );
    expect(logisticsThemeView.sources.map((source) => source.id)).not.toEqual(
      expect.arrayContaining([
        "source:enecho-energy-trends",
        "source:meti-2026-energy-taskforce",
        "source:tepco-2026-april-power"
      ])
    );
    expect([
      logisticsFlow?.originId,
      logisticsFlow?.destinationId,
      ...(logisticsFlow?.routeIds ?? []),
      ...(logisticsFlow?.sourceIds ?? [])
    ]).not.toEqual(expect.arrayContaining(forbiddenEnergyLogisticsRefs));

    expect(logisticsOverlays.map((overlay) => `${overlay.title} ${overlay.summary}`)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/LNG|タンカー|ホルムズ|受入基地/i)])
    );
    for (const overlay of rawLogisticsOverlays) {
      expect([...overlay.relatedIds, ...overlay.sourceIds]).not.toEqual(expect.arrayContaining(forbiddenEnergyLogisticsRefs));
    }

    expect(logisticsSignal).toBeDefined();
    expect(logisticsSignal?.importanceAxes).toEqual(["logistics"]);
    expect(logisticsSignal?.sourceIds).not.toEqual(expect.arrayContaining(forbiddenEnergyLogisticsRefs));
    expect(logisticsSignal?.canonicalRefs.map((ref) => ref.id)).not.toEqual(expect.arrayContaining(forbiddenEnergyLogisticsRefs));
  });

  test("does not introduce prohibited OSINT, CCTV, cyber, or threat-dashboard wording into public seeds", () => {
    const graph = loadSeedGraph();
    const liveLogistics = loadSeedLiveLogistics();
    const publicSeedText = JSON.stringify({ graph, liveLogistics });

    for (const pattern of forbiddenPublicLayerPatterns) {
      expect(publicSeedText).not.toMatch(pattern);
    }
  });
});
