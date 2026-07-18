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
    detailPopup,
    mapMode,
    onMapModeChange,
    onOpenEvidence,
    onSelect
  }: {
    detailPopup?: unknown;
    mapMode: OperationMapMode;
    onMapModeChange?: (mode: OperationMapMode) => void;
    onOpenEvidence?: () => void;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="map" data-mode={mapMode}>
      {onMapModeChange ? (
        <div data-testid="map-layer-controls">
          <button type="button" onClick={() => onMapModeChange("cluster")}>
            集約
          </button>
        </div>
      ) : null}
      <button type="button" onClick={() => onSelect("prefecture:niigata")}>
        新潟県を選択
      </button>
      <button type="button" onClick={() => onSelect("flow:saudi-oil-japan")}>
        サウジ原油を選択
      </button>
      {detailPopup ? <div data-testid="map-detail-popup-anchor" /> : null}
      {onOpenEvidence ? <button data-testid="map-detail-open-evidence">根拠パネルを開く</button> : null}
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

describe("AppShell evidence wiring (real ContextInspector)", () => {
  test("uses one context inspector as the only detailed desktop selection surface", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    const desktop = screen.getByTestId("layout-desktop-workspace");
    expect(within(desktop).queryByTestId("context-inspector")).toBeNull();

    await user.click(within(desktop).getByRole("button", { name: "新潟県を選択" }));

    await waitFor(() => {
      expect(within(desktop).getAllByTestId("context-inspector")).toHaveLength(1);
    });
    expect(within(desktop).queryByTestId("map-detail-popup-anchor")).toBeNull();
    expect(within(desktop).queryByTestId("map-detail-open-evidence")).toBeNull();
    const inspector = within(desktop).getByTestId("context-inspector");
    expect(within(inspector).getByText("514,100")).toBeTruthy();
    expect(within(inspector).getByText("令和5年産")).toBeTruthy();
  });

  test("opens full evidence content in the desktop inspector on selection", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByTestId("layout-map-section")).toBeTruthy();
    expect(screen.getByTestId("layout-command-pane")).toBeTruthy();
    expect(screen.queryByTestId("layout-compare-drawer")).toBeNull();
    const desktop = screen.getByTestId("layout-desktop-workspace");
    expect(screen.getByTestId("layout-action-bar")).toBeTruthy();
    expect(within(screen.getByTestId("layout-action-bar")).queryByText("表示レイヤー")).toBeNull();
    expect(within(desktop).queryByTestId("map-layer-controls")).toBeNull();
    expect(screen.getAllByTestId("map-layer-controls")).toHaveLength(1);
    const mobileEvidence = screen.getByTestId("layout-evidence-drawer-mobile");
    expect(within(mobileEvidence).queryByRole("tablist")).toBeNull();
    expect(within(mobileEvidence).queryByRole("tab")).toBeNull();
    expect(within(mobileEvidence).getByRole("button", { name: "概要" })).toBeTruthy();

    expect(within(desktop).queryByTestId("context-inspector")).toBeNull();

    await user.click(within(desktop).getByRole("button", { name: "サウジ原油を選択" }));

    await waitFor(() => {
      expect(within(desktop).getByTestId("context-inspector")).toBeTruthy();
    });

    const inspector = within(desktop).getByTestId("context-inspector");
    expect(within(inspector).getByText("概要")).toBeTruthy();
    expect(within(inspector).getByText("出典")).toBeTruthy();
    expect(within(inspector).getByText("関連")).toBeTruthy();
    expect(within(inspector).getByText("日本にとっての意味")).toBeTruthy();
    expect(within(inspector).getAllByText(/サウジ原油/).length).toBeGreaterThan(0);

    await user.click(within(inspector).getByRole("tab", { name: "出典" }));
    expect(within(inspector).getAllByRole("link").length).toBeGreaterThan(0);
  });

  test("secondary signal selection also opens the real evidence surface", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    const desktop = screen.getByTestId("layout-desktop-workspace");
    await user.click(within(desktop).getByRole("button", { name: "シグナルを見る" }));
    const signals = within(desktop).getByTestId("signals-panel");
    await user.click(within(signals).getAllByRole("button")[1]);

    await waitFor(() => {
      expect(within(desktop).getByTestId("context-inspector")).toBeTruthy();
    });
  });
});
