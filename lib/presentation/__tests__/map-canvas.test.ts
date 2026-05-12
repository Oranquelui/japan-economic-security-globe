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
        "refinery:keihin",
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
      mapVessels: [
        {
          id: "live-vessel:tanker-qatar-tokyo-bay",
          label: "AIS tanker 042",
          lat: 12.4,
          lon: 110.8,
          relatedIds: ["flow:japan-linked-maritime-watch"],
          etaLabel: "ETA 42h",
          lastSeenLabel: "18分前"
        }
      ],
      mapRoutes: [
        {
          id: "live-logistics:tanker-qatar-tokyo-bay",
          label: "AIS tanker corridor",
          pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
          relatedIds: ["flow:japan-linked-maritime-watch"]
        },
        {
          id: "live-logistics:domestic-keihin-tokyo",
          label: "Domestic logistics: Yokohama → Keihin/Sodegaura → Tokyo",
          pointIds: ["port:yokohama", "refinery:keihin", "terminal:sodegaura-lng", "prefecture:tokyo"],
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
      expect.arrayContaining(["live-logistics:tanker-qatar-tokyo-bay", "live-logistics:domestic-keihin-tokyo"])
    );
    expect(model.livePoints.map((point: { id: string }) => point.id)).toEqual(
      expect.arrayContaining(["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng", "refinery:keihin", "prefecture:tokyo"])
    );
    expect(model.liveVessels).toEqual([
      expect.objectContaining({
        id: "live-vessel:tanker-qatar-tokyo-bay",
        kind: "Japan-bound tanker",
        label: "AIS tanker 042",
        lat: 12.4,
        lon: 110.8,
        selectionId: "flow:japan-linked-maritime-watch"
      })
    ]);
  });
});
