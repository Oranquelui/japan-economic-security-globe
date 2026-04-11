// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

describe("map inbox structure", () => {
  test("uses the left section as an inbox and filter pane without reverting to verbose context copy", () => {
    render(
      <MapInboxPanel
        collapsed={false}
        query=""
        themePalette={getThemePalette("energy")}
        themeId="energy"
        onQueryChange={vi.fn()}
        onToggleCollapsed={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    expect(screen.getByText("監視インボックス")).toBeTruthy();
    expect(screen.getByText("検索")).toBeTruthy();
    expect(screen.getByText("絞り込み")).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部" })).toBeTruthy();
    expect(screen.queryByText("文脈")).toBeNull();
    expect(screen.queryByText("原油 / LNG / 海上ルート")).toBeNull();
    expect(screen.queryByText("主要シグナル")).toBeNull();
    expect(screen.queryByText("分析導線")).toBeNull();
  });
});
