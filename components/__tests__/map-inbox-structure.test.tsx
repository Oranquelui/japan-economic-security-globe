// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

describe("map inbox structure", () => {
  test("keeps the left panel focused on context navigation instead of analysis widgets", () => {
    render(
      <MapInboxPanel
        collapsed={false}
        themePalette={getThemePalette("energy")}
        themeId="energy"
        onToggleCollapsed={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    expect(screen.getByText("テーマ")).toBeTruthy();
    expect(screen.queryByText("文脈")).toBeNull();
    expect(screen.queryByText("原油 / LNG / 海上ルート")).toBeNull();
    expect(screen.queryByText("絞り込み")).toBeNull();
    expect(screen.queryByText("主要シグナル")).toBeNull();
    expect(screen.queryByText("分析導線")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "全部" })).toBeNull();
  });
});
