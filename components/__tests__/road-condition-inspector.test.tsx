// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph, loadSeedRoadOperations } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildRoadOperationsView } from "../../lib/presentation/road-operations";
import type { RoadOperationsViewModel } from "../../types/road-operations";
import type { SemanticGraph, SourceDocument } from "../../types/semantic";
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

function fieldValue(inspector: HTMLElement, label: string) {
  const term = within(inspector).getByText(`${label}:`);
  return term.nextElementSibling?.textContent?.trim() ?? "";
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
    expect(fieldValue(inspector, "提供元")).toBe("公式道路交通フィード未接続 / 利用不可");
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

  test("uses the actual available provider and removes demo suffixes for authorized current data", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      dataPosture: "authorized-provider" as const,
      freshness: "current" as const,
      displayLifecycleLabel: null,
      disclosureLabel: "提供元の現在データ",
      sourceIds: ["source:jartic-road-provider-service"]
    };
    const roadOperations: RoadOperationsViewModel = {
      ...input.roadOperations,
      conditions: [condition],
      provider: {
        ...input.roadOperations.provider,
        id: "provider:metro-road-api",
        label: "首都圏道路運用API",
        state: "available",
        lastSuccessfulRetrievalAt: "2026-08-08T11:59:00+09:00"
      }
    };

    render(<RoadConditionInspector {...input} roadOperations={roadOperations} />);
    const inspector = screen.getByTestId("road-condition-inspector");
    const text = inspector.textContent ?? "";
    expect(within(inspector).getByRole("heading", { name: /渋滞 —/ })).toBeTruthy();
    expect(fieldValue(inspector, "区分")).toBe("渋滞");
    expect(fieldValue(inspector, "提供元")).toBe("首都圏道路運用API / 利用可能");
    expect(fieldValue(inspector, "最終成功取得")).toBe("2026-08-08T11:59:00+09:00");
    expect(text).not.toContain("渋滞例");
    expect(text).not.toContain("固定デモ");
    expect(text).not.toContain("現在情報ではありません");
  });

  test("preserves a nonblank authorized-provider contractual disclosure with explicit posture", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      dataPosture: "authorized-provider" as const,
      freshness: "current" as const,
      disclosureLabel: "契約範囲内の画面表示のみ / 二次配布不可"
    };

    render(
      <RoadConditionInspector
        {...input}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    expect(screen.getByTestId("road-event-disclosure").textContent).toBe(
      "認可済み提供元データ / 契約範囲内の画面表示のみ / 二次配布不可"
    );
  });

  test("falls back to generic authorized-provider disclosure for blank provider text", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      dataPosture: "authorized-provider" as const,
      freshness: "current" as const,
      disclosureLabel: "   "
    };

    render(
      <RoadConditionInspector
        {...input}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    expect(screen.getByTestId("road-event-disclosure").textContent).toBe(
      "認可済み提供元データ / 提供元の観測時刻と出典を確認してください"
    );
  });

  test("combines fixed-demo truthfulness with the actual disclosure without duplicate posture labels", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      disclosureLabel: "検証専用シナリオ / 二次利用不可"
    };
    const { rerender } = render(
      <RoadConditionInspector
        {...input}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    expect(screen.getByTestId("road-event-disclosure").textContent).toBe(
      "固定デモ / 現在情報ではありません / 検証専用シナリオ / 二次利用不可"
    );

    rerender(<RoadConditionInspector {...input} />);
    const seedDisclosure = screen.getByTestId("road-event-disclosure").textContent ?? "";
    expect(seedDisclosure).toBe("固定デモ / 現在情報ではありません");
    expect(seedDisclosure.match(/固定デモ/g)).toHaveLength(1);
    expect(seedDisclosure.match(/現在情報ではありません/g)).toHaveLength(1);
  });

  test("deduplicates only exact fixed-demo posture phrases and retains longer provider constraints", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      disclosureLabel:
        "固定デモの二次配布は禁止 / 固定デモ / 現在情報ではありませんが履歴参照専用 / 現在情報ではありません / 監査ログを保存"
    };

    render(
      <RoadConditionInspector
        {...input}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    expect(screen.getByTestId("road-event-disclosure").textContent).toBe(
      "固定デモ / 現在情報ではありません / 固定デモの二次配布は禁止 / 現在情報ではありませんが履歴参照専用 / 監査ログを保存"
    );
  });

  test("shows only validated absolute timestamps and rejects relative or malformed values", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const condition = {
      ...input.roadOperations.conditions[0],
      startsAt: "今日 09:00",
      endsAt: "2026-99-99T99:99:99+09:00",
      providerObservedAt: "3分前",
      retrievedAt: "javascript:alert(1)"
    };
    const roadOperations: RoadOperationsViewModel = {
      ...input.roadOperations,
      conditions: [condition],
      provider: {
        ...input.roadOperations.provider,
        lastSuccessfulRetrievalAt: "昨日"
      }
    };

    render(<RoadConditionInspector {...input} roadOperations={roadOperations} />);
    const inspector = screen.getByTestId("road-condition-inspector");
    expect(fieldValue(inspector, "開始")).toBe("データなし");
    expect(fieldValue(inspector, "終了")).toBe("データなし");
    expect(fieldValue(inspector, "提供元観測時刻")).toBe("データなし");
    expect(fieldValue(inspector, "取得時刻")).toBe("データなし");
    expect(fieldValue(inspector, "最終成功取得")).toBe("データなし");
    expect(inspector.textContent).not.toMatch(/今日|3分前|javascript:|2026-99-99|昨日/);
  });

  test("links only safe web and root-relative source URLs", () => {
    const input = buildInput("road-condition:demo-daikoku-ukishima-congestion");
    const unsafeSources: SourceDocument[] = [
      { id: "source:empty", label: "空URL", url: "", publisher: "test", accessed: "2026-08-08" },
      { id: "source:backslash", label: "バックスラッシュURL", url: "/safe\\evil", publisher: "test", accessed: "2026-08-08" },
      { id: "source:control", label: "制御文字URL", url: "https://safe.test/\nattack", publisher: "test", accessed: "2026-08-08" },
      { id: "source:http", label: "HTTP出典", url: "http://safe.test/source", publisher: "test", accessed: "2026-08-08" }
    ];
    const graph: SemanticGraph = {
      ...input.graph,
      sources: [
        ...input.graph.sources.map((source) => {
          if (source.id === "source:shutoko-bayshore-route") return { ...source, url: "javascript:alert(1)" };
          if (source.id === "source:shutoko-jct-guide") return { ...source, url: "//evil.test/path" };
          if (source.id === "source:jartic-road-provider-service") return { ...source, url: "data:text/html,unsafe" };
          if (source.id === "source:openstreetmap-road-geometry") return { ...source, url: "/data/osm.geojson" };
          return source;
        }),
        ...unsafeSources
      ]
    };
    const condition = {
      ...input.roadOperations.conditions[0],
      sourceIds: [
        ...input.roadOperations.conditions[0].sourceIds,
        ...unsafeSources.map((source) => source.id)
      ]
    };

    render(
      <RoadConditionInspector
        {...input}
        graph={graph}
        roadOperations={{ ...input.roadOperations, conditions: [condition] }}
      />
    );
    const inspector = screen.getByTestId("road-condition-inspector");
    expect(within(inspector).getByRole("link", { name: /OpenStreetMap 道路形状/ }).getAttribute("href")).toBe("/data/osm.geojson");
    expect(within(inspector).getByRole("link", { name: "HTTP出典" }).getAttribute("href")).toBe("http://safe.test/source");
    for (const label of [
      "首都高 高速湾岸線・首都高ナビマップ",
      "首都高 JCT・複雑なルート案内",
      "JARTIC 各種情報の提供（オープンデータ）",
      "空URL",
      "バックスラッシュURL",
      "制御文字URL"
    ]) {
      expect(within(inspector).getByText(label).closest("a")).toBeNull();
    }
    expect(Array.from(within(inspector).getAllByRole("link")).every((link) => !/^(?:javascript:|data:|\/\/)/.test(link.getAttribute("href") ?? ""))).toBe(true);
  });

  test("keeps definition lists and source lists structurally valid", () => {
    render(<RoadConditionInspector {...buildInput("road-condition:demo-daikoku-ukishima-congestion")} />);
    const inspector = screen.getByTestId("road-condition-inspector");
    const sourceHeading = within(inspector).getByRole("heading", { name: "出典・利用条件" });
    const sourceSection = sourceHeading.closest("section");
    expect(sourceSection?.querySelector("dl")).toBeNull();
    expect(sourceSection?.querySelector("ul")).toBeTruthy();
    expect(sourceSection?.querySelector("p")).toBeTruthy();
    expect(inspector.querySelectorAll("dl > ul, dl > p")).toHaveLength(0);
    for (const list of Array.from(inspector.querySelectorAll("dl"))) {
      expect(list.querySelectorAll(":scope > div > dt").length).toBeGreaterThan(0);
      expect(list.querySelectorAll(":scope > div > dt").length).toBe(list.querySelectorAll(":scope > div > dd").length);
    }
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
