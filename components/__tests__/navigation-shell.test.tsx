// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ActionBar } from "../ActionBar";
import { JapanMainMap } from "../JapanMainMap";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { DetailViewModel } from "../../types/presentation";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: () => <div data-testid="ops-canvas" />
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const themePalette = getThemePalette("energy");
const statusPalette = getStatusPalette();

const mapModel: JapanMapCanvasModel = {
  points: [],
  routes: [],
  regions: [],
  globalPoints: [],
  globalRoutes: []
};

describe("navigation shell", () => {
  test("defers map canvas mount until after the first paint", () => {
    render(
      <JapanMainMap
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="point"
        model={mapModel}
        onSelect={() => undefined}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );

    expect(screen.getByText("地図を準備中")).toBeTruthy();
    expect(screen.queryByTestId("ops-canvas")).toBeNull();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByText("地図を準備中")).toBeNull();
    expect(screen.getByTestId("ops-canvas")).toBeTruthy();
  });

  test("keeps app navigation separate from map-layer controls", () => {
    render(
      <>
        <ActionBar
          mapMode="point"
          onClearFilters={() => undefined}
          onMapModeChange={() => undefined}
          queryActive={false}
          selectedKindLabel="依存フロー"
          selectedLabel="サウジ原油 → 日本"
          sharePath="/"
          themeLabel="エネルギー"
          themePalette={themePalette}
        />
        <JapanMainMap
          activeId="flow:saudi-oil-japan"
          focusTargetId={null}
          mapMode="point"
          model={mapModel}
          onSelect={() => undefined}
          statusPalette={statusPalette}
          themePalette={themePalette}
        />
      </>
    );

    const header = screen.getByRole("banner");
    expect(within(header).queryByRole("button", { name: "受信トレイ" })).toBeNull();
    expect(within(header).queryByRole("button", { name: "比較表" })).toBeNull();
    expect(within(header).queryByRole("button", { name: "根拠" })).toBeNull();
    expect(within(header).getByRole("button", { name: "メニュー" })).toBeTruthy();
    expect(within(header).getByRole("button", { name: "地点" })).toBeTruthy();
    expect(within(header).queryByText("運用地図")).toBeNull();
    expect(within(header).getByText("表示レイヤー")).toBeTruthy();
    expect(screen.queryByText("選択")).toBeNull();
    expect(within(header).getByText("選択中")).toBeTruthy();
  });
});
