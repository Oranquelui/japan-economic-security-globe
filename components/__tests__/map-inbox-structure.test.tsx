// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";
import type { WatchOverlayItemViewModel } from "../../lib/presentation/watch-overlays";

afterEach(() => {
  cleanup();
});

const watchOverlays: WatchOverlayItemViewModel[] = [
  {
    id: "overlay:japan-maritime-watch",
    title: "日本関係海運ウォッチ",
    summary: "ホルムズ海峡から日本の港湾・受入基地までを 1 日遅延で監視する。",
    freshnessLabel: "1日前確認",
    trustLabel: "公式中心",
    disclosureLabel: "1日遅延 / bounded overlay",
    relatedIds: ["flow:japan-linked-maritime-watch", "port:yokohama"]
  }
];

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
        watchOverlays={watchOverlays}
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
        watchOverlays={watchOverlays}
        themeId="rice"
        themeLabel="コメ"
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByText("行5")).toBeTruthy();
  });

  test("shows ranking context for rows that were promoted by the national-importance layer", () => {
    render(
      <MapInboxPanel
        activeId="flow:saudi-oil-japan"
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        query=""
        rows={[
          {
            id: "flow:saudi-oil-japan",
            type: "海上ルート依存",
            label: "サウジ原油 → 日本",
            subject: "原油",
            urgency: "高",
            status: "監視中",
            action: "確認",
            period: "2026",
            ranking: {
              finalScore: 0.93,
              primaryAxis: "energy",
              primaryAxisLabel: "エネルギー",
              priorityTier: "critical",
              rank: 1,
              signalId: "ranking-signal:energy-middle-east-route",
              topComponentId: "nationalImportance",
              confidenceLabel: "高信頼",
              freshnessLabel: "1日前取得",
              sourceTrustLabel: "公式中心",
              whyRanked: "国家的重要度が高く、日本向けの監視優先度が高い。"
            }
          }
        ] as never[]}
        watchOverlays={watchOverlays}
        themeId="energy"
        themeLabel="エネルギー"
        themePalette={getThemePalette("energy")}
      />
    );

    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getAllByText("エネルギー").length).toBeGreaterThan(1);
    expect(screen.getByText("1日前取得")).toBeTruthy();
    expect(screen.getByText("高信頼")).toBeTruthy();
    expect(screen.getAllByText("公式中心").length).toBeGreaterThan(0);
    expect(screen.getByText("国家的重要度が高く、日本向けの監視優先度が高い。")).toBeTruthy();
  });

  test("shows bounded watch overlays with freshness and disclosure labels", () => {
    render(
      <MapInboxPanel
        activeId="flow:japan-linked-maritime-watch"
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        query=""
        rows={[]}
        watchOverlays={watchOverlays}
        themeId="logistics"
        themeLabel="物流"
        themePalette={getThemePalette("logistics")}
      />
    );

    expect(screen.getByText("近接監視")).toBeTruthy();
    expect(screen.getByText("日本関係海運ウォッチ")).toBeTruthy();
    expect(screen.getByText("1日遅延 / bounded overlay")).toBeTruthy();
  });
});
