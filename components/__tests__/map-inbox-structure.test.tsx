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
        themeId="energy"
        themeLabel="エネルギー"
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByText("監視インボックス")).toBeTruthy();
    expect(screen.getByText("検索")).toBeTruthy();
    expect(screen.getByText("絞り込み")).toBeTruthy();
    expect(screen.getByText("優先監視")).toBeTruthy();
    expect(screen.getByTestId("monitoring-inbox-scroll").className).toContain("overflow-y-auto");
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "全部" })).toBeTruthy();
    expect(screen.queryByText("文脈")).toBeNull();
    expect(screen.queryByText("原油 / LNG / 海上ルート")).toBeNull();
    expect(screen.queryByText("テーマ")).toBeNull();
    expect(screen.queryByText("コメ")).toBeNull();
  });

  test("shows all priority rows instead of truncating them to four items", () => {
    render(
      <MapInboxPanel
        activeId="row-1"
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        query=""
        rows={[
          { id: "row-1", type: "価格圧力", label: "行1", subject: "コメ", urgency: "高", status: "要確認", action: "確認", period: "2026" },
          { id: "row-2", type: "価格圧力", label: "行2", subject: "コメ", urgency: "高", status: "要確認", action: "確認", period: "2026" },
          { id: "row-3", type: "価格圧力", label: "行3", subject: "コメ", urgency: "高", status: "要確認", action: "確認", period: "2026" },
          { id: "row-4", type: "価格圧力", label: "行4", subject: "コメ", urgency: "高", status: "要確認", action: "確認", period: "2026" },
          { id: "row-5", type: "価格圧力", label: "行5", subject: "コメ", urgency: "高", status: "要確認", action: "確認", period: "2026" }
        ]}
        themeId="rice"
        themeLabel="コメ"
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByText("行5")).toBeTruthy();
  });
});
