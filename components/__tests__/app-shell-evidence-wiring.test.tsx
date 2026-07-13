// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import type { ThemeId } from "../../types/semantic";
import type { OperationMapMode } from "../../lib/presentation/operations";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("../MapInboxPanel", () => ({
  MapInboxPanel: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div data-testid="inbox">
      <button type="button" onClick={() => onSelect("flow:saudi-oil-japan")}>
        select-energy-from-inbox
      </button>
    </div>
  )
}));

vi.mock("../NavigationRail", () => ({
  NavigationRail: ({
    themeId
  }: {
    themeId: ThemeId;
  }) => <div data-testid="nav-rail" data-theme={themeId} />
}));

vi.mock("../JapanMainMap", () => ({
  JapanMainMap: ({
    mapMode,
    onMapModeChange
  }: {
    mapMode: OperationMapMode;
    onMapModeChange?: (mode: OperationMapMode) => void;
  }) => (
    <div data-testid="map" data-mode={mapMode}>
      <div data-testid="map-layer-controls">
        <button type="button" onClick={() => onMapModeChange?.("cluster")}>
          集約
        </button>
      </div>
    </div>
  )
}));

vi.mock("../OperationsSignalTable", () => ({
  OperationsSignalTable: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div data-testid="grid">
      <button type="button" onClick={() => onSelect("flow:saudi-oil-japan")}>
        select-energy-from-table
      </button>
    </div>
  )
}));

import { AppShell } from "../AppShell";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  replaceMock.mockReset();
  window.localStorage.clear();
});

describe("AppShell evidence wiring (real EvidencePanel)", () => {
  test("mounts EvidencePanel in the live shell and opens full evidence content on selection", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByTestId("layout-map-section")).toBeTruthy();
    expect(screen.getByTestId("layout-command-pane")).toBeTruthy();
    expect(screen.getByTestId("layout-compare-drawer")).toBeTruthy();
    expect(screen.getByTestId("layout-evidence-drawer")).toBeTruthy();
    expect(screen.getByTestId("layout-action-bar")).toBeTruthy();
    expect(within(screen.getByTestId("layout-action-bar")).queryByText("表示レイヤー")).toBeNull();
    expect(screen.getAllByTestId("map-layer-controls").length).toBeGreaterThan(0);

    const collapsedEvidence = screen.getAllByTestId("evidence-panel").find((node) => node.getAttribute("data-collapsed") === "yes");
    expect(collapsedEvidence).toBeTruthy();

    await user.click(screen.getAllByText("select-energy-from-inbox")[0]);

    await waitFor(() => {
      expect(
        screen.getAllByTestId("evidence-panel").some((node) => node.getAttribute("data-collapsed") === "no")
      ).toBe(true);
    });

    const openPanel = screen.getAllByTestId("evidence-panel").find((node) => node.getAttribute("data-collapsed") === "no");
    expect(openPanel).toBeTruthy();
    expect(within(openPanel as HTMLElement).getByText("根拠")).toBeTruthy();
    expect(within(openPanel as HTMLElement).getByText("概要")).toBeTruthy();
    expect(within(openPanel as HTMLElement).getByText("出典")).toBeTruthy();
    expect(within(openPanel as HTMLElement).getByText("関連")).toBeTruthy();
    expect(within(openPanel as HTMLElement).getByText("日本にとっての意味")).toBeTruthy();
    expect(within(openPanel as HTMLElement).getAllByText(/サウジ原油/).length).toBeGreaterThan(0);

    await user.click(within(openPanel as HTMLElement).getByRole("button", { name: "出典" }));
    expect(within(openPanel as HTMLElement).getAllByRole("link").length).toBeGreaterThan(0);
  });

  test("table selection also opens the real evidence surface", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    await user.click(screen.getAllByText("select-energy-from-table")[0]);

    await waitFor(() => {
      expect(
        screen.getAllByTestId("evidence-panel").some((node) => node.getAttribute("data-collapsed") === "no")
      ).toBe(true);
    });
  });
});
