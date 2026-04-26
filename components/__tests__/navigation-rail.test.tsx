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
});
