// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildWorkspacePresentation } from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import { SemanticLayerDeck } from "../SemanticLayerDeck";

afterEach(cleanup);

function getRiceWorkspace() {
  const graph = loadSeedGraph();
  return buildWorkspacePresentation(graph, getThemeView(graph, "rice"));
}

describe("SemanticLayerDeck", () => {
  test("selects by semantic layer id and exposes the active layer", async () => {
    const onLayerChange = vi.fn();

    render(
      <SemanticLayerDeck
        activeLayerId="rice-harvest"
        layers={getRiceWorkspace().layers}
        onLayerChange={onLayerChange}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("group", { name: "表示レイヤー" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "価格" }));

    expect(onLayerChange).toHaveBeenCalledWith("rice-price");
  });

  test("marks unavailable layers as disabled without making render modes the primary copy", () => {
    render(
      <SemanticLayerDeck
        activeLayerId="rice-harvest"
        layers={getRiceWorkspace().layers}
        onLayerChange={vi.fn()}
        themePalette={getThemePalette("rice")}
      />
    );

    const unavailable = screen.getByRole("button", { name: /物流・投入コスト/ });
    expect((unavailable as HTMLButtonElement).disabled).toBe(true);
    expect(unavailable.textContent).toMatch(/準備中|データなし/);
    expect(screen.queryByText("point")).toBeNull();
    expect(screen.queryByText("choropleth")).toBeNull();
  });

  test("uses roving focus, skips disabled layers, and activates with keyboard", () => {
    const onLayerChange = vi.fn();

    render(
      <SemanticLayerDeck
        activeLayerId="rice-harvest"
        layers={getRiceWorkspace().layers}
        onLayerChange={onLayerChange}
        themePalette={getThemePalette("rice")}
      />
    );

    const harvest = screen.getByRole("button", { name: "収穫量" });
    const price = screen.getByRole("button", { name: "価格" });
    const inventory = screen.getByRole("button", { name: "在庫・政策" });

    expect(harvest.getAttribute("tabindex")).toBe("0");
    expect(price.getAttribute("tabindex")).toBe("-1");

    harvest.focus();
    fireEvent.keyDown(harvest, { key: "ArrowRight" });
    expect(document.activeElement).toBe(price);
    expect(harvest.getAttribute("tabindex")).toBe("-1");
    expect(price.getAttribute("tabindex")).toBe("0");

    fireEvent.keyDown(price, { key: "Enter" });
    expect(onLayerChange).toHaveBeenLastCalledWith("rice-price");

    fireEvent.keyDown(price, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(harvest);

    inventory.focus();
    fireEvent.keyDown(inventory, { key: "ArrowRight" });
    expect(document.activeElement).toBe(harvest);

    fireEvent.keyDown(harvest, { key: " " });
    expect(onLayerChange).toHaveBeenLastCalledWith("rice-harvest");
  });
});
