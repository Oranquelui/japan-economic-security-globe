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
    expect(within(inspector).getByRole("button", { name: "概要" })).toBeTruthy();
    expect(within(inspector).getByText("日本にとっての意味")).toBeTruthy();

    await user.click(within(inspector).getByRole("button", { name: "出典" }));
    expect(within(inspector).getByRole("link", { name: /e-Stat/ })).toBeTruthy();

    await user.click(within(inspector).getByRole("button", { name: "関連" }));
    const related = within(inspector).getAllByRole("button").find((button) =>
      button.getAttribute("aria-label")?.startsWith("根拠ノード ")
    );
    expect(related).toBeTruthy();
    await user.click(related as HTMLElement);
    expect(onSelect).toHaveBeenCalled();

    await user.click(within(inspector).getByRole("button", { name: "詳細を閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
