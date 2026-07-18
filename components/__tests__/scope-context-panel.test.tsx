// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildWorkspacePresentation } from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import { ScopeContextPanel } from "../ScopeContextPanel";

afterEach(cleanup);

describe("ScopeContextPanel", () => {
  test("shows the rice scope before semantic layers and ranked-content actions", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const workspace = buildWorkspacePresentation(graph, view);

    render(
      <ScopeContextPanel
        activeLayerId="rice-harvest"
        onLayerChange={vi.fn()}
        onOpenComparison={vi.fn()}
        onOpenSignals={vi.fn()}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
        workspace={workspace}
      />
    );

    const panel = screen.getByTestId("scope-context-panel");
    expect(screen.getByText("47都道府県")).toBeTruthy();
    expect(screen.getByText("6,610,315")).toBeTruthy();
    expect(screen.getAllByText("令和5年産").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText("監視インボックス")).toBeNull();
    expect(panel.querySelectorAll("[data-prefecture-row]")).toHaveLength(0);

    const text = panel.textContent ?? "";
    expect(text.indexOf(workspace.scope.description)).toBeLessThan(text.indexOf("収穫量"));
    expect(text.indexOf("収穫量")).toBeLessThan(text.indexOf("主食用米収穫量"));
    expect(text.indexOf("主食用米収穫量")).toBeLessThan(text.indexOf("シグナルを見る"));
  });

  test("routes semantic-layer and secondary-view actions", async () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const onLayerChange = vi.fn();
    const onOpenSignals = vi.fn();
    const onOpenComparison = vi.fn();

    render(
      <ScopeContextPanel
        activeLayerId="rice-harvest"
        onLayerChange={onLayerChange}
        onOpenComparison={onOpenComparison}
        onOpenSignals={onOpenSignals}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
        workspace={buildWorkspacePresentation(graph, view)}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "価格" }));
    await userEvent.click(screen.getByRole("button", { name: "シグナルを見る" }));
    await userEvent.click(screen.getByRole("button", { name: "比較する" }));

    expect(onLayerChange).toHaveBeenCalledWith("rice-price");
    expect(onOpenSignals).toHaveBeenCalledTimes(1);
    expect(onOpenComparison).toHaveBeenCalledTimes(1);
  });
});
