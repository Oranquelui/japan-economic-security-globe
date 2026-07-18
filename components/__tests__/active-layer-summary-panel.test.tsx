// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import {
  buildActiveLayerSummary,
  buildWorkspacePresentation,
  getLayerDefinition
} from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import type { LayerDefinition, ThemeView } from "../../types/presentation";
import type { SemanticGraph, SourceDocument, ThemeId } from "../../types/semantic";
import { ActiveLayerSummaryPanel } from "../ActiveLayerSummaryPanel";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function buildPanelInput(
  graph: SemanticGraph,
  themeId: ThemeId,
  layerId: string,
  transformView: (view: ThemeView) => ThemeView = (view) => view
): { layer: LayerDefinition; summary: ReturnType<typeof buildActiveLayerSummary> } {
  const view = transformView(getThemeView(graph, themeId));
  const workspace = buildWorkspacePresentation(graph, view);
  const layer = getLayerDefinition(themeId, layerId, workspace)!;

  return {
    layer,
    summary: buildActiveLayerSummary(graph, view, layer, workspace.scope)
  };
}

function renderPanel(
  graph: SemanticGraph,
  themeId: ThemeId,
  layerId: string,
  transformView?: (view: ThemeView) => ThemeView
) {
  const { layer, summary } = buildPanelInput(graph, themeId, layerId, transformView);

  render(
    <ActiveLayerSummaryPanel
      legend={layer.legend}
      summary={summary}
      themePalette={getThemePalette(themeId)}
    />
  );

  return { layer, summary };
}

describe("ActiveLayerSummaryPanel", () => {
  test("renders the rice-harvest reading path and one directly linked official source", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T00:00:00Z"));

    const graph = loadSeedGraph();
    const source = graph.sources.find(
      (candidate) => candidate.id === "source:estat-rice-prefecture-harvest-r5"
    )!;

    renderPanel(graph, "rice", "rice-harvest");

    expect(screen.getByRole("region", { name: "いま表示中" })).toBeTruthy();
    expect(screen.getByText("収穫量")).toBeTruthy();
    expect(screen.getByText("6,610,315")).toBeTruthy();
    expect(screen.getAllByText("トン").length).toBeGreaterThan(0);
    expect(screen.getByText("47都道府県")).toBeTruthy();
    expect(screen.getByText("令和5年産")).toBeTruthy();
    expect(screen.getByText("データなし")).toBeTruthy();
    expect(screen.getByText(/代表点.*行政区域ポリゴンではありません/)).toBeTruthy();
    expect(screen.getByText("公式")).toBeTruthy();
    expect(screen.getByText("97日前確認")).toBeTruthy();

    const link = screen.getByRole("link", { name: source.label });
    expect(link.getAttribute("href")).toBe(source.url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  test("renders every active source in sourceIds order", () => {
    const graph = loadSeedGraph();
    const { layer } = renderPanel(graph, "rice", "rice-inventory-policy");

    const sourceItems = screen.getAllByTestId("active-layer-source");
    const expectedLabels = layer.sourceIds.map(
      (sourceId) => graph.sources.find((source) => source.id === sourceId)!.label
    );

    expect(sourceItems).toHaveLength(expectedLabels.length);
    sourceItems.forEach((item, index) => {
      expect(item.textContent).toContain(expectedLabels[index]);
    });
  });

  test("never renders an official badge for the Natural Earth open-data source", () => {
    const graph = loadSeedGraph();
    const naturalEarth = graph.sources.find(
      (source) => source.id === "source:natural-earth-admin1-japan-5-1-1"
    )!;
    const { layer, summary } = buildPanelInput(graph, "rice", "rice-harvest");

    render(
      <ActiveLayerSummaryPanel
        legend={layer.legend}
        summary={{ ...summary, sources: [naturalEarth] }}
        themePalette={getThemePalette("rice")}
      />
    );

    const sourceItem = screen.getByTestId("active-layer-source");
    expect(within(sourceItem).getByRole("link", { name: naturalEarth.label })).toBeTruthy();
    expect(within(sourceItem).queryByText("公式")).toBeNull();
  });

  test.each([
    { name: "legacy source without authority fields", authority: {}, expectedOfficial: true },
    { name: "legacy official false", authority: { official: false }, expectedOfficial: false },
    {
      name: "explicit open-data category with official true",
      authority: { official: true, sourceCategory: "open-data" as const },
      expectedOfficial: false
    },
    {
      name: "explicit private category with official true",
      authority: { official: true, sourceCategory: "private" as const },
      expectedOfficial: false
    },
    {
      name: "explicit official category with official false",
      authority: { official: false, sourceCategory: "official" as const },
      expectedOfficial: true
    }
  ])("resolves the official badge for $name", ({ authority, expectedOfficial }) => {
    const graph = loadSeedGraph();
    const { layer, summary } = buildPanelInput(graph, "rice", "rice-harvest");
    const source: SourceDocument = {
      id: "source:badge-authority",
      label: "Badge authority source",
      url: "https://example.com/badge-authority",
      publisher: "Test publisher",
      accessed: "2026-07-18",
      ...authority
    };

    render(
      <ActiveLayerSummaryPanel
        legend={layer.legend}
        summary={{ ...summary, sources: [source] }}
        themePalette={getThemePalette("rice")}
      />
    );

    const sourceItem = screen.getByTestId("active-layer-source");
    if (expectedOfficial) {
      expect(within(sourceItem).getByText("公式")).toBeTruthy();
    } else {
      expect(within(sourceItem).queryByText("公式")).toBeNull();
    }
  });

  test("renders an official source without a URL as text and never invents a link", () => {
    const graph = structuredClone(loadSeedGraph());
    const source = graph.sources.find(
      (candidate) => candidate.id === "source:estat-rice-prefecture-harvest-r5"
    )!;
    source.url = "";

    renderPanel(graph, "rice", "rice-harvest");

    expect(screen.getByText(source.label)).toBeTruthy();
    expect(screen.getByText("公式")).toBeTruthy();
    expect(screen.queryByRole("link", { name: source.label })).toBeNull();
    expect(document.querySelector('a[href=""]')).toBeNull();
  });

  test.each(["", "22分前"])(
    "shows unknown freshness for an unparseable access time %j",
    (accessed) => {
      const graph = structuredClone(loadSeedGraph());
      const source = graph.sources.find(
        (candidate) => candidate.id === "source:estat-rice-prefecture-harvest-r5"
      )!;
      source.accessed = accessed;

      renderPanel(graph, "rice", "rice-harvest");

      expect(screen.getByText("確認時点不明")).toBeTruthy();
      expect(screen.getByText("確認日不明")).toBeTruthy();
      expect(screen.queryByText(/NaN|日前確認|確認日 22分前/)).toBeNull();
    }
  );

  test("renders fixed demo data without an official badge or source link", () => {
    renderPanel(loadSeedGraph(), "logistics", "logistics-domestic");

    const sourceSection = screen.getByRole("heading", { name: "出典" }).parentElement;

    expect(sourceSection).not.toBeNull();
    expect(within(sourceSection!).getByText("固定デモデータ")).toBeTruthy();
    expect(screen.queryByText("公式")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("renders an unresolved source honestly without an empty link", () => {
    renderPanel(loadSeedGraph(), "rice", "rice-price", (view) => ({
      ...view,
      sources: []
    }));

    expect(screen.getByText("出典情報なし")).toBeTruthy();
    expect(screen.queryByText("公式")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector('a[href=""]')).toBeNull();
  });
});
