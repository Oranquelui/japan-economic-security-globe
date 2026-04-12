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
    expect(model.routes.some((route) => route.pointIds.includes("terminal:sodegaura-lng"))).toBe(true);
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
});
