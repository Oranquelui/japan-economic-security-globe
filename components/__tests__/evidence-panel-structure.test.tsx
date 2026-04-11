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
  test("uses semantic tabs instead of mixing evidence and reading instructions", () => {
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
    expect(screen.getByRole("button", { name: "SPARQL" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "根拠" })).toBeNull();
    expect(screen.queryByText("読み取り方")).toBeNull();
  });
});
