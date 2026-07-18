// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { validateMetricSeries } from "../../lib/presentation/metric-series";
import { buildMetricSeries, getLayerDefinition } from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import type { MetricSeriesPoint } from "../../types/presentation";
import type { SourceDocument } from "../../types/semantic";
import { ComparisonPanel } from "../ComparisonPanel";

afterEach(cleanup);

describe("ComparisonPanel", () => {
  test("renders and sorts the complete official rice harvest series", async () => {
    const user = userEvent.setup();
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const layer = getLayerDefinition("rice", "rice-harvest")!;
    const onSelect = vi.fn();

    render(
      <ComparisonPanel
        activeId="prefecture:tokyo"
        layer={layer}
        onClose={vi.fn()}
        onSelect={onSelect}
        series={buildMetricSeries(graph, "rice", "rice-harvest")}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("heading", { name: "収穫量を比較" })).toBe(document.activeElement);
    expect(screen.getAllByRole("row")).toHaveLength(48);
    expect(screen.getByText(/トン \/ 令和5年産/)).toBeTruthy();
    const niigata = screen.getByRole("button", { name: "新潟県" });
    expect(niigata).toBeTruthy();
    const niigataRow = niigata.closest("tr")!;
    expect(within(niigataRow).getByText("514,100")).toBeTruthy();
    expect(within(niigataRow).getAllByText("514,100")).toHaveLength(1);
    const source = screen.getByRole("link", { name: /e-Stat/ });
    expect(source.getAttribute("href")).toBe("https://www.e-stat.go.jp/dbview?sid=0002114508");

    await user.click(screen.getByRole("button", { name: "地域名で並べ替え" }));
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[0]).getByRole("button", { name: /愛知県/ })).toBeTruthy();

    await user.click(niigata);
    expect(onSelect).toHaveBeenCalledWith("prefecture:niigata");
  });

  test.each([
    {
      name: "mixed units",
      series: [point("a", "トン", "令和5年産"), point("b", "%", "令和5年産")],
      message: "単位が混在"
    },
    {
      name: "mixed periods",
      series: [point("a", "トン", "令和5年産"), point("b", "トン", "令和4年産")],
      message: "期間が混在"
    }
  ])("rejects $name instead of silently comparing", ({ message, series }) => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    render(
      <ComparisonPanel
        activeId=""
        layer={getLayerDefinition("rice", "rice-harvest")!}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        series={series}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(message);
    expect(screen.queryByRole("table")).toBeNull();
  });

  test.each([
    { name: "blank unit", unit: "", period: "令和5年産", message: "単位が空" },
    { name: "whitespace unit", unit: "   ", period: "令和5年産", message: "単位が空" },
    { name: "blank period", unit: "トン", period: "", message: "期間が空" },
    { name: "whitespace period", unit: "トン", period: "  ", message: "期間が空" }
  ])("rejects $name", ({ message, period, unit }) => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    render(
      <ComparisonPanel
        activeId=""
        layer={getLayerDefinition("rice", "rice-harvest")!}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        series={[point("a", unit, period), point("b", unit, period)]}
        sources={view.sources}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(message);
  });

  test("normalizes metadata and returns only a common official source", () => {
    const result = validateMetricSeries(
      [
        point("a", " トン ", " 令和5年産 ", ["source:common", "source:a"]),
        point("b", "トン", "令和5年産", ["source:common", "source:b"])
      ],
      [source("source:common")]
    );

    expect(result).toEqual({
      comparable: true,
      period: "令和5年産",
      sourceIds: ["source:common"],
      unit: "トン"
    });
  });

  test.each([
    {
      name: "a point without sources",
      series: [point("a", "トン", "令和5年産", []), point("b")],
      sources: [source("source:common")],
      message: "出典がない"
    },
    {
      name: "no source common to every point",
      series: [point("a", "トン", "令和5年産", ["source:a"]), point("b", "トン", "令和5年産", ["source:b"])],
      sources: [source("source:a"), source("source:b")],
      message: "共通する出典がない"
    },
    {
      name: "an unresolved common source",
      series: [point("a", "トン", "令和5年産", ["source:missing"]), point("b", "トン", "令和5年産", ["source:missing"])],
      sources: [source("source:other")],
      message: "公式出典を確認できない"
    },
    {
      name: "a non-official common source",
      series: [point("a"), point("b")],
      sources: [source("source:common", { official: false })],
      message: "公式出典を確認できない"
    },
    {
      name: "a common source without a real URL",
      series: [point("a"), point("b")],
      sources: [source("source:common", { url: "   " })],
      message: "公式出典を確認できない"
    }
  ])("rejects $name", ({ message, series, sources }) => {
    const result = validateMetricSeries(series, sources);

    expect(result.comparable).toBe(false);
    if (!result.comparable) {
      expect(result.message).toContain(message);
    }
  });

  test("discloses only official sources common to every row", () => {
    const graph = loadSeedGraph();
    render(
      <ComparisonPanel
        activeId=""
        layer={getLayerDefinition("rice", "rice-harvest")!}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        series={[
          point("a", "トン", "令和5年産", ["source:common", "source:a"]),
          point("b", "トン", "令和5年産", ["source:common", "source:b"])
        ]}
        sources={[source("source:common"), source("source:a"), source("source:b")]}
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "source:common" })).toBeTruthy();
  });
});

function point(
  id: string,
  unit = "トン",
  period = "令和5年産",
  sourceIds = ["source:common"]
): MetricSeriesPoint {
  return { id, label: id, value: 1, unit, period, sourceIds };
}

function source(id: string, overrides: Partial<SourceDocument> = {}): SourceDocument {
  return {
    id,
    label: id,
    url: "https://example.go.jp/data",
    publisher: "公式",
    accessed: "2026-07-18",
    official: true,
    ...overrides
  };
}
