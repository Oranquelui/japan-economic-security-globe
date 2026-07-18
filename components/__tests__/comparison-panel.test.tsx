// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getThemePalette } from "../../lib/presentation/palette";
import { buildMetricSeries, getLayerDefinition } from "../../lib/presentation/workspace";
import { getThemeView } from "../../lib/semantic/selectors";
import type { MetricSeriesPoint } from "../../types/presentation";
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
    const niigata = screen.getByRole("button", { name: /新潟県 514,100/ });
    expect(niigata).toBeTruthy();
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
});

function point(id: string, unit: string, period: string): MetricSeriesPoint {
  return { id, label: id, value: 1, unit, period, sourceIds: ["source:estat-rice-prefecture-harvest-r5"] };
}
