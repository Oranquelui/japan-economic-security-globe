// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { getThemePalette } from "../../lib/presentation/palette";
import { SignalsPanel } from "../SignalsPanel";

afterEach(cleanup);

describe("SignalsPanel", () => {
  test("preserves ranking and freshness evidence while routing search and selection", async () => {
    const user = userEvent.setup();
    const onBackToMap = vi.fn();
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <SignalsPanel
        activeId="flow:energy"
        onBackToMap={onBackToMap}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
        query=""
        rows={[
          {
            id: "flow:energy",
            type: "依存ルート",
            label: "中東原油 → 日本",
            subject: "原油",
            urgency: "高",
            status: "監視中",
            action: "供給ルートを確認",
            period: "2026年",
            ranking: {
              confidenceLabel: "高信頼",
              finalScore: 0.93,
              freshnessLabel: "1日前取得",
              primaryAxis: "energy",
              primaryAxisLabel: "エネルギー",
              priorityTier: "critical",
              rank: 1,
              signalId: "ranking:energy",
              sourceTrustLabel: "公式中心",
              topComponentId: "nationalImportance",
              whyRanked: "国家的重要度が高い。"
            }
          }
        ]}
        themeId="energy"
        themeLabel="エネルギー"
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByRole("heading", { name: "エネルギーのシグナル" })).toBe(document.activeElement);
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("1日前取得")).toBeTruthy();
    expect(screen.getByText("高信頼")).toBeTruthy();
    expect(screen.getByText("公式中心")).toBeTruthy();
    expect(screen.getByText("国家的重要度が高い。")).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "シグナルを検索" }), { target: { value: "原油" } });
    expect(onQueryChange).toHaveBeenLastCalledWith("原油");

    await user.click(screen.getByRole("button", { name: /中東原油 → 日本/ }));
    expect(onSelect).toHaveBeenCalledWith("flow:energy");

    await user.click(screen.getByRole("button", { name: "地図に戻る" }));
    expect(onBackToMap).toHaveBeenCalledTimes(1);
  });
});
