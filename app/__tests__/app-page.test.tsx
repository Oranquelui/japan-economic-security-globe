// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactElement } from "react";

const { loadSeedGraphMock, loadSeedLiveLogisticsMock, loadSeedRankingSignalsMock, loadSeedRoadOperationsMock, parseOperationsUrlStateMock } = vi.hoisted(() => ({
  loadSeedGraphMock: vi.fn(() => ({ mocked: true })),
  loadSeedLiveLogisticsMock: vi.fn(() => [{ id: "live-logistics:fixture" }]),
  loadSeedRankingSignalsMock: vi.fn(() => []),
  loadSeedRoadOperationsMock: vi.fn(() => ({ datasetId: "road-operations:fixture" })),
  parseOperationsUrlStateMock: vi.fn(() => ({
    themeId: "energy",
    selectedId: null,
    layerId: "energy-supply",
    mapModeOverride: null,
    workspaceView: "map"
  }))
}));

vi.mock("../../components/AppShell", () => ({
  AppShell: ({
    hasExplicitUrlState,
    liveLogisticsEvents,
    locale,
    homepageMode,
    roadOperationsDataset
  }: {
    hasExplicitUrlState?: boolean;
    liveLogisticsEvents?: unknown[];
    locale?: string;
    homepageMode?: string;
    roadOperationsDataset?: { datasetId: string } | null;
  }) => (
    <div
      data-testid="app-shell"
      data-explicit-url-state={hasExplicitUrlState ? "yes" : "no"}
      data-homepage-mode={homepageMode ?? ""}
      data-live-logistics={liveLogisticsEvents?.length ?? 0}
      data-locale={locale ?? ""}
      data-road-operations={roadOperationsDataset?.datasetId ?? ""}
    />
  )
}));

vi.mock("../../lib/data/seed-loader", () => ({
  loadSeedGraph: loadSeedGraphMock,
  loadSeedLiveLogistics: loadSeedLiveLogisticsMock,
  loadSeedRankingSignals: loadSeedRankingSignalsMock,
  loadSeedRoadOperations: loadSeedRoadOperationsMock
}));

vi.mock("../../lib/presentation/url-state", () => ({
  DEFAULT_OPERATIONS_URL_STATE: {
    themeId: "energy",
    selectedId: null,
    layerId: "energy-supply",
    mapModeOverride: null,
    workspaceView: "map"
  },
  parseOperationsUrlState: parseOperationsUrlStateMock
}));

import RootPage from "../page";
import LocalePage from "../[locale]/page";
import { AppPage } from "../_components/AppPage";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_HOMEPAGE_MODE;
  loadSeedGraphMock.mockClear();
  loadSeedLiveLogisticsMock.mockClear();
  loadSeedRankingSignalsMock.mockClear();
  loadSeedRoadOperationsMock.mockClear();
  parseOperationsUrlStateMock.mockClear();
});

describe("app page routes", () => {
  test("returns the shared AppPage element at the root route with the default locale", async () => {
    const result = (await RootPage({
      searchParams: Promise.resolve({ theme: "rice" })
    })) as ReactElement<{ locale: string }>;

    expect(result.type).toBe(AppPage);
    expect(result.props.locale).toBe("ja");
  });

  test("returns the shared AppPage element at locale routes", async () => {
    const result = (await LocalePage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({})
    })) as ReactElement<{ locale: string }>;

    expect(result.type).toBe(AppPage);
    expect(result.props.locale).toBe("en");
  });

  test("renders the shared app shell with normalized locale and app homepage mode by default", async () => {
    render(await AppPage({ locale: "bogus", searchParams: Promise.resolve({ theme: "rice" }) }));

    expect(screen.getByTestId("app-shell").getAttribute("data-locale")).toBe("ja");
    expect(screen.getByTestId("app-shell").getAttribute("data-homepage-mode")).toBe("app");
    expect(screen.getByTestId("app-shell").getAttribute("data-live-logistics")).toBe("1");
    expect(screen.getByTestId("app-shell").getAttribute("data-road-operations")).toBe("road-operations:fixture");
    expect(loadSeedGraphMock).toHaveBeenCalledTimes(1);
    expect(loadSeedLiveLogisticsMock).toHaveBeenCalledTimes(1);
    expect(loadSeedRankingSignalsMock).toHaveBeenCalledTimes(1);
    expect(loadSeedRoadOperationsMock).toHaveBeenCalledTimes(1);
    expect(parseOperationsUrlStateMock).toHaveBeenCalledWith({ theme: "rice" });
  });

  test("renders the shared app shell at locale routes and forwards homepage mode", async () => {
    process.env.NEXT_PUBLIC_HOMEPAGE_MODE = "app";

    render(await AppPage({ locale: "en", searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("app-shell").getAttribute("data-locale")).toBe("en");
    expect(screen.getByTestId("app-shell").getAttribute("data-homepage-mode")).toBe("app");
    expect(screen.getByTestId("app-shell").getAttribute("data-live-logistics")).toBe("1");
    expect(loadSeedGraphMock).toHaveBeenCalledTimes(1);
    expect(loadSeedLiveLogisticsMock).toHaveBeenCalledTimes(1);
    expect(loadSeedRankingSignalsMock).toHaveBeenCalledTimes(1);
    expect(parseOperationsUrlStateMock).toHaveBeenCalledWith({});
  });

  test.each([
    ["semantic layer", { layer: "rice-price" }],
    ["workspace view", { view: "signals" }],
    ["legacy mode", { mode: "route" }]
  ])("treats an explicit %s query as pinned URL state", async (_label, query) => {
    render(await AppPage({ searchParams: Promise.resolve(query) }));

    expect(screen.getByTestId("app-shell").getAttribute("data-explicit-url-state")).toBe("yes");
  });

  test("checks every value in array query params for explicit URL state", async () => {
    render(
      await AppPage({
        searchParams: Promise.resolve({ selected: ["", "observation:rice-price-signal-2026"] })
      })
    );

    expect(screen.getByTestId("app-shell").getAttribute("data-explicit-url-state")).toBe("yes");
  });
});
