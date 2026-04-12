// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EvidencePanel } from "../EvidencePanel";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { DetailViewModel, EvidenceGraphViewModel } from "../../types/presentation";

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
});
