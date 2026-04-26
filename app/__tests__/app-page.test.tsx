// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ReactElement } from "react";

const { loadSeedGraphMock, loadSeedRankingSignalsMock, parseOperationsUrlStateMock } = vi.hoisted(() => ({
  loadSeedGraphMock: vi.fn(() => ({ mocked: true })),
  loadSeedRankingSignalsMock: vi.fn(() => []),
  parseOperationsUrlStateMock: vi.fn(() => ({
    themeId: "energy",
    mapMode: "point",
    selectedId: null
  }))
}));

vi.mock("../../components/AppShell", () => ({
  AppShell: ({
    locale,
    homepageMode
  }: {
    locale?: string;
    homepageMode?: string;
  }) => <div data-testid="app-shell" data-homepage-mode={homepageMode ?? ""} data-locale={locale ?? ""} />
}));

vi.mock("../../lib/data/seed-loader", () => ({
  loadSeedGraph: loadSeedGraphMock,
  loadSeedRankingSignals: loadSeedRankingSignalsMock
}));

vi.mock("../../lib/presentation/url-state", () => ({
  DEFAULT_OPERATIONS_URL_STATE: {
    themeId: "energy",
    mapMode: "point",
    selectedId: null
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
  loadSeedRankingSignalsMock.mockClear();
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
    expect(loadSeedGraphMock).toHaveBeenCalledTimes(1);
    expect(loadSeedRankingSignalsMock).toHaveBeenCalledTimes(1);
    expect(parseOperationsUrlStateMock).toHaveBeenCalledWith({ theme: "rice" });
  });

  test("renders the shared app shell at locale routes and forwards homepage mode", async () => {
    process.env.NEXT_PUBLIC_HOMEPAGE_MODE = "app";

    render(await AppPage({ locale: "en", searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("app-shell").getAttribute("data-locale")).toBe("en");
    expect(screen.getByTestId("app-shell").getAttribute("data-homepage-mode")).toBe("app");
    expect(loadSeedGraphMock).toHaveBeenCalledTimes(1);
    expect(loadSeedRankingSignalsMock).toHaveBeenCalledTimes(1);
    expect(parseOperationsUrlStateMock).toHaveBeenCalledWith({});
  });
});
