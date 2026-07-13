// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { ActionBar } from "../ActionBar";
import { getThemePalette } from "../../lib/presentation/palette";

const themePalette = getThemePalette("energy");

afterEach(() => {
  cleanup();
});

describe("ActionBar selected row", () => {
  test("uses a single-row scroll container with a right-side fade", () => {
    render(
      <ActionBar
        onClearFilters={() => undefined}
        queryActive={false}
        selectedKindLabel="依存フロー"
        selectedLabel="サウジ原油 → 日本"
        routeStatusLabel="概念連関"
        sharePath="/"
        themeLabel="エネルギー"
        themePalette={themePalette}
      />
    );

    const scroll = screen.getByTestId("selected-scroll");
    expect(scroll.tabIndex).toBe(0);
    expect(scroll.getAttribute("role")).toBe("region");
    expect(scroll.getAttribute("aria-label")).toBe("選択中の選択内容");
    expect(scroll.className).toContain("overflow-x-auto");
    expect(scroll.className).toContain("whitespace-nowrap");

    const fade = screen.getByTestId("selected-fade");
    expect(fade.getAttribute("style") ?? "").toContain("linear-gradient");
  });

  test("does not host map-layer widget controls in the primary action bar", () => {
    render(
      <ActionBar
        onClearFilters={() => undefined}
        queryActive={false}
        selectedKindLabel="依存フロー"
        selectedLabel="サウジ原油 → 日本"
        sharePath="/"
        themeLabel="エネルギー"
        themePalette={themePalette}
      />
    );

    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-testid")).toBe("layout-action-bar");
    expect(screen.queryByText("表示レイヤー")).toBeNull();
    expect(screen.queryByRole("button", { name: "地点" })).toBeNull();
    expect(screen.queryByRole("button", { name: "集約" })).toBeNull();
    expect(screen.queryByRole("button", { name: "ルート" })).toBeNull();
  });
});
