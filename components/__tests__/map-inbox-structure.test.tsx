// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";
import { getThemeView } from "../../lib/semantic/selectors";
import { loadSeedGraph } from "../../lib/data/seed-loader";

afterEach(() => {
  cleanup();
});

describe("map inbox structure", () => {
  test("keeps the left panel focused on context navigation instead of analysis widgets", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");

    render(
      <MapInboxPanel
        collapsed={false}
        themePalette={getThemePalette("energy")}
        themeId="energy"
        view={view}
        onToggleCollapsed={vi.fn()}
        onThemeChange={vi.fn()}
      />
    );

    expect(screen.getByText("プリセット")).toBeTruthy();
    expect(screen.queryByText("絞り込み")).toBeNull();
    expect(screen.queryByText("主要シグナル")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "全部" })).toBeNull();
  });
});
