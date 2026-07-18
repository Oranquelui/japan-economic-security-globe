// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapHoverCard } from "../MapHoverCard";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MapHoverCard", () => {
  test("shows only transient semantic value context as a non-interactive tooltip", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const isTooltip = this.getAttribute("role") === "tooltip";
      const width = isTooltip ? 224 : 480;
      const height = isTooltip ? 96 : 300;
      return { bottom: height, height, left: 0, right: width, top: 0, width, x: 0, y: 0, toJSON: () => ({}) };
    });

    const { rerender } = render(
      <div className="relative" style={{ height: 300, width: 480 }}>
        <MapHoverCard
          hover={{
            selectionId: "prefecture:niigata",
            label: "新潟県",
            valueLabel: "514,100",
            unitLabel: "トン",
            periodLabel: "令和5年産",
            x: 460,
            y: 280
          }}
          themePalette={getThemePalette("rice")}
        />
      </div>
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("pointer-events-none");
    expect(screen.getByText("新潟県")).toBeTruthy();
    expect(screen.getByText("514,100")).toBeTruthy();
    expect(screen.getByText("トン")).toBeTruthy();
    expect(screen.getByText("令和5年産")).toBeTruthy();
    expect(screen.queryByText(/出典|なぜ重要|関連/)).toBeNull();

    rerender(
      <div className="relative" style={{ height: 300, width: 480 }}>
        <MapHoverCard
          hover={{
            selectionId: "prefecture:niigata",
            label: "新潟県",
            valueLabel: "514,100",
            unitLabel: "トン",
            periodLabel: "令和5年産",
            x: 461,
            y: 281
          }}
          themePalette={getThemePalette("rice")}
        />
      </div>
    );

    return waitFor(() => {
      expect(tooltip.style.left).toBe("223px");
      expect(tooltip.style.top).toBe("171px");
    });
  });
});
