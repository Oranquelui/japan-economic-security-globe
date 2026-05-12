// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { MapInboxPanel } from "../MapInboxPanel";
import { getThemePalette } from "../../lib/presentation/palette";
import type { WatchboardBriefingViewModel } from "../../lib/presentation/watchboard";
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

const maritimeLiveItem = {
  id: "live-logistics:tanker-qatar-tokyo-bay",
  title: "Tanker corridor: Hormuz → Malacca → Tokyo Bay",
  kindLabel: "AIS tanker",
  statusLabel: "Underway",
  lastSeenLabel: "Last seen 18分前",
  etaLabel: "ETA 42h",
  sourceLabel: "AIS provider fixture",
  disclosureLabel: "15-60分遅延 / aggregated vessel signal",
  confidenceLabel: "集約信号",
  corridorLabel: "Hormuz → Malacca → Yokohama/Sodegaura",
  pointIds: ["country:qatar", "chokepoint:hormuz", "chokepoint:malacca", "port:yokohama", "terminal:sodegaura-lng"],
  priority: 98,
  relatedIds: ["flow:japan-linked-maritime-watch"],
  signalTone: "watch"
};

const domesticLiveItem = {
  id: "live-logistics:domestic-keihin-tokyo",
  title: "Domestic logistics: Yokohama → Keihin/Sodegaura → Tokyo",
  kindLabel: "Domestic logistics",
  statusLabel: "接続監視",
  lastSeenLabel: "Last seen 22分前",
  etaLabel: "次回更新 15分",
  sourceLabel: "xROAD / Cyber Port fixture",
  disclosureLabel: "公開系統 / route-level only",
  confidenceLabel: "公式/準公式",
  corridorLabel: "Yokohama → Keihin/Sodegaura → Tokyo",
  pointIds: ["port:yokohama", "refinery:keihin", "terminal:sodegaura-lng", "prefecture:tokyo"],
  priority: 94,
  relatedIds: ["flow:japan-linked-maritime-watch"],
  signalTone: "monitoring"
};

const liveLogistics = {
  title: "JAPAN-BOUND TANKER WATCH",
  subtitle: "日本に向かうタンカー捕捉と港湾後続を分けて監視",
  disclosureLabel: "AIS coverage / 15-60分遅延 / provider-gated",
  updatedLabel: "18分前",
  items: [maritimeLiveItem, domesticLiveItem],
  lanes: [
    {
      id: "maritime",
      title: "日本向けタンカー",
      subtitle: "AIS・衛星AIS・港湾ETAを海側の捕捉として扱う。",
      items: [maritimeLiveItem]
    },
    {
      id: "domestic",
      title: "国内接続",
      subtitle: "港から首都圏の燃料・物流接続として扱う。",
      items: [domesticLiveItem]
    }
  ],
  mapRoutes: []
};

const briefing: WatchboardBriefingViewModel = {
  confidenceLabel: "高信頼",
  freshnessLabel: "16日前取得",
  japanImpact: "電力・物流・家計費への波及を優先監視する。",
  proofSourceLabels: ["METI", "Trade Statistics"],
  priorityTierLabel: "Critical",
  rankLabel: "#1",
  safetyLabel: "公開情報のみ / 遅延・bounded overlay",
  selectedId: "flow:saudi-oil-japan",
  sourceProofLabel: "根拠: METI / Trade Statistics",
  strategicQuestion: "日本のどのライフラインが、エネルギー・物流・食料ルートの変化に晒されるか？",
  themeId: "energy",
  themeLabel: "エネルギー",
  title: "中東エネルギー輸送路の圧力",
  whyNow: "ホルムズ海峡とマラッカ海峡を経由する日本向け燃料ルートの監視優先度が高い。"
};

describe("map inbox structure", () => {
  test("uses the left pane as a command pane with the watchboard briefing before inbox controls", () => {
    render(
      <MapInboxPanel
        activeId="flow:saudi-oil-japan"
        briefing={briefing}
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

    const commandPane = screen.getByTestId("command-pane-scroll");
    expect(commandPane.textContent).toContain("JAPAN WATCHBOARD");
    expect(commandPane.textContent).toContain("日本のどのライフライン");
    expect(commandPane.textContent).toContain("監視インボックス");
    expect((commandPane.textContent ?? "").indexOf("JAPAN WATCHBOARD")).toBeLessThan(
      (commandPane.textContent ?? "").indexOf("監視インボックス")
    );
  });

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

  test("surfaces live logistics before bounded watch overlays", () => {
    render(
      <MapInboxPanel
        activeId="flow:japan-linked-maritime-watch"
        liveLogistics={liveLogistics as never}
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

    const commandPane = screen.getByTestId("command-pane-scroll");
    const text = commandPane.textContent ?? "";

    expect(text).toContain("JAPAN-BOUND TANKER WATCH");
    expect(text).toContain("日本向けタンカー");
    expect(text).toContain("AIS tanker");
    expect(text).toContain("Tanker corridor: Hormuz");
    expect(text).toContain("Last seen 18分前");
    expect(text).toContain("ETA 42h");
    expect(text).toContain("国内接続");
    expect(text).toContain("Domestic logistics");
    expect(text).toContain("xROAD / Cyber Port fixture");
    expect(text.indexOf("日本向けタンカー")).toBeLessThan(text.indexOf("国内接続"));
    expect(text.indexOf("JAPAN-BOUND TANKER WATCH")).toBeLessThan(text.indexOf("近接監視"));
  });
});
