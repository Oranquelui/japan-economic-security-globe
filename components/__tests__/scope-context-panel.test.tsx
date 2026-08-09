// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import {
  buildActiveLayerSummary,
  buildWorkspacePresentation
} from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import type { SemanticLayerId } from "../../types/presentation";
import type { ThemeId } from "../../types/semantic";
import { ScopeContextPanel } from "../ScopeContextPanel";

afterEach(cleanup);

function buildPanelInput(
  activeLayerId: SemanticLayerId = "rice-harvest",
  themeIds: readonly ThemeId[] = ["rice", "energy"]
) {
  const graph = loadSeedGraph();
  const view = getThemeView(graph, "rice");
  const workspace = buildWorkspacePresentation(graph, view);
  const requestedLayer = workspace.layers.find((layer) => layer.id === activeLayerId);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : workspace.layers.find((layer) => layer.available) ?? workspace.layers[0];

  if (!activeLayer) {
    throw new Error("Expected the rice workspace to define at least one layer.");
  }

  return {
    activeLayerId,
    activeSummary: buildActiveLayerSummary(graph, view, activeLayer, workspace.scope),
    comparisonAvailable: true,
    onLayerChange: vi.fn(),
    onOpenComparison: vi.fn(),
    onOpenSignals: vi.fn(),
    onThemeChange: vi.fn(),
    themeId: "rice" as const,
    themeIds,
    themePalette: getThemePalette("rice"),
    workspace
  };
}

describe("ScopeContextPanel", () => {
  test("shows one theme selector and one active-layer reading path without legacy scope cards", () => {
    const input = buildPanelInput();

    render(<ScopeContextPanel {...input} />);

    const panel = screen.getByTestId("scope-context-panel");
    const themeSelect = screen.getByRole("combobox", { name: "テーマ" });
    const activeSummary = screen.getByRole("region", { name: "いま表示中" });
    const layerRegion = screen.getByRole("region", { name: "表示レイヤー" });
    const signalsAction = screen.getByRole("button", { name: "シグナルを見る" });

    expect(screen.getAllByRole("combobox", { name: "テーマ" })).toHaveLength(1);
    expect(screen.getByRole("option", { name: "コメ" })).toBeTruthy();
    expect(screen.getAllByRole("region", { name: "いま表示中" })).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "対象範囲の要約" })).toBeNull();
    expect(screen.queryByText("35,056")).toBeNull();
    expect(screen.getByText("6,610,315")).toBeTruthy();
    expect(screen.getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText("監視インボックス")).toBeNull();
    expect(panel.querySelectorAll("[data-prefecture-row]")).toHaveLength(0);
    expect(themeSelect.compareDocumentPosition(activeSummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(activeSummary.compareDocumentPosition(layerRegion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(layerRegion.compareDocumentPosition(signalsAction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("renders the optional logistics route overview before active layer details", () => {
    const input = buildPanelInput();

    render(
      <ScopeContextPanel
        {...input}
        logisticsRouteOverview={<section aria-label="物流経路概要">物流経路スロット</section>}
      />
    );

    const overview = screen.getByRole("region", { name: "物流経路概要" });
    const activeSummary = screen.getByRole("region", { name: "いま表示中" });
    expect(overview.textContent).toBe("物流経路スロット");
    expect(overview.compareDocumentPosition(activeSummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("does not render an empty logistics overview container when the slot is omitted", () => {
    const input = buildPanelInput();

    render(<ScopeContextPanel {...input} />);

    expect(screen.queryByTestId("scope-logistics-route-overview")).toBeNull();
  });

  test("routes theme, semantic-layer, and secondary-view actions", async () => {
    const input = buildPanelInput();

    render(<ScopeContextPanel {...input} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "テーマ" }), "energy");
    await userEvent.click(screen.getByRole("button", { name: "価格" }));
    await userEvent.click(screen.getByRole("button", { name: "シグナルを見る" }));
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));

    expect(input.onThemeChange).toHaveBeenCalledOnce();
    expect(input.onThemeChange).toHaveBeenCalledWith("energy");
    expect(input.onLayerChange).toHaveBeenCalledWith("rice-price");
    expect(input.onOpenSignals).toHaveBeenCalledTimes(1);
    expect(input.onOpenComparison).toHaveBeenCalledTimes(1);
  });

  test("does not notify when the already-active theme is selected", async () => {
    const input = buildPanelInput();

    render(<ScopeContextPanel {...input} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "テーマ" }), "rice");

    expect(input.onThemeChange).not.toHaveBeenCalled();
  });

  test("preserves the supplied theme order in the native select", () => {
    const input = buildPanelInput("rice-harvest", ["water", "rice", "energy"]);

    render(<ScopeContextPanel {...input} />);

    const options = Array.from(
      screen.getByRole("combobox", { name: "テーマ" }).querySelectorAll("option")
    );
    expect(options.map((option) => option.value)).toEqual(["water", "rice", "energy"]);
    expect(options.map((option) => option.textContent)).toEqual(["水", "コメ", "エネルギー"]);
  });

  test.each([
    ["unavailable", "rice-logistics-inputs" as SemanticLayerId],
    ["missing", "missing-layer" as SemanticLayerId]
  ])("falls back from a %s requested layer to the first available layer", (_kind, activeLayerId) => {
    const input = buildPanelInput(activeLayerId);

    render(<ScopeContextPanel {...input} />);

    expect(screen.getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { level: 2, name: "収穫量" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "主食用米収穫量の凡例" })).toBeTruthy();
  });

  test("omits the active summary and forces comparison unavailable when every layer is unavailable", () => {
    const input = buildPanelInput();
    const unavailableWorkspace = {
      ...input.workspace,
      layers: input.workspace.layers.map((layer) => ({ ...layer, available: false }))
    };

    render(
      <ScopeContextPanel
        {...input}
        comparisonAvailable
        workspace={unavailableWorkspace}
      />
    );

    const layerButtons = screen.getByRole("group", { name: "表示レイヤー" }).querySelectorAll("button");
    expect(Array.from(layerButtons).every((button) => button.disabled)).toBe(true);
    expect(screen.queryByRole("region", { name: "いま表示中" })).toBeNull();
    expect(screen.queryByRole("region", { name: /凡例/ })).toBeNull();
    const comparison = screen.getByRole("button", { name: "比較可能な系列なし" });
    expect(comparison.hasAttribute("disabled")).toBe(true);
  });
});
