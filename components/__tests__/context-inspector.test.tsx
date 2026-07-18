// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { buildEvidenceGraph } from "../../lib/semantic/view-models";
import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import { buildSelectionInspector } from "../../lib/presentation/workspace";
import { getDetailView } from "../../lib/semantic/detail";
import { ContextInspector } from "../ContextInspector";

afterEach(() => {
  cleanup();
});

describe("ContextInspector", () => {
  test("shows the selection metric and preserves evidence tabs and interactions", async () => {
    const user = userEvent.setup();
    const graph = loadSeedGraph();
    const selectedId = "prefecture:niigata";
    const detail = getDetailView(graph, selectedId);
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <ContextInspector
        evidenceGraph={buildEvidenceGraph(graph, "rice")}
        inspector={buildSelectionInspector(graph, selectedId, detail)}
        onClose={onClose}
        onSelect={onSelect}
        selectedId={selectedId}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
        themeTitle="米"
      />
    );

    const inspector = screen.getByTestId("context-inspector");
    expect(inspector.getAttribute("aria-label")).toBe("選択中の詳細と根拠");
    expect(within(inspector).getByText("新潟県")).toBeTruthy();
    expect(within(inspector).getByText("514,100")).toBeTruthy();
    expect(within(inspector).getByText("トン")).toBeTruthy();
    expect(within(inspector).getByText("令和5年産")).toBeTruthy();
    expect(within(inspector).getByRole("tab", { name: "概要" })).toBeTruthy();
    expect(within(inspector).getByText("日本にとっての意味")).toBeTruthy();

    await user.click(within(inspector).getByRole("tab", { name: "出典" }));
    expect(within(inspector).getByRole("link", { name: /e-Stat/ })).toBeTruthy();

    await user.click(within(inspector).getByRole("tab", { name: "関連" }));
    const related = within(inspector).getAllByRole("button").find((button) =>
      button.getAttribute("aria-label")?.startsWith("根拠ノード ")
    );
    expect(related).toBeTruthy();
    await user.click(related as HTMLElement);
    expect(onSelect).toHaveBeenCalled();

    await user.click(within(inspector).getByRole("button", { name: "詳細を閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("exposes linked tabs and moves active focus with keyboard navigation", async () => {
    const user = userEvent.setup();
    const graph = loadSeedGraph();
    const selectedId = "prefecture:niigata";

    render(
      <ContextInspector
        evidenceGraph={buildEvidenceGraph(graph, "rice")}
        inspector={buildSelectionInspector(graph, selectedId, getDetailView(graph, selectedId))}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        selectedId={selectedId}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
        themeTitle="米"
      />
    );

    const inspector = screen.getByTestId("context-inspector");
    expect(within(inspector).getByRole("tablist", { name: "詳細セクション" })).toBeTruthy();
    const summaryTab = within(inspector).getByRole("tab", { name: "概要" });
    const sourcesTab = within(inspector).getByRole("tab", { name: "出典" });
    const relatedTab = within(inspector).getByRole("tab", { name: "関連" });
    const controlledPanelIds = [summaryTab, sourcesTab, relatedTab].map((tab) => tab.getAttribute("aria-controls"));

    expect(controlledPanelIds.every(Boolean)).toBe(true);
    expect(new Set(controlledPanelIds).size).toBe(3);
    expect(summaryTab.getAttribute("aria-selected")).toBe("true");
    expect(summaryTab.getAttribute("tabindex")).toBe("0");
    expect(sourcesTab.getAttribute("aria-selected")).toBe("false");
    expect(sourcesTab.getAttribute("tabindex")).toBe("-1");

    const summaryPanel = within(inspector).getByRole("tabpanel");
    expect(summaryTab.id).toBeTruthy();
    expect(summaryTab.getAttribute("aria-controls")).toBe(summaryPanel.id);
    expect(summaryPanel.getAttribute("aria-labelledby")).toBe(summaryTab.id);

    summaryTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(sourcesTab);
    expect(sourcesTab.getAttribute("aria-selected")).toBe("true");
    const sourcesPanel = within(inspector).getByRole("tabpanel");
    expect(sourcesTab.getAttribute("aria-controls")).toBe(sourcesPanel.id);
    expect(sourcesPanel.getAttribute("aria-labelledby")).toBe(sourcesTab.id);

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(relatedTab);
    expect(relatedTab.getAttribute("aria-selected")).toBe("true");
    const relatedPanel = within(inspector).getByRole("tabpanel");
    expect(relatedTab.getAttribute("aria-controls")).toBe(relatedPanel.id);
    expect(relatedPanel.getAttribute("aria-labelledby")).toBe(relatedTab.id);

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(summaryTab);
    expect(summaryTab.getAttribute("aria-selected")).toBe("true");

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(relatedTab);
    expect(relatedTab.getAttribute("aria-selected")).toBe("true");
  });
});
