// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EvidencePanel } from "../EvidencePanel";
import { JapanMainMap } from "../JapanMainMap";
import { OperationsSignalTable } from "../OperationsSignalTable";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { DetailViewModel, EvidenceGraphViewModel } from "../../types/presentation";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";

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
  relatedEntities: [
    {
      id: "country:japan",
      kind: "Country",
      label: "日本",
      summary: "日本",
      whyItMatters: "日本",
      themes: ["energy"],
      provenance: []
    }
  ],
  sources: [
    {
      id: "source:energy-whitepaper",
      label: "資源エネルギー庁",
      url: "https://example.com",
      publisher: "METI",
      accessed: "2026-04-11",
      official: true
    }
  ],
  sparql: {
    title: "Energy query",
    query: "SELECT * WHERE { ?s ?p ?o }"
  }
};

const evidenceGraph: EvidenceGraphViewModel = {
  nodes: [
    { id: "country:japan", kind: "Country", label: "日本" },
    { id: "country:saudi-arabia", kind: "Country", label: "サウジアラビア" }
  ],
  links: [
    {
      id: "edge:1",
      source: "country:saudi-arabia",
      target: "country:japan",
      label: "ships"
    }
  ]
};

const mapModel: JapanMapCanvasModel = {
  points: [],
  routes: [],
  regions: [],
  globalPoints: [],
  globalRoutes: []
};

describe("operations accessibility", () => {
  test("supports keyboard selection in the operations grid", () => {
    const onSelect = vi.fn();

    render(
      <OperationsSignalTable
        activeId=""
        collapsed={false}
        onSelect={onSelect}
        onToggleCollapsed={() => undefined}
        rows={[
          {
            id: "flow:saudi-oil-japan",
            type: "依存ルート",
            label: "サウジ原油 → 日本",
            subject: "原油",
            urgency: "高",
            status: "監視中",
            action: "ルートと根拠を確認",
            period: "2026"
          }
        ]}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );

    const row = screen.getByRole("button", { name: /サウジ原油 → 日本/i });
    fireEvent.keyDown(row, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("flow:saudi-oil-japan");
  });

  test("supports keyboard selection in the evidence graph", () => {
    const onSelect = vi.fn();

    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={onSelect}
        onToggleCollapsed={() => undefined}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "根拠" }));
    const node = screen.getByRole("button", { name: "根拠ノード 日本" });
    fireEvent.keyDown(node, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("country:japan");
  });

  test("labels map controls for keyboard and assistive tech", () => {
    render(
      <JapanMainMap
        activeId="flow:saudi-oil-japan"
        detail={detail}
        focusTargetId={null}
        gridExpanded={false}
        leftOffset={24}
        mapMode="route"
        metricsExpanded={false}
        metrics={[]}
        model={mapModel}
        onMapModeChange={() => undefined}
        onToggleMetrics={() => undefined}
        onSelect={() => undefined}
        rightOffset={24}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );

    expect(screen.getByRole("button", { name: "地図を拡大" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "地図を縮小" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "日本中心に戻す" })).toBeTruthy();
  });
});
