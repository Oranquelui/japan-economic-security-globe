// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ActionBar } from "../ActionBar";
import { JapanMainMap } from "../JapanMainMap";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { DetailViewModel } from "../../types/presentation";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";
import type { OperationMetric } from "../../lib/presentation/metrics";

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: () => <div data-testid="ops-canvas" />
}));

afterEach(() => {
  cleanup();
});

const themePalette = getThemePalette("energy");
const statusPalette = getStatusPalette();

const detail: DetailViewModel = {
  id: "flow:saudi-oil-japan",
  kind: "DependencyFlow",
  label: "サウジ原油 → 日本",
  summary: "海上原油ルートの簡易フロー。",
  whyItMatters: "供給途絶が日本の電力・物流・物価に波及する。",
  linkedFlows: [],
  relatedEntities: [],
  sources: [],
  sparql: {
    title: "Energy query",
    query: "SELECT * WHERE { ?s ?p ?o }"
  }
};

const mapModel: JapanMapCanvasModel = {
  points: [],
  routes: [],
  regions: [],
  globalPoints: [],
  globalRoutes: []
};

const metrics: OperationMetric[] = [
  {
    id: "visible",
    label: "表示中",
    value: 8,
    description: "表示中件数",
    tone: "monitoring"
  }
];

describe("navigation shell", () => {
  test("keeps app navigation separate from map-layer controls", () => {
    render(
      <>
        <ActionBar
          metrics={metrics}
          onClearFilters={() => undefined}
          queryActive={false}
          sharePath="/"
          themeLabel="エネルギー"
          themePalette={themePalette}
        />
        <JapanMainMap
          activeId="flow:saudi-oil-japan"
          detail={detail}
          focusTargetId={null}
          mapMode="point"
          model={mapModel}
          onMapModeChange={() => undefined}
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
    expect(within(header).queryByRole("button", { name: "地点" })).toBeNull();
    expect(within(header).queryByText("運用地図")).toBeNull();
    expect(screen.getByText("表示レイヤー")).toBeTruthy();
    expect(screen.getByRole("button", { name: "地点" })).toBeTruthy();
  });
});
