import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getDetailView } from "../../semantic/detail";
import { getRouteStatus, isRenderableMapRoute } from "../route-status";

describe("route status", () => {
  test("marks domestic energy hubs without linked routes as domestic-only", () => {
    const graph = loadSeedGraph();
    const detail = getDetailView(graph, "refinery:oita");

    expect(getRouteStatus(detail)).toEqual(
      expect.objectContaining({
        kind: "domestic-only",
        chipLabel: "国内拠点"
      })
    );
    expect(getRouteStatus(detail)?.description).toContain("海外連携ルート");
    expect(getRouteStatus(detail)?.description).toContain("定義していません");
  });

  test("marks rice energy bridge flow as conceptual rather than route-linked", () => {
    const graph = loadSeedGraph();
    const detail = getDetailView(graph, "flow:energy-inputs-rice");

    expect(isRenderableMapRoute(detail.linkedFlows[0]!)).toBe(false);
    expect(getRouteStatus(detail)).toEqual(
      expect.objectContaining({
        kind: "bridge",
        chipLabel: "概念連関"
      })
    );
    expect(getRouteStatus(detail)?.description).toContain("物流ルート");
  });

  test("marks Qatar LNG flow as route-linked", () => {
    const graph = loadSeedGraph();
    const detail = getDetailView(graph, "flow:qatar-lng-japan");

    expect(isRenderableMapRoute(detail.linkedFlows[0]!)).toBe(true);
    expect(getRouteStatus(detail)).toEqual(
      expect.objectContaining({
        kind: "route-linked",
        chipLabel: "ルートあり"
      })
    );
  });
});
