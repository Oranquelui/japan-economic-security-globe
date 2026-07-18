// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import type { LayerLegend } from "../../types/presentation";
import { MapLegend } from "../MapLegend";

afterEach(cleanup);

describe("MapLegend", () => {
  test("shows continuous bounds, unit, period, a separate missing-data key, and a real official source", () => {
    const graph = loadSeedGraph();
    const source = graph.sources.find((candidate) => candidate.id === "source:estat-rice-prefecture-harvest-r5")!;

    render(
      <MapLegend
        legend={{
          kind: "continuous",
          title: "主食用米収穫量",
          minLabel: "低",
          maxLabel: "高",
          missingLabel: "データなし",
          unit: "トン"
        }}
        periodLabel="令和5年産"
        sourceIds={[source.id]}
        sources={graph.sources}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("region", { name: "主食用米収穫量の凡例" })).toBeTruthy();
    expect(screen.getByText("低")).toBeTruthy();
    expect(screen.getByText("高")).toBeTruthy();
    expect(screen.getByText("トン")).toBeTruthy();
    expect(screen.getByText("令和5年産")).toBeTruthy();
    expect(screen.getByText("データなし")).toBeTruthy();

    const link = screen.getByRole("link", { name: /e-Stat/ });
    expect(link.getAttribute("href")).toBe(source.url);
    expect(link.textContent).toContain("公式出典");
  });

  test("renders categorical items in declared order with text labels", () => {
    const legend: LayerLegend = {
      kind: "categorical",
      title: "供給状態",
      missingLabel: "データなし",
      items: [
        { colorToken: "accent", label: "供給拠点" },
        { colorToken: "watch", label: "要監視" },
        { colorToken: "normal", label: "通常" }
      ]
    };

    render(
      <MapLegend
        legend={legend}
        periodLabel="2026年"
        sourceIds={[]}
        sources={[]}
        themePalette={getThemePalette("energy")}
      />
    );

    const list = screen.getByRole("list", { name: "供給状態" });
    expect(Array.from(list.querySelectorAll("li")).map((item) => item.textContent)).toEqual([
      "供給拠点",
      "要監視",
      "通常"
    ]);
  });
});
