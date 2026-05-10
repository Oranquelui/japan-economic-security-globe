// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { NavigationRail } from "../NavigationRail";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

describe("navigation rail", () => {
  test("renders theme presets in the provided ranked order", () => {
    render(
      <NavigationRail
        isInboxOpen
        onCloseInbox={vi.fn()}
        onOpenInbox={vi.fn()}
        onThemeChange={vi.fn()}
        themeId="rice"
        themeIds={["rice", "energy", "semiconductors", "water", "defense"]}
        themePalette={getThemePalette("rice")}
      />
    );

    const labels = screen.getAllByRole("button").slice(1).map((button) => button.getAttribute("aria-label"));

    expect(labels).toEqual(["コメ", "エネルギー", "半導体", "水", "防衛"]);
  });

  test("uses readable compact labels instead of single-character theme chips", () => {
    render(
      <NavigationRail
        isInboxOpen
        onCloseInbox={vi.fn()}
        onOpenInbox={vi.fn()}
        onThemeChange={vi.fn()}
        themeId="energy"
        themeIds={["energy", "logistics", "rice", "semiconductors", "water", "defense"]}
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByText("エネ")).toBeTruthy();
    expect(screen.getByText("物流")).toBeTruthy();
    expect(screen.getByText("半導")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "物流" })?.textContent).toContain("物流");
  });

  test("renders logistics as a first-class theme button", () => {
    render(
      <NavigationRail
        isInboxOpen
        onCloseInbox={vi.fn()}
        onOpenInbox={vi.fn()}
        onThemeChange={vi.fn()}
        themeId={"logistics" as never}
        themeIds={["logistics" as never, "energy", "rice", "semiconductors", "water", "defense"]}
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByRole("button", { name: "物流" })).toBeTruthy();
  });
});
