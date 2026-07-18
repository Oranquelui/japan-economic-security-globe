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
    briefing,
    liveLogistics,
    onSelect
  }: {
    briefing?: { strategicQuestion: string } | null;
    liveLogistics?: { items: unknown[] } | null;
    onSelect: (id: string) => void;
  }) => (
    <div data-testid="inbox">
      {briefing ? <div data-testid="inbox-watchboard">{briefing.strategicQuestion}</div> : null}
      {liveLogistics ? <div data-testid="inbox-live-logistics" data-count={liveLogistics.items.length} /> : null}
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
    detailPopup,
    focusTargetId,
    mapMode,
    model,
    onMapModeChange,
    onOpenEvidence,
    overlayInsets,
    watchOverlays = []
  }: {
    activeId: string;
    detailPopup?: {
      detail: { label: string };
      anchor?: { placement: string; x: number; y: number } | null;
      rankingExplanation?: { rankLabel?: string } | null;
    } | null;
    focusTargetId: string | null;
    mapMode: OperationMapMode;
    model?: { liveRoutes?: unknown[] };
    onMapModeChange?: (mode: OperationMapMode) => void;
    onOpenEvidence?: () => void;
    overlayInsets?: { right: number };
    watchOverlays?: unknown[];
  }) => (
    <div
      data-testid="map"
      data-active={activeId}
      data-detail-popup={detailPopup?.detail.label ?? ""}
      data-popup-anchor={detailPopup?.anchor ? `${detailPopup.anchor.placement}:${detailPopup.anchor.x}:${detailPopup.anchor.y}` : ""}
      data-focus={focusTargetId ?? ""}
      data-live-routes={model?.liveRoutes?.length ?? 0}
      data-mode={mapMode}
      data-overlay-right={overlayInsets?.right ?? ""}
      data-ranking={detailPopup?.rankingExplanation?.rankLabel ?? ""}
      data-watch-overlays={watchOverlays.length}
    >
      <div data-testid="map-layer-controls">
        <button type="button" onClick={() => onMapModeChange?.("cluster")}>
          集約
        </button>
        <button type="button" onClick={() => onMapModeChange?.("point")}>
          地点
        </button>
      </div>
      {detailPopup && onOpenEvidence ? (
        <button type="button" onClick={onOpenEvidence}>
          根拠パネルを開く
        </button>
      ) : null}
      mocked-map
    </div>
  )
}));

vi.mock("../EvidencePanel", () => ({
  EvidencePanel: ({
    collapsed,
    detail,
    rankingExplanation
  }: {
    collapsed: boolean;
    detail?: {
      summary?: string;
      whyItMatters?: string;
      sources?: unknown[];
      relatedEntities?: unknown[];
    };
    rankingExplanation?: { rankLabel?: string } | null;
  }) => (
    <div
      data-testid="evidence"
      data-collapsed={collapsed ? "yes" : "no"}
      data-ranking={rankingExplanation?.rankLabel ?? ""}
      data-summary={detail?.summary ?? ""}
      data-why={detail?.whyItMatters ?? ""}
      data-sources={detail?.sources?.length ?? 0}
      data-related={detail?.relatedEntities?.length ?? 0}
    >
      {!collapsed ? (
        <>
          <div data-testid="evidence-summary">{detail?.summary ?? ""}</div>
          <div data-testid="evidence-why">日本にとっての意味: {detail?.whyItMatters ?? ""}</div>
          <div data-testid="evidence-sources">出典 {detail?.sources?.length ?? 0}</div>
          <div data-testid="evidence-related">関連 {detail?.relatedEntities?.length ?? 0}</div>
        </>
      ) : null}
    </div>
  )
}));

vi.mock("../ContextInspector", () => ({
  ContextInspector: ({
    inspector,
    onClose,
    rankingExplanation,
    themeTitle
  }: {
    inspector: {
      detail: {
        id: string;
        summary?: string;
        whyItMatters?: string;
        sources?: unknown[];
        relatedEntities?: unknown[];
      };
      primaryMetric?: { valueLabel: string; periodLabel?: string } | null;
    };
    onClose: () => void;
    rankingExplanation?: { rankLabel?: string } | null;
    themeTitle: string;
  }) => (
    <aside
      aria-label="選択中の詳細と根拠"
      data-testid="context-inspector"
      data-id={inspector.detail.id}
      data-period={inspector.primaryMetric?.periodLabel ?? ""}
      data-ranking={rankingExplanation?.rankLabel ?? ""}
      data-summary={inspector.detail.summary ?? ""}
      data-theme={themeTitle}
      data-value={inspector.primaryMetric?.valueLabel ?? ""}
    >
      <button type="button" aria-label="詳細を閉じる" onClick={onClose}>
        close-inspector
      </button>
    </aside>
  )
}));

vi.mock("../OperationsSignalTable", () => ({
  OperationsSignalTable: ({
    collapsed,
    onSelect,
    onToggleCollapsed
  }: {
    collapsed: boolean;
    onSelect: (id: string) => void;
    onToggleCollapsed: () => void;
  }) => (
    <div data-testid="grid" data-collapsed={collapsed ? "yes" : "no"}>
      <button type="button" onClick={onToggleCollapsed}>
        toggle-grid
      </button>
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
  test("renders the shell as a command pane, full map stage, evidence drawer, and collapsed compare drawer", () => {
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

    const shell = screen.getByRole("main");
    const actionBar = screen.getByTestId("layout-action-bar");
    const desktopWorkspace = screen.getByTestId("layout-desktop-workspace");
    const workspaceScroll = screen.getByTestId("layout-workspace-scroll");
    const stackedWorkspace = screen.getByTestId("layout-stacked-workspace");

    expect(shell.className).toContain("xl:grid");
    expect(shell.className).toContain("xl:grid-rows-[56px,auto,minmax(0,1fr)]");
    expect(shell.className).not.toContain("lg:grid");
    expect(actionBar.className).toContain("hidden");
    expect(actionBar.className).toContain("xl:flex");
    expect(actionBar.className).not.toContain("lg:flex");
    expect(workspaceScroll.className).toContain("xl:overflow-hidden");
    expect(workspaceScroll.className).not.toContain("lg:overflow-hidden");
    expect(desktopWorkspace.className).toContain("hidden");
    expect(desktopWorkspace.className).toContain("xl:block");
    expect(desktopWorkspace.className).not.toContain("lg:block");
    expect(stackedWorkspace.className).toContain("xl:hidden");
    expect(stackedWorkspace.className).not.toContain("lg:hidden");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(actionBar).toBeTruthy();
    expect(screen.getByRole("status", { name: "出典状態" })).toBeTruthy();
    expect(screen.getByTestId("layout-navigation-rail")).toBeTruthy();
    expect(screen.getByTestId("layout-command-pane")).toBeTruthy();
    expect(screen.getByTestId("layout-map-section")).toBeTruthy();
    expect(screen.queryByTestId("layout-watchboard-overlay")).toBeNull();
    expect(screen.getByTestId("inbox-watchboard")).toBeTruthy();
    expect(screen.getAllByTestId("map")[0].getAttribute("data-watch-overlays")).toBe("0");
    expect(screen.getByTestId("layout-compare-drawer")).toBeTruthy();
    expect(screen.queryByTestId("layout-context-inspector")).toBeNull();
    expect(screen.queryByTestId("context-inspector")).toBeNull();
    expect(screen.getAllByTestId("map")[0].getAttribute("data-overlay-right")).toBe("16");
    // Homepage ranking lead may pin a selection for map focus without opening evidence.
    expect(screen.getAllByTestId("grid")[0].getAttribute("data-collapsed")).toBe("yes");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(withinActionBar().queryByText("表示レイヤー")).toBeNull();
    expect(screen.getAllByTestId("map-layer-controls").length).toBeGreaterThan(0);
  });

  test("shows the initial notice only when homepage mode is app", async () => {
    render(<AppShell graph={loadSeedGraph()} homepageMode="app" locale="ja" />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "MVP/テスト運用中" })).toBeTruthy();
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("MVP/テスト運用中")).toBeTruthy();
    expect(screen.getByText("更新: 国内物流監視と地形地図を追加しました")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "お知らせを閉じる" }));

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "MVP/テスト運用中" })).toBeNull();
    });

    expect(window.localStorage.getItem(HOMEPAGE_NOTICE_STORAGE_KEY)).toBe("dismissed");
  });

  test("hydrates initial state from the provided url state", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "rice",
          selectedId: "observation:rice-price-signal-2026",
          layerId: "rice-harvest",
          mapModeOverride: "cluster",
          workspaceView: "signals"
        }}
      />
    );

    expect(screen.getAllByTestId("nav-rail")[0].getAttribute("data-theme")).toBe("rice");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("cluster");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("observation:rice-price-signal-2026");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("observation:rice-price-signal-2026");
    expect(screen.getByTestId("context-inspector").getAttribute("data-id")).toBe("observation:rice-price-signal-2026");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("uses the default semantic layer mode and does not focus the fallback active item on first load", () => {
    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("choropleth");
    // Public spine default theme is rice; first selectable rice signal/entity is the fallback active.
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toMatch(/^(observation:|flow:|prefecture:|product:)/);
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("");
  });

  test("disables pointer hits on the closed inbox pane and reopens it from the rail toggle", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getByTestId("layout-command-pane")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "監視インボックスを閉じる" }));

    expect(screen.queryByTestId("layout-command-pane")).toBeNull();

    await user.click(screen.getByRole("button", { name: "監視インボックスを開く" }));

    expect(screen.getByTestId("layout-command-pane")).toBeTruthy();
  });

  test("opens the compare drawer only after an explicit toggle", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.getAllByTestId("grid")[0].getAttribute("data-collapsed")).toBe("yes");

    await user.click(screen.getAllByText("toggle-grid")[0]);

    expect(screen.getAllByTestId("grid")[0].getAttribute("data-collapsed")).toBe("no");
  });

  test("hydrates the comparison workspace view from URL state", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "rice",
          selectedId: null,
          layerId: "rice-price",
          mapModeOverride: null,
          workspaceView: "comparison"
        }}
      />
    );

    expect(screen.getAllByTestId("grid")[0].getAttribute("data-collapsed")).toBe("no");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("point");
    expect(replaceMock).not.toHaveBeenCalled();
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
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toMatch(/rice|observation:rice/);
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toMatch(/rice|observation:rice|^$/);
    expect(screen.queryByTestId("context-inspector")).toBeNull();
  });

  test("uses the ranked theme default layer instead of carrying the rice layer", () => {
    const rankingSignals: RankingSignal[] = [
      {
        id: "ranking-signal:water-lead",
        label: "Water lead",
        importanceAxes: ["disaster_infrastructure"],
        canonicalRefs: [{ kind: "observation", id: "observation:ogochi-reservoir-stress" }],
        sourceIds: ["source:mlit-drought-portal"],
        componentInputs: {
          nationalImportance: 0.99,
          disruptionDepth: 0.9,
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

    expect(screen.getAllByTestId("nav-rail")[0].getAttribute("data-theme")).toBe("water");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("choropleth");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("observation:ogochi-reservoir-stress");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("passes ranking explanation to the context inspector for the selected ranked item", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "energy",
          selectedId: "flow:saudi-oil-japan",
          layerId: "energy-route",
          mapModeOverride: "route",
          workspaceView: "map"
        }}
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

    expect(screen.getByTestId("context-inspector").getAttribute("data-ranking")).toBe("#1");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-detail-popup")).toBe("");
  });

  test("passes live logistics into the command pane and map model", () => {
    const AppShellWithLiveLogistics = AppShell as any;

    render(
      <AppShellWithLiveLogistics
        graph={loadSeedGraph()}
        initialUrlState={{
          themeId: "logistics",
          selectedId: "flow:japan-linked-maritime-watch",
          layerId: "logistics-domestic",
          mapModeOverride: "route",
          workspaceView: "map"
        }}
        liveLogisticsEvents={[
          {
            id: "live-logistics:tanker-qatar-tokyo-bay",
            themeIds: ["logistics", "energy"],
            title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
            kindLabel: "AIS tanker",
            statusLabel: "Underway",
            lastSeenAt: "2026-05-11T00:00:00.000Z",
            etaLabel: "ETA 42h",
            sourceLabel: "AIS demo fixture (supporting context)",
            disclosureLabel: "15-60分遅延 / aggregated vessel signal",
            confidenceLabel: "集約信号",
            corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
            pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
            relatedIds: ["flow:japan-linked-maritime-watch"],
            signalTone: "watch"
          }
        ]}
      />
    );

    expect(screen.getAllByTestId("inbox-live-logistics").map((element) => element.getAttribute("data-count"))).toEqual(["1", "1"]);
    expect(screen.getAllByTestId("map")[0].getAttribute("data-live-routes")).toBe("1");
  });

  test("uses domestic logistics as the default active item when the logistics URL has no selected item", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "logistics",
          selectedId: null,
          layerId: "logistics-domestic",
          mapModeOverride: "route",
          workspaceView: "map"
        }}
        liveLogisticsEvents={[
          {
            id: "live-logistics:tanker-qatar-tokyo-bay",
            themeIds: ["logistics", "energy"],
            title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
            kindLabel: "AIS tanker",
            laneId: "maritime",
            statusLabel: "Underway",
            lastSeenAt: "2026-05-11T00:00:00.000Z",
            etaLabel: "ETA 42h",
            sourceLabel: "AIS demo fixture (supporting context)",
            disclosureLabel: "15-60分遅延 / aggregated vessel signal",
            confidenceLabel: "集約信号",
            corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
            pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
            relatedIds: ["flow:japan-linked-maritime-watch"],
            signalTone: "watch",
            priority: 98
          },
          {
            id: "live-logistics:road-keihin-tokyo",
            themeIds: ["logistics", "energy"],
            title: "陸路: 横浜港・京浜 → 首都圏配送",
            kindLabel: "道路物流",
            laneId: "road",
            statusLabel: "接続監視",
            lastSeenAt: "2026-05-11T00:00:00.000Z",
            etaLabel: "次回更新 15分",
            sourceLabel: "Domestic logistics demo fixture (public route-level)",
            disclosureLabel: "公開系統 / route-level only",
            confidenceLabel: "デモ / 公開粒度",
            corridorLabel: "Yokohama → Keihin/Sodegaura → Tokyo",
            pointIds: ["port:yokohama", "refinery:keihin", "terminal:sodegaura-lng"],
            relatedIds: ["flow:japan-linked-maritime-watch"],
            signalTone: "monitoring",
            priority: 94
          }
        ]}
      />
    );

    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("live-logistics:road-keihin-tokyo");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-focus")).toBe("");
  });

  test("keeps an individual live tanker selection and maps it to a safe inspector detail", () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "logistics",
          selectedId: "live-logistics:tanker-qatar-tokyo-bay",
          layerId: "logistics-domestic",
          mapModeOverride: "route",
          workspaceView: "map"
        }}
        liveLogisticsEvents={[
          {
            id: "live-logistics:tanker-qatar-tokyo-bay",
            themeIds: ["logistics", "energy"],
            title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
            kindLabel: "AIS tanker",
            statusLabel: "Underway",
            lastSeenAt: "2026-05-11T00:00:00.000Z",
            etaLabel: "ETA 42h",
            sourceLabel: "AIS demo fixture (supporting context)",
            disclosureLabel: "15-60分遅延 / aggregated vessel signal",
            confidenceLabel: "集約信号",
            corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
            pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
            relatedIds: ["flow:japan-linked-maritime-watch"],
            signalTone: "watch"
          }
        ]}
      />
    );

    expect(screen.getAllByTestId("map")[0].getAttribute("data-active")).toBe("live-logistics:tanker-qatar-tokyo-bay");
    expect(screen.getByTestId("context-inspector").getAttribute("data-id")).toBe("live-logistics:tanker-qatar-tokyo-bay");
    expect(screen.getByTestId("context-inspector").getAttribute("data-summary")).toBeTruthy();
    expect(screen.getAllByTestId("map")[0].getAttribute("data-detail-popup")).toBe("");
  });

  test("normalizes an unavailable runtime layer to the theme default", async () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "rice",
          selectedId: null,
          layerId: "rice-logistics-inputs",
          mapModeOverride: null,
          workspaceView: "map"
        }}
      />
    );

    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("choropleth");
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith("/", { scroll: false });
    });
  });

  test("replaces the URL when theme, legacy map mode, and selection change", async () => {
    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "energy",
          selectedId: null,
          layerId: "energy-supply",
          mapModeOverride: null,
          workspaceView: "signals"
        }}
      />
    );

    fireEvent.click(screen.getAllByText("change-theme-rice")[0]);
    await waitFor(() => {
      // rice is the public default theme, so theme=rice is omitted from the URL.
      expect(replaceMock).toHaveBeenLastCalledWith("/", { scroll: false });
    });

    fireEvent.click(screen.getAllByRole("button", { name: "集約" })[0]);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith("/?mode=cluster", { scroll: false });
    });

    fireEvent.click(screen.getAllByText("select-rice-observation")[0]);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenLastCalledWith(
        "/?mode=cluster&selected=observation%3Arice-price-signal-2026",
        { scroll: false }
      );
    });
  });

  test("opens the desktop context inspector after inbox selection", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    expect(screen.queryByTestId("context-inspector")).toBeNull();

    await user.click(screen.getAllByText("select-rice-from-inbox")[0]);

    await waitFor(() => {
      expect(screen.getByTestId("context-inspector")).toBeTruthy();
    });
    expect(screen.getByTestId("context-inspector").getAttribute("data-summary")).toBeTruthy();
    expect(screen.getAllByTestId("map")[0].getAttribute("data-overlay-right")).toBe("376");
  });

  test("opens evidence when a compare-table selection is made", async () => {
    const user = userEvent.setup();

    render(
      <AppShell
        graph={loadSeedGraph()}
        initialUrlState={{
          themeId: "rice",
          selectedId: null,
          layerId: "rice-harvest",
          mapModeOverride: null,
          workspaceView: "map"
        }}
      />
    );

    await user.click(screen.getAllByText("select-rice-observation")[0]);

    await waitFor(() => {
      expect(screen.getByTestId("context-inspector")).toBeTruthy();
    });
    expect(screen.getAllByTestId("map")[0].getAttribute("data-detail-popup")).toBe("");
  });

  test("closes the inspector without changing the selected theme or layer", async () => {
    const user = userEvent.setup();

    render(
      <AppShell
        graph={loadSeedGraph()}
        hasExplicitUrlState
        initialUrlState={{
          themeId: "rice",
          selectedId: "prefecture:niigata",
          layerId: "rice-harvest",
          mapModeOverride: null,
          workspaceView: "map"
        }}
      />
    );

    expect(screen.getByTestId("context-inspector").getAttribute("data-theme")).toBe("コメ");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("choropleth");

    await user.click(screen.getByRole("button", { name: "詳細を閉じる" }));

    expect(screen.queryByTestId("context-inspector")).toBeNull();
    expect(screen.getAllByTestId("nav-rail")[0].getAttribute("data-theme")).toBe("rice");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-mode")).toBe("choropleth");
    expect(screen.getAllByTestId("map")[0].getAttribute("data-overlay-right")).toBe("16");
  });
});

function withinActionBar() {
  return {
    queryByText(text: string) {
      const bar = screen.getByTestId("layout-action-bar");
      return Array.from(bar.querySelectorAll("*")).find((node) => node.textContent === text) ?? null;
    }
  };
}
