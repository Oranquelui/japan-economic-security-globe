// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { EvidencePanel } from "../EvidencePanel";
import { loadSeedGraph } from "../../lib/data/seed-loader";
import { buildLiveLogisticsDetail } from "../../lib/presentation/live-logistics-detail";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { DetailViewModel, EvidenceGraphViewModel } from "../../types/presentation";
import type { RankingExplanationViewModel } from "../../lib/ranking/explain";
import type { SourceDocument } from "../../types/semantic";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-18T09:00:00+09:00"));
});

afterEach(() => {
  vi.useRealTimers();
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
  relatedEntities: [],
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
    { id: "country:japan", kind: "Country", label: "日本" }
  ],
  links: []
};

const rankingExplanation: RankingExplanationViewModel = {
  signalId: "ranking-signal:energy-middle-east-route",
  rankLabel: "#1",
  summary: "国家的重要度が高く、日本向けの監視優先度が高い。",
  finalScoreLabel: "0.95",
  priorityTierLabel: "Critical",
  primaryAxis: {
    id: "energy",
    label: "エネルギー"
  },
  topComponent: {
    id: "nationalImportance",
    label: "国家的重要度",
    contributionPercent: 49,
    valuePercent: 98,
    weightPercent: 50
  },
  confidence: {
    label: "高信頼",
    valuePercent: 90,
    tone: "high"
  },
  freshness: {
    label: "1日前取得",
    tone: "fresh"
  },
  publicAttention: {
    label: "公的関心 45%",
    valuePercent: 45
  },
  sourceTrust: {
    label: "公式中心",
    detail: "2件中2件が公式一次ソース / PDF・HTML",
    officialCount: 2,
    totalCount: 2
  },
  components: [
    {
      id: "nationalImportance",
      label: "国家的重要度",
      contributionPercent: 49,
      valuePercent: 98,
      weightPercent: 50
    },
    {
      id: "disruptionDepth",
      label: "波及深度",
      contributionPercent: 22,
      valuePercent: 88,
      weightPercent: 25
    }
  ],
  canonicalRefs: [
    { kind: "flow", id: "flow:saudi-oil-japan" },
    { kind: "entity", id: "chokepoint:hormuz" }
  ],
  override: {
    reason: "Cabinet watch floor",
    explanation: "Keep visible during cross-ministry monitoring.",
    expiresLabel: "2026-04-28まで",
    remainingLabel: "あと2日"
  }
};

describe("evidence panel structure", () => {
  test("uses public-facing tabs instead of exposing SPARQL to general users", () => {
    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    expect(screen.getByRole("button", { name: "概要" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "出典" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "関連" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "SPARQL" })).toBeNull();
    expect(screen.queryByRole("button", { name: "根拠" })).toBeNull();
    expect(screen.queryByText("読み取り方")).toBeNull();
  });

  test("explains when a selected item is a domestic-only hub without overseas route data", () => {
    const domesticDetail: DetailViewModel = {
      ...detail,
      id: "refinery:oita",
      kind: "Refinery",
      label: "大分製油所エリア",
      linkedFlows: [],
      summary: "九州の精製拠点として、西日本の石油製品供給を支える。"
    };

    render(
      <EvidencePanel
        collapsed={false}
        detail={domesticDetail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        selectedId="refinery:oita"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    expect(screen.getByText("国内拠点")).toBeTruthy();
    expect(screen.getByText("ルート表示")).toBeTruthy();
    expect(screen.getByText(/海外連携ルート/)).toBeTruthy();
  });

  test("shows source freshness based on the accessed date", () => {
    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "出典" }));

    expect(screen.getByText("7日前確認")).toBeTruthy();
    expect(screen.getByText("確認日 2026-04-11")).toBeTruthy();
  });

  test.each([
    { name: "legacy source without authority fields", authority: {}, expectedOfficial: true },
    { name: "legacy official false", authority: { official: false }, expectedOfficial: false },
    {
      name: "explicit open-data category with official true",
      authority: { official: true, sourceCategory: "open-data" as const },
      expectedOfficial: false
    },
    {
      name: "explicit private category with official true",
      authority: { official: true, sourceCategory: "private" as const },
      expectedOfficial: false
    },
    {
      name: "explicit official category with official false",
      authority: { official: false, sourceCategory: "official" as const },
      expectedOfficial: true
    }
  ])("resolves the official source chip for $name", ({ authority, expectedOfficial }) => {
    const source: SourceDocument = {
      id: "source:badge-authority",
      label: "Badge authority source",
      url: "https://example.com/badge-authority",
      publisher: "Test publisher",
      accessed: "2026-07-18",
      ...authority
    };

    render(
      <EvidencePanel
        collapsed={false}
        detail={{ ...detail, sources: [source], sourceHighlights: [] }}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "出典" }));
    const sourceHeader = screen.getByText(source.label).parentElement;

    expect(sourceHeader).not.toBeNull();
    if (expectedOfficial) {
      expect(within(sourceHeader!).getByText("公式")).toBeTruthy();
      expect(within(sourceHeader!).queryByText("補助")).toBeNull();
    } else {
      expect(within(sourceHeader!).queryByText("公式")).toBeNull();
      expect(within(sourceHeader!).getByText("補助")).toBeTruthy();
    }
  });

  test("renders an actual demo fallback source without a false freshness date", () => {
    const fallbackDetail = buildLiveLogisticsDetail(loadSeedGraph(), {
      confidenceLabel: "デモ",
      corridorLabel: "Yokohama → Tokyo",
      disclosureLabel: "固定デモ / 公式ライブフィードではありません",
      etaLabel: "デモ",
      id: "live-logistics:road-keihin-tokyo",
      kindLabel: "道路物流",
      laneId: "road",
      lastSeenLabel: "22分前",
      pointIds: ["port:yokohama", "prefecture:tokyo"],
      priority: 50,
      relatedIds: [],
      signalTone: "monitoring",
      sourceLabel: "Domestic logistics demo fixture",
      statusLabel: "デモ",
      title: "固定デモ経路: 横浜港 → 首都圏配送"
    });

    render(
      <EvidencePanel
        collapsed={false}
        detail={fallbackDetail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="物流"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "出典" }));

    expect(screen.getAllByText("Domestic logistics demo fixture")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /Domestic logistics demo fixture/ })).toBeNull();
    expect(document.querySelector('a[href="#"]')).toBeNull();
    expect(screen.getByText("確認時点不明")).toBeTruthy();
    expect(screen.getByText("確認日不明")).toBeTruthy();
    expect(screen.queryByText(/NaN|日前確認|確認日 22分前/)).toBeNull();
  });

  test("shows a why-ranked section when ranking context is available", () => {
    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        rankingExplanation={rankingExplanation}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    expect(screen.getByText("Why Ranked")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("高信頼")).toBeTruthy();
    expect(screen.getByText("1日前取得")).toBeTruthy();
    expect(screen.getByText("公式中心")).toBeTruthy();
    expect(screen.getByText("2件中2件が公式一次ソース / PDF・HTML")).toBeTruthy();
    expect(screen.getByText("国家的重要度")).toBeTruthy();
    expect(screen.getByText("国家的重要度が高く、日本向けの監視優先度が高い。")).toBeTruthy();
    expect(screen.getByText("ホルムズ海峡")).toBeTruthy();
    expect(screen.getByText("あと2日")).toBeTruthy();
  });

  test("shows a compact trend section when ranked history exists", () => {
    render(
      <EvidencePanel
        collapsed={false}
        detail={detail}
        evidenceGraph={evidenceGraph}
        onSelect={vi.fn()}
        onToggleCollapsed={vi.fn()}
        rankingExplanation={rankingExplanation}
        selectedId="flow:saudi-oil-japan"
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeTitle="エネルギー"
      />
    );

    expect(screen.getByText("Trend")).toBeTruthy();
    expect(screen.getByText("7日変化 +32pt")).toBeTruthy();
    expect(screen.getByLabelText("Trend chart for ranking-signal:energy-middle-east-route")).toBeTruthy();
  });
});
