// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { getThemePalette } from "../../lib/presentation/palette";
import { SourceStatusBar } from "../SourceStatusBar";

afterEach(() => {
  cleanup();
});

describe("SourceStatusBar", () => {
  test("renders a compact source-backed status strip", () => {
    render(
      <SourceStatusBar
        summary={{
          totalSources: 10,
          officialSources: 8,
          apiLikeSources: 2,
          documentSources: 7,
          staleSources: 3,
          freshestAccessed: "2026-04-18",
          oldestAccessed: "2026-04-01",
          overallTone: "stale"
        }}
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByRole("status", { name: "出典状態" })).toBeTruthy();
    expect(screen.getByText("公式 8/10")).toBeTruthy();
    expect(screen.getByText("API 2")).toBeTruthy();
    expect(screen.getByText("文書 7")).toBeTruthy();
    expect(screen.getByText("古い出典 3")).toBeTruthy();
    expect(screen.getByText("最終確認 2026-04-18")).toBeTruthy();
  });
});
