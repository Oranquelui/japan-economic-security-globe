// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import { getDetailView } from "../../lib/semantic/detail";
import { JapanMainMap } from "../JapanMainMap";

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: () => <div data-testid="mock-map-canvas" />
}));

afterEach(() => {
  cleanup();
});

describe("JapanMainMap popup placement", () => {
  test("anchors the desktop detail popup near the map click position", () => {
    const graph = loadSeedGraph();
    const detail = getDetailView(graph, "flow:japan-linked-maritime-watch");

    render(
      <div style={{ height: 720, width: 1024 }}>
        <JapanMainMap
          activeId="live-logistics:tanker-qatar-tokyo-bay"
          detailPopup={{
            anchor: { placement: "right", x: 420, y: 260 },
            detail,
            themeTitle: "物流"
          }}
          focusTargetId={null}
          mapMode="route"
          model={{
            points: [],
            routes: [],
            regions: [],
            globalPoints: [],
            globalRoutes: []
          }}
          onSelect={vi.fn()}
          statusPalette={getStatusPalette()}
          themePalette={getThemePalette("logistics")}
        />
      </div>
    );

    const anchor = screen.getByTestId("map-detail-popup-anchor");
    expect(anchor.getAttribute("data-placement")).toBe("right");
    expect(anchor.getAttribute("style")).toContain("left: 420px");
    expect(anchor.getAttribute("style")).toContain("translate(16px, -50%)");
  });

  test("shows a regional-security map disclosure when provided", () => {
    render(
      <div style={{ height: 720, width: 1024 }}>
        <JapanMainMap
          activeId="flow:nk-missile-history-japan-watch"
          focusTargetId={null}
          mapDisclosure={{
            title: "代表軌道",
            body: "公開情報 / 履歴・集約 / ライブ追跡ではありません"
          }}
          mapMode="route"
          model={{
            points: [],
            routes: [],
            regions: [],
            globalPoints: [],
            globalRoutes: []
          }}
          onSelect={vi.fn()}
          statusPalette={getStatusPalette()}
          themePalette={getThemePalette("regional-security")}
        />
      </div>
    );

    expect(screen.getByText("代表軌道")).toBeTruthy();
    expect(screen.getByText("公開情報 / 履歴・集約 / ライブ追跡ではありません")).toBeTruthy();
  });
});
