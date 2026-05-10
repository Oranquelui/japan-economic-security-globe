// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { getThemePalette } from "../../lib/presentation/palette";
import type { WatchboardBriefingViewModel } from "../../lib/presentation/watchboard";
import { WatchboardBriefing } from "../WatchboardBriefing";

afterEach(() => {
  cleanup();
});

const briefing: WatchboardBriefingViewModel = {
  confidenceLabel: "高信頼",
  freshnessLabel: "1日前取得",
  japanImpact: "日本の燃料・電力・物流コストに波及しうる。",
  priorityTierLabel: "Critical",
  rankLabel: "#1",
  selectedId: "flow:saudi-oil-japan",
  themeId: "energy",
  themeLabel: "エネルギー",
  title: "サウジ原油 → 日本",
  whyNow: "国家的重要度が高く、日本向けの監視優先度が高い。"
};

describe("WatchboardBriefing", () => {
  test("renders the top watch item with rank, freshness, confidence, and why-now context", () => {
    render(<WatchboardBriefing briefing={briefing} themePalette={getThemePalette("energy")} />);

    expect(screen.getByText("今日の注視")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("エネルギー")).toBeTruthy();
    expect(screen.getByText("1日前取得")).toBeTruthy();
    expect(screen.getByText("高信頼")).toBeTruthy();
    expect(screen.getByText("サウジ原油 → 日本")).toBeTruthy();
    expect(screen.getByText("国家的重要度が高く、日本向けの監視優先度が高い。")).toBeTruthy();
  });
});
