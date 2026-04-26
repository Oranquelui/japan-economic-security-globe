// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import type { ThemeId } from "../../types/semantic";
import type { OperationMapMode } from "../../lib/presentation/operations";
import { HOMEPAGE_NOTICE_STORAGE_KEY } from "../InitialNoticeModal";
import type { RankingSignal } from "../../types/ranking";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("../MapInboxPanel", () => ({
  MapInboxPanel: ({
    onSelect
  }: {
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="inbox">
      <button type="button" onClick={() => onSelect("observation:rice-price-signal-2026")}>
        select-rice-from-inbox
      </button>
    </div>
  )
}));

vi.mock("../NavigationRail", () => ({
  NavigationRail: ({
    isInboxOpen,
    onCloseInbox,
    onOpenInbox,
    onThemeChange,
    themeId
  }: {
    isInboxOpen: boolean;
    onCloseInbox: () => void;
    onOpenInbox: () => void;
    onThemeChange: (themeId: ThemeId) => void;
    themeId: ThemeId;
  }) => (
    <div data-testid="nav-rail" data-theme={themeId}>
      {isInboxOpen ? (
        <button type="button" aria-label="監視インボックスを閉じる" onClick={onCloseInbox}>
          close-inbox
        </button>
      ) : (
        <button type="button" aria-label="監視インボックスを開く" onClick={onOpenInbox}>
          open-inbox
        </button>
      )}
      <button type="button" onClick={() => onThemeChange("rice")}>
        change-theme-rice
      </button>
    </div>
  )
}));

vi.mock("../JapanMainMap", () => ({
  JapanMainMap: ({
    activeId,
    focusTargetId,
    mapMode
  }: {
    activeId: string;
    focusTargetId: string | null;
    mapMode: OperationMapMode;
  }) => (
    <div data-testid="map" data-active={activeId} data-focus={focusTargetId ?? ""} data-mode={mapMode}>
      mocked-map
    </div>
  )
}));

vi.mock("../EvidencePanel", () => ({
  EvidencePanel: ({
    collapsed,
    rankingExplanation
  }: {
    collapsed: boolean;
    rankingExplanation?: { rankLabel?: string } | null;
  }) => (
    <div
      data-testid="evidence"
      data-collapsed={collapsed ? "yes" : "no"}
      data-ranking={rankingExplanation?.rankLabel ?? ""}
    />
  )
}));

vi.mock("../OperationsSignalTable", () => ({
  OperationsSignalTable: ({ collapsed, onSelect }: { collapsed: boolean; onSelect: (id: string) => void }) => (
    <div data-testid="grid" data-collapsed={collapsed ? "yes" : "no"}>
      <button type="button" onClick={() => onSelect("observation:rice-price-signal-2026")}>
        select-rice-observation
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

describe("AppShell url sync", () => {
  test("renders the shell as header plus full map stage with overlaid navigation, evidence, and comparison", () => {
    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByTestId("layout-navigation-rail")).toBeTruthy();
    expect(screen.getByTestId("layout-left-nav")).toBeTruthy();
    expect(screen.getByTestId("layout-map-section")).toBeTruthy();
    expect(screen.getByTestId("layout-compare-overlay")).toBeTruthy();
    expect(screen.getByTestId("layout-evidence-overlay")).toBeTruthy();
    expect(screen.getAllByTestId("evidence")[0].getAttribute("data-collapsed")).toBe("no");
    expect(screen.getAllByTestId("grid")[0].getAttribute("data-collapsed")).toBe("no");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("shows the initial notice only when homepage mode is app", async () => {
    render(<AppShell graph={loadSeedGraph()} homepageMode="app" locale="ja" />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    expect(screen.getByText("MVP/テスト運用中")).toBeTruthy();
    expect(screen.getByText("更新: 監視インボックスの開閉操作を修正しました")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "お知らせを閉じる" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    expect(window.localStorage.getItem(HOMEPAGE_NOTICE_STORAGE_KEY)).toBe("dismissed");
  });

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

    expect(screen.getAllByTestId("nav-rail")[0].getAttribute("data-theme")).toBe("rice");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("cluster");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("observation:rice-price-signal-2026");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("observation:rice-price-signal-2026");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("keeps Japan-first default mode and does not focus the fallback active item on first load", () => {
    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("point");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("flow:saudi-oil-japan");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("");
  });

  test("disables pointer hits on the closed inbox pane and reopens it from the rail toggle", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByTestId("layout-left-nav")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "監視インボックスを閉じる" }));

    expect(screen.queryByTestId("layout-left-nav")).toBeNull();

    await user.click(screen.getByRole("button", { name: "監視インボックスを開く" }));

    expect(screen.getByTestId("layout-left-nav")).toBeTruthy();
  });

  test("uses the homepage ranking lead when the URL did not explicitly pin a theme", () => {
    const rankingSignals: RankingSignal[] = [
      {
        id: "ranking-signal:rice-lead",
        label: "Rice lead",
        importanceAxes: ["food", "household_cost"],
        canonicalRefs: [{ kind: "observation", id: "observation:rice-price-signal-2026" }],
        sourceIds: ["source:maff-rice-policy"],
        componentInputs: {
          nationalImportance: 0.99,
          disruptionDepth: 0.88,
          sourceConfidence: 0.95,
          publicAttention: 0.4
        },
        retrievedAt: "2026-04-25T00:00:00.000Z"
      }
    ];

    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState={false}
        rankingSignals={rankingSignals}
      />
    );

    expect(screen.getAllByTestId("nav-rail")[0].getAttribute("data-theme")).toBe("rice");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("observation:rice-price-signal-2026");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("observation:rice-price-signal-2026");
  });

  test("passes ranking explanation to the evidence panel for the selected ranked item", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        rankingSignals={[
          {
            id: "ranking-signal:energy-middle-east-route",
            label: "Energy lead",
            importanceAxes: ["energy"],
            canonicalRefs: [{ kind: "flow", id: "flow:saudi-oil-japan" }],
            sourceIds: ["source:enecho-energy-trends"],
            componentInputs: {
              nationalImportance: 0.98,
              disruptionDepth: 0.88,
              sourceConfidence: 0.9,
              publicAttention: 0.45
            },
            retrievedAt: "2026-04-25T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getAllByTestId("evidence")[0].getAttribute("data-ranking")).toBe("#1");
  });

  test("replaces the URL when theme, map mode, and selection change", async () => {
    render(<AppShell graph={loadSeedGraph()} />);

    fireEvent.click(screen.getAllByText("change-theme-rice")[0]);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith("/?theme=rice", { scroll: false });
    });

    fireEvent.click(screen.getByRole("button", { name: "集約" }));
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
