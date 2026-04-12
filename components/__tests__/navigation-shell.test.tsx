// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

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
    expect(within(header).getByRole("button", { name: "地点" })).toBeTruthy();
    expect(within(header).queryByText("運用地図")).toBeNull();
    expect(within(header).getByText("表示レイヤー")).toBeTruthy();
    expect(screen.queryByText("選択")).toBeNull();
    expect(within(header).getByText("選択中")).toBeTruthy();
  });
});
