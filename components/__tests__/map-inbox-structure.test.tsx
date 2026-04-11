// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

describe("map inbox structure", () => {
  test("uses the left section as an inbox/filter pane and not as a theme menu", () => {
    render(
      <MapInboxPanel
        activeId="flow:saudi-oil-japan"
        highRiskCount={2}
        monitoringCount={3}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        query=""
        rows={[
          {
            id: "flow:saudi-oil-japan",
            type: "依存ルート",
            label: "サウジ原油 → 日本",
            subject: "原油",
            urgency: "高",
            status: "監視中",
            action: "ルートと根拠を確認",
            period: "2026"
          }
        ]}
        themeLabel="エネルギー"
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByText("監視インボックス")).toBeTruthy();
    expect(screen.getByText("検索")).toBeTruthy();
    expect(screen.getByText("絞り込み")).toBeTruthy();
    expect(screen.getByText("シグナル")).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部" })).toBeTruthy();
    expect(screen.queryByText("文脈")).toBeNull();
    expect(screen.queryByText("原油 / LNG / 海上ルート")).toBeNull();
    expect(screen.queryByText("テーマ")).toBeNull();
    expect(screen.queryByText("コメ")).toBeNull();
  });
});
