// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ActionBar } from "../ActionBar";
import { getThemePalette } from "../../lib/presentation/palette";

const themePalette = getThemePalette("energy");

describe("ActionBar selected row", () => {
  test("uses a single-row scroll container with a right-side fade", () => {
    render(
      <ActionBar
        mapMode="point"
        onClearFilters={() => undefined}
        onMapModeChange={() => undefined}
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
    expect(scroll.className).toContain("overflow-x-auto");
    expect(scroll.className).toContain("whitespace-nowrap");

    const fade = screen.getByTestId("selected-fade");
    expect(fade.getAttribute("style") ?? "").toContain("linear-gradient");
  });
});
