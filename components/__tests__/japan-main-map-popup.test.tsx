// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import { getDetailView } from "../../lib/semantic/detail";
import { JapanMainMap } from "../JapanMainMap";

let emitHover: ((hover: any) => void) | undefined;

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: ({ onHover }: { onHover?: (hover: any) => void }) => {
    emitHover = onHover;
    return <div data-testid="mock-map-canvas" />;
  }
}));

afterEach(() => {
  cleanup();
  emitHover = undefined;
});

describe("JapanMainMap popup placement", () => {
  test("keeps detail popup mobile-only without a desktop anchor", () => {
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

    expect(screen.getAllByTestId("map-detail-popup")).toHaveLength(1);
    const mobilePopupContainer = screen.getByTestId("map-detail-popup").parentElement;
    expect(mobilePopupContainer?.className).toContain("xl:hidden");
    expect(mobilePopupContainer?.className).not.toContain("lg:hidden");
    expect(screen.queryByTestId("map-detail-popup-anchor")).toBeNull();
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

  test("keeps hover transient and clears it when the map model changes", () => {
    const onSelect = vi.fn();
    const initialUrl = window.location.href;
    const model = {
      points: [],
      routes: [],
      regions: [],
      globalPoints: [],
      globalRoutes: []
    };
    const { rerender } = render(
      <JapanMainMap
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode="choropleth"
        model={model}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    act(() => {
      emitHover?.({
        selectionId: "prefecture:niigata",
        label: "新潟県",
        valueLabel: "514,100",
        unitLabel: "トン",
        periodLabel: "令和5年産",
        x: 320,
        y: 180
      });
    });

    expect(screen.getByRole("tooltip")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);

    rerender(
      <JapanMainMap
        activeId="prefecture:hokkaido"
        focusTargetId={null}
        mapMode="choropleth"
        model={{ ...model }}
        onSelect={onSelect}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
  });
});
