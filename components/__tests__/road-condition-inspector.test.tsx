// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph, loadSeedRoadOperations } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildRoadOperationsView } from "../../lib/presentation/road-operations";
import type { RoadOperationsViewModel } from "../../types/road-operations";
import { RoadConditionInspector } from "../RoadConditionInspector";

afterEach(cleanup);

function buildInput(selectedId = "live-logistics:road-keihin-tokyo") {
  const roadOperations = buildRoadOperationsView(
    loadSeedRoadOperations(),
    new Date("2026-08-08T12:00:00+09:00")
  );
  if (!roadOperations) throw new Error("Expected road operations view.");
  return {
    graph: loadSeedGraph(),
    onClose: vi.fn(),
    roadOperations,
    selectedId,
    themePalette: getThemePalette("logistics")
  };
}

describe("RoadConditionInspector", () => {
  test("returns null for invalid, segment, junction, and unmatched record ids", () => {
    const input = buildInput();
    const { rerender } = render(<RoadConditionInspector {...input} selectedId="unknown" />);
    expect(screen.queryByTestId("road-condition-inspector")).toBeNull();
    rerender(<RoadConditionInspector {...input} selectedId={input.roadOperations.segments[0].id} />);
    expect(screen.queryByTestId("road-condition-inspector")).toBeNull();
    rerender(<RoadConditionInspector {...input} selectedId={input.roadOperations.junctions[0].id} />);
    expect(screen.queryByTestId("road-condition-inspector")).toBeNull();
  });

  test("shows a route-only surface with route, segment, provider, rights, and limitation posture", () => {
    render(<RoadConditionInspector {...buildInput()} />);
    const inspector = screen.getByTestId("road-condition-inspector");
    expect(within(inspector).getByRole("heading", { name: "横浜港・本牧ふ頭 → 東京湾岸配送圏" })).toBeTruthy();
    expect(inspector.textContent).toContain("高速湾岸線 B");
    expect(inspector.textContent).toContain("横浜港・本牧ふ頭 → 本牧JCT");
    expect(inspector.textContent).toContain("東行き");
    expect(inspector.textContent).toContain("JARTIC / 利用不可");
    expect(inspector.textContent).toContain("公式道路交通フィード未接続");
    expect(inspector.textContent).toContain("© OpenStreetMap contributors");
    expect(inspector.textContent).toContain("一般化形状");
    expect(inspector.textContent).toMatch(/到着見込み:\s+データなし/);
    expect(inspector.textContent).toMatch(/物流影響:\s+データなし/);
    expect(within(inspector).getByRole("link", { name: /首都高 高速湾岸線/ })).toBeTruthy();
    expect(within(inspector).getByRole("link", { name: /OpenStreetMap 道路形状/ })).toBeTruthy();
    expect(within(inspector).getByRole("button", { name: "道路状況の詳細を閉じる" })).toBeTruthy();
  });

  test("shows fixed-demo congestion evidence with only present quantitative fields", () => {
    render(<RoadConditionInspector {...buildInput("road-condition:demo-daikoku-ukishima-congestion")} />);
    const inspector = screen.getByTestId("road-condition-inspector");
    const text = inspector.textContent ?? "";
    expect(text).toContain("渋滞例");
    expect(text).toContain("大黒JCT東側 → 東扇島付近");
    expect(text).toContain("高速湾岸線 B");
    expect(text).toContain("固定デモ / 現在情報ではありません");
    expect(text).toContain("期限切れ");
    expect(text).toContain("2026-06-03T09:00:00+09:00");
    expect(text).toContain("2026-06-03T09:05:00+09:00");
    expect(text).toMatch(/渋滞長:\s+3\.2 km/);
    expect(text).toMatch(/遅延:\s+14 min/);
    expect(text).not.toContain("速度");
    expect(text).not.toContain("所要時間");
    expect(text).not.toMatch(/今日|監視中|次回更新|\d+分前/);
  });

  test("shows planned and ended lifecycle plus stale labels truthfully", () => {
    const input = buildInput("road-restriction:demo-oi-tatsumi-lane");
    const ended = {
      ...input.roadOperations.restrictions[0],
      id: "road-restriction:demo-ended-closure",
      restrictionKind: "closure" as const,
      lifecycle: "ended" as const,
      displayLifecycleLabel: "デモシナリオ内で終了"
    };
    const roadOperations: RoadOperationsViewModel = {
      ...input.roadOperations,
      restrictions: [...input.roadOperations.restrictions, ended]
    };
    const { rerender } = render(<RoadConditionInspector {...input} />);
    expect(screen.getByTestId("road-condition-inspector").textContent).toMatch(/車線規制例[\s\S]*予定[\s\S]*期限切れ/);
    rerender(
      <RoadConditionInspector
        {...input}
        roadOperations={roadOperations}
        selectedId={ended.id}
      />
    );
    expect(screen.getByTestId("road-condition-inspector").textContent).toMatch(/通行止例[\s\S]*終了[\s\S]*期限切れ/);
  });

  test("omits invalid quantitative values instead of synthesizing them", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      speed: { value: Number.NaN, unit: "km/h", observedAt: "2026-06-03T09:00:00+09:00" },
      travelTime: { value: Number.POSITIVE_INFINITY, unit: "min", observedAt: "2026-06-03T09:00:00+09:00" }
    };
    render(
      <RoadConditionInspector
        {...input}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    const text = screen.getByTestId("road-condition-inspector").textContent ?? "";
    expect(text).not.toContain("NaN");
    expect(text).not.toContain("Infinity");
    expect(text).not.toContain("速度");
    expect(text).not.toContain("所要時間");
  });
});
