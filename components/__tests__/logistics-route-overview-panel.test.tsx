// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedLiveLogistics, loadSeedRoadOperations } from "../../lib/data/seed-loader";
import { buildLiveLogisticsView } from "../../lib/presentation/live-logistics";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildRoadOperationsView } from "../../lib/presentation/road-operations";
import type { LiveLogisticsViewModel } from "../../types/logistics";
import type { RoadOperationsViewModel } from "../../types/road-operations";
import { LogisticsRouteOverviewPanel } from "../LogisticsRouteOverviewPanel";

afterEach(cleanup);

function buildInput() {
  const liveLogistics = buildLiveLogisticsView(
    "logistics",
    "",
    loadSeedLiveLogistics(),
    new Date("2026-08-08T12:00:00+09:00")
  );
  const roadOperations = buildRoadOperationsView(
    loadSeedRoadOperations(),
    new Date("2026-08-08T12:00:00+09:00")
  );

  if (!liveLogistics || !roadOperations) {
    throw new Error("Expected complete logistics seed view models.");
  }

  return {
    activeId: "",
    liveLogistics,
    roadOperations,
    onSelect: vi.fn(),
    themePalette: getThemePalette("logistics")
  };
}

describe("LogisticsRouteOverviewPanel", () => {
  test("derives the representative-route, mode, support, and region summary from map routes", () => {
    const input = buildInput();

    render(<LogisticsRouteOverviewPanel {...input} />);

    expect(screen.getByText("5代表経路")).toBeTruthy();
    expect(screen.getByText("4輸送モード")).toBeTruthy();
    expect(screen.getByText("港湾前後 1補助")).toBeTruthy();
    expect(screen.getByText("首都圏 / 中京圏 / 関西圏 / 九州北部")).toBeTruthy();
    expect(screen.getByRole("group", { name: "道路の代表経路" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "鉄道の代表経路" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "内航の代表経路" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "航空の代表経路" })).toBeTruthy();
    expect(screen.getByText("港湾前後の補助")).toBeTruthy();
  });

  test("states the unavailable provider and fixed-demo posture without live-like copy", () => {
    const input = buildInput();

    render(<LogisticsRouteOverviewPanel {...input} />);

    const panel = screen.getByRole("region", { name: "国内物流の代表経路" });
    const text = panel.textContent ?? "";
    expect(text).toContain("公式道路交通フィード未接続");
    expect(text).toContain("固定デモ");
    expect(text).toContain("現在情報ではありません");
    expect(text).toContain("更新なし");
    expect(text).toContain("到着見込み: データなし");
    expect(text).toContain("物流影響: データなし");
    expect(text).not.toMatch(/今日|監視中|次回更新|\d+分前/);
  });

  test("keeps selection explicit and sends exact route, event, and support ids", () => {
    const input = buildInput();
    render(<LogisticsRouteOverviewPanel {...input} />);

    const routeButton = screen.getByRole("button", {
      name: /道路 代表経路 陸路: 横浜港 → 首都圏配送 固定デモ 現在情報ではありません/
    });
    const constructionButton = screen.getByRole("button", {
      name: /道路 工事例 羽田空港北側 → 大井JCT手前 .*期限切れ.*固定デモ/
    });
    const plannedButton = screen.getByRole("button", {
      name: /道路 車線規制例 有明付近 → 辰巳JCT手前 .*予定.*期限切れ.*固定デモ/
    });
    const supportButton = screen.getByRole("button", {
      name: /港湾前後の補助 コンテナ一般貨物: 東アジア → 横浜港 → 首都圏配送/
    });

    expect(screen.getAllByRole("button").every((button) => button.getAttribute("aria-pressed") === "false")).toBe(true);
    fireEvent.click(routeButton);
    fireEvent.click(constructionButton);
    fireEvent.click(plannedButton);
    fireEvent.click(supportButton);

    expect(input.onSelect.mock.calls.map(([id]) => id)).toEqual([
      "live-logistics:road-keihin-tokyo",
      "road-restriction:demo-ukishima-oi-construction",
      "road-restriction:demo-oi-tatsumi-lane",
      "live-logistics:container-asia-yokohama"
    ]);
  });

  test("uses exact active ids and exposes decorative mode marks only as hidden decoration", () => {
    const input = buildInput();
    render(
      <LogisticsRouteOverviewPanel
        {...input}
        activeId="road-restriction:demo-ukishima-oi-construction"
      />
    );

    const pressed = screen.getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.getAttribute("aria-label")).toContain("工事例");

    const panel = screen.getByRole("region", { name: "国内物流の代表経路" });
    const decorativeMarks = panel.querySelectorAll("[data-logistics-mode-symbol]");
    expect(decorativeMarks.length).toBeGreaterThanOrEqual(4);
    expect(Array.from(decorativeMarks).every((mark) => mark.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  test("shows ended and stale event semantics in the accessible event label", () => {
    const input = buildInput();
    const endedRestriction = {
      ...input.roadOperations.restrictions[0],
      id: "road-restriction:demo-ended-closure",
      restrictionKind: "closure" as const,
      lifecycle: "ended" as const,
      displayLifecycleLabel: "デモシナリオ内で終了",
      freshness: "stale" as const
    };
    const roadOperations: RoadOperationsViewModel = {
      ...input.roadOperations,
      restrictions: [...input.roadOperations.restrictions, endedRestriction]
    };

    render(<LogisticsRouteOverviewPanel {...input} roadOperations={roadOperations} />);

    expect(screen.getByRole("button", {
      name: /道路 通行止例 .*デモシナリオ内で終了.*期限切れ.*固定デモ/
    })).toBeTruthy();
  });

  test("excludes Energy AIS routes and requires both maritime lane and general-cargo class for support", () => {
    const input = buildInput();
    const roadItem = input.liveLogistics.items.find((item) => item.laneId === "road")!;
    const contamination = [
      {
        ...roadItem,
        id: "live-logistics:tanker-energy",
        laneId: "maritime" as const,
        operationClass: "energy_maritime_support" as const,
        title: "AIS LNG tanker"
      },
      {
        ...roadItem,
        id: "live-logistics:wrong-support-lane",
        laneId: "road" as const,
        operationClass: "maritime_general_cargo" as const,
        title: "誤分類の港湾補助"
      }
    ];
    const liveLogistics: LiveLogisticsViewModel = {
      ...input.liveLogistics,
      items: [...input.liveLogistics.items, ...contamination],
      mapRoutes: [
        ...input.liveLogistics.mapRoutes,
        ...contamination.map((item) => ({
          id: item.id,
          laneId: item.laneId,
          label: item.kindLabel,
          modeLabel: item.laneId === "road" ? "道路" as const : "海上" as const,
          pointIds: item.pointIds,
          relatedIds: item.relatedIds
        }))
      ]
    };

    render(<LogisticsRouteOverviewPanel {...input} liveLogistics={liveLogistics} />);

    expect(screen.getByText("5代表経路")).toBeTruthy();
    expect(screen.getByText("港湾前後 1補助")).toBeTruthy();
    const panel = screen.getByRole("region", { name: "国内物流の代表経路" });
    expect(panel.textContent).not.toContain("AIS LNG tanker");
    expect(panel.textContent).not.toContain("誤分類の港湾補助");
  });

  test("labels every choice with mode or category, title, and state", () => {
    const input = buildInput();
    render(<LogisticsRouteOverviewPanel {...input} />);

    const roadGroup = screen.getByRole("group", { name: "道路の代表経路" });
    const roadRoute = within(roadGroup).getByRole("button", { name: /道路 代表経路/ });
    expect(roadRoute.getAttribute("aria-label")).toContain("道路");
    expect(roadRoute.getAttribute("aria-label")).toContain("代表経路");
    expect(roadRoute.getAttribute("aria-label")).toContain("固定デモ");
    expect(roadRoute.getAttribute("aria-label")).toContain("現在情報ではありません");
  });
});
