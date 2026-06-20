import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getThemeView } from "../../semantic/selectors";
import { buildJapanMapCanvasModel } from "../map-canvas";

describe("japan map canvas model", () => {
  test("starts Japan-first but prepares global overlay points and routes for zoom-out", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");

    const model = buildJapanMapCanvasModel(graph, view, "flow:qatar-lng-japan");

    expect(model.points.map((point) => point.id)).toEqual(
      expect.arrayContaining(["terminal:sodegaura-lng", "prefecture:tokyo"])
    );
    expect(model.points.map((point) => point.id)).not.toContain("country:qatar");
    expect(model.globalPoints.map((point) => point.id)).toEqual(
      expect.arrayContaining(["country:qatar", "chokepoint:hormuz", "country:japan"])
    );
    expect(model.globalRoutes.find((route) => route.id === "flow:qatar-lng-japan")?.pointIds).toEqual(
      expect.arrayContaining(["country:qatar", "chokepoint:hormuz", "terminal:sodegaura-lng"])
    );
    expect(model.foreignWindow?.entities.map((entity) => entity.id)).toContain("country:qatar");
    expect(model.routes).toHaveLength(0);
  });

  test("expands rice domestic points beyond the original two using prefectural production anchors", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "observation:rice-price-signal-2026");
    const ricePrefecturePoints = model.points.filter((point) => point.id.startsWith("prefecture:"));

    expect(model.points.map((point) => point.id)).toEqual(
      expect.arrayContaining([
        "prefecture:niigata",
        "prefecture:hokkaido",
        "prefecture:akita",
        "prefecture:miyagi",
        "prefecture:yamagata",
        "prefecture:hyogo",
        "prefecture:okayama",
        "prefecture:hiroshima",
        "prefecture:fukuoka"
      ])
    );
    expect(ricePrefecturePoints.length).toBeGreaterThanOrEqual(47);
    expect(model.regions.find((region) => region.id === "prefecture:niigata")?.value).toBeGreaterThan(
      model.regions.find((region) => region.id === "prefecture:osaka")?.value ?? 0
    );
  });

  test("does not surface rice route overlays for policy or price observations", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "observation:rice-stockpile-policy-2026");

    expect(model.routes).toHaveLength(0);
    expect(model.globalRoutes).toHaveLength(0);
    expect(model.foreignWindow).toBeUndefined();
  });

  test("does not render conceptual rice bridge flows as map routes even when the flow itself is selected", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "flow:energy-inputs-rice");

    expect(model.routes).toHaveLength(0);
    expect(model.globalRoutes).toHaveLength(0);
    expect(model.foreignWindow).toBeUndefined();
  });

  test("adds live logistics routes and route-only points to the map model", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const liveLogistics = {
      mapVessels: [],
      mapRoutes: [
        {
          id: "live-logistics:container-asia-yokohama",
          label: "コンテナ一般貨物: 東アジア → 横浜港 → 首都圏配送",
          pointIds: ["chokepoint:malacca", "port:yokohama", "prefecture:tokyo"],
          relatedIds: ["flow:japan-linked-maritime-watch"]
        },
        {
          id: "live-logistics:road-keihin-tokyo",
          label: "陸路: 横浜港 → 首都圏配送",
          pointIds: ["port:yokohama", "prefecture:tokyo"],
          relatedIds: ["flow:japan-linked-maritime-watch"]
        }
      ]
    };

    const model = (buildJapanMapCanvasModel as any)(
      graph,
      view,
      "flow:japan-linked-maritime-watch",
      liveLogistics
    );

    expect(model.liveRoutes.map((route: { id: string }) => route.id)).toEqual(
      expect.arrayContaining(["live-logistics:container-asia-yokohama", "live-logistics:road-keihin-tokyo"])
    );
    const containerRoute = model.liveRoutes.find((route: { id: string }) => route.id === "live-logistics:container-asia-yokohama");
    expect(containerRoute?.pointIds).toEqual(["port:yokohama", "prefecture:tokyo"]);
    expect(model.livePoints.map((point: { id: string }) => point.id)).toEqual(
      expect.arrayContaining(["port:yokohama", "prefecture:tokyo"])
    );
    expect(model.livePoints.map((point: { id: string }) => point.id)).not.toContain("chokepoint:malacca");
    expect(model.liveVessels).toEqual([]);
    expect(model.logisticsImpactRegions.map((region: { id: string }) => region.id)).toEqual(
      expect.arrayContaining(["prefecture:tokyo", "prefecture:aichi", "prefecture:osaka"])
    );
    expect(model.logisticsImpactRoutes.map((route: { id: string }) => route.id)).toEqual(
      expect.arrayContaining(["live-logistics:container-asia-yokohama", "live-logistics:road-keihin-tokyo"])
    );
    expect(model.logisticsImpactCorridors.map((corridor: { id: string }) => corridor.id)).toEqual(
      expect.arrayContaining([
        "corridor-band:tomei-shin-tomei-meishin",
        "corridor-band:tokaido-rail-freight",
        "corridor-band:yokohama-tokyo-port-hinterland"
      ])
    );
    expect(model.logisticsImpactCorridors[0].geometry.type).toBe("Polygon");
    expect(model.logisticsImpactCorridors[0].geometry.coordinates[0].length).toBeGreaterThan(8);
  });

  test("renders airport operations as facility points without aircraft markers", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const liveLogistics = {
      mapVessels: [],
      mapRoutes: [
        {
          id: "live-logistics:airport-haneda-narita-ops",
          label: "空港運用",
          pointIds: ["airport:haneda", "airport:narita", "prefecture:tokyo"],
          relatedIds: ["airport:haneda", "airport:narita"]
        }
      ]
    };

    const model = (buildJapanMapCanvasModel as any)(
      graph,
      view,
      "live-logistics:airport-haneda-narita-ops",
      liveLogistics
    );

    expect(model.liveRoutes.map((route: { id: string }) => route.id)).toEqual([
      "live-logistics:airport-haneda-narita-ops"
    ]);
    expect(model.livePoints.map((point: { id: string; kind: string }) => [point.id, point.kind])).toEqual(
      expect.arrayContaining([
        ["airport:haneda", "Airport"],
        ["airport:narita", "Airport"]
      ])
    );
    expect(model.liveVessels).toEqual([]);
  });

  test("renders regional security missile context as an impact area instead of a route line", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "regional-security");

    const model = buildJapanMapCanvasModel(graph, view, "flow:nk-missile-history-japan-watch");

    expect(model.globalRoutes.find((route) => route.id === "flow:nk-missile-history-japan-watch")).toBeUndefined();
    expect(model.points.map((point) => point.id)).not.toContain("country:japan");
    expect(model.globalPoints.map((point) => point.id)).not.toContain("country:japan");
    expect(model.securityImpactAreas).toEqual([
      expect.objectContaining({
        id: "impact-area:sea-of-japan",
        label: "日本海代表落下・影響推定区域",
        radiusKm: 180,
        radiusLabel: "影響推定半径 約180km",
        selectionId: "flow:nk-missile-history-japan-watch"
      })
    ]);
    expect(model.livePoints).toEqual([]);
    expect(model.liveRoutes).toEqual([]);
    expect(model.liveVessels).toEqual([]);
  });
});
