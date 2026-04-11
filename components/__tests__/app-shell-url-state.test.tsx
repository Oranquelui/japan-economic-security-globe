// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  MapInboxPanel: ({
    onSelect,
    onThemeChange,
    themeId
  }: {
    onSelect: (id: string) => void;
    onThemeChange: (themeId: ThemeId) => void;
    themeId: ThemeId;
  }) => (
    <div data-testid="inbox" data-theme={themeId}>
      <button type="button" onClick={() => onThemeChange("rice")}>
        change-theme-rice
      </button>
      <button type="button" onClick={() => onSelect("observation:rice-price-signal-2026")}>
        select-rice-observation
      </button>
    </div>
  )
}));

vi.mock("../JapanMainMap", () => ({
  JapanMainMap: ({
    activeId,
    focusTargetId,
    mapMode,
    onMapModeChange
  }: {
    activeId: string;
    focusTargetId: string | null;
    mapMode: OperationMapMode;
    onMapModeChange: (mode: OperationMapMode) => void;
  }) => (
    <div data-testid="map" data-active={activeId} data-focus={focusTargetId ?? ""} data-mode={mapMode}>
      mocked-map
      <button type="button" onClick={() => onMapModeChange("cluster")}>
        change-mode-cluster
      </button>
    </div>
  )
}));

vi.mock("../EvidencePanel", () => ({
  EvidencePanel: () => <div data-testid="evidence" />
}));

vi.mock("../OperationsSignalTable", () => ({
  OperationsSignalTable: () => <div data-testid="grid" />
}));

import { AppShell } from "../AppShell";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  replaceMock.mockReset();
});

describe("AppShell url sync", () => {
  test("hydrates initial state from the provided url state", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        initialUrlState={{
          themeId: "rice",
          mapMode: "cluster",
          selectedId: "observation:rice-price-signal-2026"
        }}
      />
    );

    expect(screen.getAllByTestId("inbox")[0].getAttribute("data-theme")).toBe("rice");
    expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("cluster");
    expect(screen.getByTestId("map").getAttribute("data-active")).toBe("observation:rice-price-signal-2026");
    expect(screen.getByTestId("map").getAttribute("data-focus")).toBe("observation:rice-price-signal-2026");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("keeps Japan-first default mode and does not focus the fallback active item on first load", () => {
    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("point");
    expect(screen.getByTestId("map").getAttribute("data-active")).toBe("flow:saudi-oil-japan");
    expect(screen.getByTestId("map").getAttribute("data-focus")).toBe("");
  });

  test("replaces the URL when theme, map mode, and selection change", async () => {
    render(<AppShell graph={loadSeedGraph()} />);

    fireEvent.click(screen.getAllByText("change-theme-rice")[0]);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith("/?theme=rice", { scroll: false });
    });

    fireEvent.click(screen.getByText("change-mode-cluster"));
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith("/?theme=rice&mode=cluster", { scroll: false });
    });

    fireEvent.click(screen.getAllByText("select-rice-observation")[0]);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith(
        "/?theme=rice&mode=cluster&selected=observation%3Arice-price-signal-2026",
        { scroll: false }
      );
    });
  });
});
