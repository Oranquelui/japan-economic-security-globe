// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EvidencePanel } from "../EvidencePanel";
import { AppShell } from "../AppShell";
import { ContextInspector } from "../ContextInspector";
import { JapanMainMap } from "../JapanMainMap";
import { NavigationRail } from "../NavigationRail";
import { OperationsSignalTable } from "../OperationsSignalTable";
import { ScopeContextPanel } from "../ScopeContextPanel";
import { loadSeedGraph } from "../../lib/data/seed-loader";
import { buildSelectionInspector, buildWorkspacePresentation } from "../../lib/presentation/workspace";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import { getDetailView } from "../../lib/semantic/detail";
import { getThemeView } from "../../lib/semantic/selectors";
import { buildEvidenceGraph } from "../../lib/semantic/view-models";
import type { DetailViewModel, EvidenceGraphViewModel } from "../../types/presentation";
import type { JapanMapCanvasModel } from "../../lib/presentation/map-canvas";
import type { WatchOverlayItemViewModel } from "../../lib/presentation/watch-overlays";

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: () => <div data-testid="ops-canvas" />
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() })
}));

afterEach(() => {
  cleanup();
});

const themePalette = getThemePalette("energy");
const statusPalette = getStatusPalette();

const detail: DetailViewModel = {
  id: "flow:saudi-oil-japan",
  kind: "DependencyFlow",
  label: "サウジ原油 → 日本",
  summary: "海上原油ルートの簡易フロー。",
  whyItMatters: "供給途絶が日本の電力・物流・物価に波及する。",
  signal: {
    category: "海上ルート依存",
    severity: "高",
    status: "監視中",
    recommendedAction: "海上ルートと燃料供給の連動を確認",
    watchpoints: ["ホルムズ海峡", "マラッカ海峡", "燃料価格"]
  },
  linkedFlows: [],
  relatedEntities: [
    {
      id: "country:japan",
      kind: "Country",
      label: "日本",
      summary: "日本",
      whyItMatters: "日本",
      themes: ["energy"],
      provenance: []
    }
  ],
  sources: [
    {
      id: "source:energy-whitepaper",
      label: "資源エネルギー庁",
      url: "https://example.com",
      publisher: "METI",
      accessed: "2026-04-11",
      official: true
    }
  ],
  sourceHighlights: [
    {
      sourceId: "source:energy-whitepaper",
      claim: "海上原油ルートの監視が必要。"
    }
  ],
  sparql: {
    title: "Energy query",
    query: "SELECT * WHERE { ?s ?p ?o }"
  }
};

const evidenceGraph: EvidenceGraphViewModel = {
  nodes: [
    { id: "country:japan", kind: "Country", label: "日本" },
    { id: "country:saudi-arabia", kind: "Country", label: "サウジアラビア" }
  ],
  links: [
    {
      id: "edge:1",
      source: "country:saudi-arabia",
      target: "country:japan",
      label: "ships"
    }
  ]
};

const mapModel: JapanMapCanvasModel = {
  points: [],
  routes: [],
  regions: [],
  globalPoints: [],
  globalRoutes: []
};

const watchOverlays: WatchOverlayItemViewModel[] = [
  {
    id: "overlay:kanto-lifeline-watch",
    title: "首都圏ライフライン監視",
    summary: "港湾・受入基地・水供給の着地点を bounded overlay として表示する。",
    freshnessLabel: "本日確認",
    trustLabel: "公式中心",
    disclosureLabel: "公式公開情報 / bounded overlay",
    relatedIds: ["port:yokohama", "reservoir:ogochi"]
  }
];

describe("operations accessibility", () => {
  test("keeps every desktop id and ARIA id reference unique in the real AppShell composition", async () => {
    const user = userEvent.setup();

    render(<AppShell graph={loadSeedGraph()} />);

    const desktop = screen.getByTestId("layout-desktop-workspace");
    expect(within(desktop).queryByTestId("layout-context-inspector")).toBeNull();
    expect(within(desktop).queryByTestId("layout-compare-drawer")).toBeNull();
    expect(within(desktop).queryByTestId("signals-panel")).toBeNull();
    expectUniqueDesktopIdReferences(desktop);

    await user.click(within(desktop).getByRole("button", { name: "シグナルを見る" }));
    expect(within(desktop).getByTestId("signals-panel")).toBeTruthy();
    expectUniqueDesktopIdReferences(desktop);

    await user.click(within(within(desktop).getByTestId("signals-panel")).getByRole("button", { name: /新潟県/ }));
    await waitFor(() => {
      expect(within(desktop).getByTestId("layout-context-inspector")).toBeTruthy();
      expect(within(desktop).queryByTestId("signals-panel")).toBeNull();
    });
    expectUniqueDesktopIdReferences(desktop);

    await user.click(within(desktop).getByRole("button", { name: "比較する" }));
    expect(within(desktop).getByTestId("layout-compare-drawer")).toBeTruthy();
    expectUniqueDesktopIdReferences(desktop);
  });

  test("exposes a logical scope, semantic-layer, and legend heading hierarchy", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    render(
      <ScopeContextPanel
        activeLayerId="rice-harvest"
        comparisonAvailable
        onLayerChange={() => undefined}
        onOpenComparison={() => undefined}
        onOpenSignals={() => undefined}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
        workspace={buildWorkspacePresentation(graph, view)}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "コメ" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "表示レイヤー" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "主食用米収穫量" })).toBeTruthy();

    const layerGroup = screen.getByRole("group", { name: "表示レイヤー" });
    expect(within(layerGroup).getByRole("button", { name: "収穫量" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(layerGroup).getByRole("button", { name: "価格" }).getAttribute("aria-pressed")).toBe("false");
  });

  test("announces the active theme in the desktop navigation rail", () => {
    render(
      <NavigationRail
        isInboxOpen
        onCloseInbox={() => undefined}
        onOpenInbox={() => undefined}
        onThemeChange={() => undefined}
        themeId="rice"
        themeIds={["rice", "energy"]}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("button", { name: "コメ" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "エネルギー" }).getAttribute("aria-pressed")).toBe("false");
  });

  test("gives the inspector a Japanese close name, discernible source links, and unique interactive ids", () => {
    const graph = loadSeedGraph();
    const selectedId = "prefecture:niigata";

    render(
      <ContextInspector
        evidenceGraph={buildEvidenceGraph(graph, "rice")}
        inspector={buildSelectionInspector(graph, selectedId, getDetailView(graph, selectedId))}
        onClose={() => undefined}
        onSelect={() => undefined}
        selectedId={selectedId}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("rice")}
        themeTitle="コメ"
      />
    );

    const inspector = screen.getByTestId("context-inspector");
    expect(within(inspector).getByRole("button", { name: "詳細を閉じる" })).toBeTruthy();
    fireEvent.click(within(inspector).getByRole("tab", { name: "出典" }));
    expect(within(inspector).getByRole("link", { name: /e-Stat/ }).getAttribute("href")).toMatch(/^https:\/\//);

    const interactiveIds = Array.from(inspector.querySelectorAll("button[id], a[id]")).map((element) => element.id);
    expect(interactiveIds.length).toBeGreaterThan(0);
    expect(new Set(interactiveIds).size).toBe(interactiveIds.length);
  });

  test("supports keyboard selection in the operations grid", () => {
    const onSelect = vi.fn();

    render(
      <OperationsSignalTable
        activeId=""
        collapsed={false}
        onSelect={onSelect}
        onToggleCollapsed={() => undefined}
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
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );

    const row = screen.getByRole("button", { name: /サウジ原油 → 日本/i });
    fireEvent.keyDown(row, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("flow:saudi-oil-japan");
  });

  test("shows ranking context inside the operations grid when present", () => {
    render(
      <OperationsSignalTable
        activeId=""
        collapsed={false}
        onSelect={() => undefined}
        onToggleCollapsed={() => undefined}
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
        ]}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
    );

    expect(screen.getByText("優先")).toBeTruthy();
    expect(screen.getByText("理由")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("1日前取得")).toBeTruthy();
    expect(screen.getByText("高信頼")).toBeTruthy();
    expect(screen.getAllByText("公式中心").length).toBeGreaterThan(0);
    expect(screen.getByText("国家的重要度が高く、日本向けの監視優先度が高い。")).toBeTruthy();
  });

  test("uses logistics impact language in the operations grid", () => {
    render(
      <OperationsSignalTable
        activeId=""
        collapsed={false}
        onSelect={() => undefined}
        onToggleCollapsed={() => undefined}
        query=""
        rows={[
          {
            id: "flow:japan-linked-maritime-watch",
            type: "港湾後続",
            label: "横浜港 → 首都圏配送",
            subject: "横浜港湾後背地",
            urgency: "中",
            status: "監視中",
            action: "高速道路・鉄道貨物の代替余力を確認",
            period: "2026"
          }
        ]}
        statusPalette={statusPalette}
        themeId="logistics"
        themePalette={getThemePalette("logistics")}
      />
    );

    expect(screen.getByText("国内物流インパクト")).toBeTruthy();
    expect(screen.getByText("影響種別")).toBeTruthy();
    expect(screen.getByText("経済影響")).toBeTruthy();
    expect(screen.getByText("地域/コリドー")).toBeTruthy();
  });

  test("supports keyboard selection in the evidence graph", () => {
    const onSelect = vi.fn();

    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={onSelect}
        onToggleCollapsed={() => undefined}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    const node = screen.getByRole("button", { name: "根拠ノード 日本" });
    fireEvent.keyDown(node, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("country:japan");
  });

  test("labels map controls for keyboard and assistive tech", () => {
    render(
      <JapanMainMap
        activeId="flow:saudi-oil-japan"
        focusTargetId={null}
        mapMode="route"
        model={mapModel}
        onSelect={() => undefined}
        statusPalette={statusPalette}
        themePalette={themePalette}
        watchOverlays={watchOverlays}
      />
    );

    expect(screen.getByRole("button", { name: "地図を拡大" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "地図を縮小" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "日本中心に戻す" })).toBeTruthy();
    expect(screen.getByText("首都圏ライフライン監視")).toBeTruthy();
    expect(screen.getByText("公式公開情報 / bounded overlay")).toBeTruthy();
  });
});

function expectUniqueDesktopIdReferences(desktop: HTMLElement) {
  const desktopIds = Array.from(desktop.querySelectorAll<HTMLElement>("[id]")).map((element) => element.id);
  const documentIds = Array.from(document.querySelectorAll<HTMLElement>("[id]")).map((element) => element.id);

  expect(desktopIds.every(Boolean)).toBe(true);
  expect(new Set(desktopIds).size).toBe(desktopIds.length);

  for (const controller of desktop.querySelectorAll<HTMLElement>("[aria-controls], [aria-labelledby]")) {
    for (const attribute of ["aria-controls", "aria-labelledby"] as const) {
      for (const token of controller.getAttribute(attribute)?.split(/\s+/).filter(Boolean) ?? []) {
        expect(documentIds.filter((id) => id === token), `${attribute}=${token} document target`).toHaveLength(1);
        expect(desktopIds.filter((id) => id === token), `${attribute}=${token} desktop target`).toHaveLength(1);
      }
    }
  }
}
