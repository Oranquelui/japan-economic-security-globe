import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getThemeView } from "../selectors";

describe("national theme coverage", () => {
  test("expands rice into east and west domestic production anchors", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const ids = new Set(view.japanImpacts.map((entity) => entity.id));
    const prefectures = view.japanImpacts.filter((entity) => entity.kind === "Prefecture");

    expect(ids.has("prefecture:niigata")).toBe(true);
    expect(ids.has("prefecture:hyogo")).toBe(true);
    expect(ids.has("prefecture:okayama")).toBe(true);
    expect(ids.has("prefecture:hiroshima")).toBe(true);
    expect(ids.has("prefecture:fukuoka")).toBe(true);
    expect(prefectures.length).toBeGreaterThanOrEqual(47);
  });

  test("covers national domestic energy receiving and refining hubs", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");
    const ids = new Set(view.japanImpacts.map((entity) => entity.id));
    const domesticHubs = view.japanImpacts.filter((entity) =>
      ["Port", "Terminal", "Refinery", "Prefecture"].includes(entity.kind)
    );

    expect(ids.has("terminal:tomakomai-lng")).toBe(true);
    expect(ids.has("terminal:senboku-lng")).toBe(true);
    expect(ids.has("terminal:hibiki-lng")).toBe(true);
    expect(ids.has("refinery:mizushima")).toBe(true);
    expect(ids.has("refinery:sendai")).toBe(true);
    expect(domesticHubs.length).toBeGreaterThanOrEqual(10);
  });

  test("covers national domestic semiconductor hubs", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "semiconductors");
    const ids = new Set(view.japanImpacts.map((entity) => entity.id));
    const facilities = view.japanImpacts.filter((entity) => entity.kind === "Facility");

    expect(ids.has("facility:rapidus-chitose")).toBe(true);
    expect(ids.has("facility:jasm-kumamoto")).toBe(true);
    expect(ids.has("facility:kioxia-yokkaichi")).toBe(true);
    expect(ids.has("facility:micron-hiroshima")).toBe(true);
    expect(ids.has("facility:renesas-naka")).toBe(true);
    expect(facilities.length).toBeGreaterThanOrEqual(5);
  });

  test("covers national water monitoring reservoirs", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "water");
    const ids = new Set(view.japanImpacts.map((entity) => entity.id));
    const reservoirs = view.japanImpacts.filter((entity) => entity.kind === "Reservoir");

    expect(ids.has("reservoir:ogochi")).toBe(true);
    expect(ids.has("reservoir:kamafusa")).toBe(true);
    expect(ids.has("reservoir:hiyoshi")).toBe(true);
    expect(ids.has("reservoir:sameura")).toBe(true);
    expect(ids.has("reservoir:tsuruta")).toBe(true);
    expect(reservoirs.length).toBeGreaterThanOrEqual(5);
  });

  test("covers national domestic defense hubs", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "defense");
    const ids = new Set(view.japanImpacts.map((entity) => entity.id));
    const facilities = view.japanImpacts.filter((entity) => entity.kind === "Facility");

    expect(ids.has("facility:camp-asaka")).toBe(true);
    expect(ids.has("facility:misawa-air-base")).toBe(true);
    expect(ids.has("facility:iwakuni-base")).toBe(true);
    expect(ids.has("facility:sasebo-base")).toBe(true);
    expect(ids.has("facility:yonaguni-camp")).toBe(true);
    expect(facilities.length).toBeGreaterThanOrEqual(5);
  });
});
