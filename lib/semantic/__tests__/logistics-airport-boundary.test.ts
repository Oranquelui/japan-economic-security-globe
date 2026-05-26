import { describe, expect, test } from "vitest";

import { loadSeedGraph, loadSeedLiveLogistics } from "../../data/seed-loader";
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

  test("does not introduce prohibited OSINT, CCTV, cyber, or threat-dashboard wording into public seeds", () => {
    const graph = loadSeedGraph();
    const liveLogistics = loadSeedLiveLogistics();
    const publicSeedText = JSON.stringify({ graph, liveLogistics });

    for (const pattern of forbiddenPublicLayerPatterns) {
      expect(publicSeedText).not.toMatch(pattern);
    }
  });
});
