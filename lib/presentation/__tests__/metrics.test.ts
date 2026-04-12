import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getThemeView } from "../../semantic/selectors";
import { buildOperationRows } from "../operations";
import { buildOperationsMetrics } from "../metrics";

describe("operations metrics", () => {
  test("builds top-line metrics for the current theme", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");
    const rows = buildOperationRows(view);

    const metrics = buildOperationsMetrics(view, rows);

    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "displayed", value: 15 }),
        expect.objectContaining({ id: "high-risk", value: 3 }),
        expect.objectContaining({ id: "monitoring", value: 4 }),
        expect.objectContaining({ id: "domestic-impacts", label: "国内エネルギー拠点", value: 11 }),
        expect.objectContaining({ id: "sources", value: 4 })
      ])
    );
  });

  test("uses rice-specific domestic copy and more than two domestic regions", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const rows = buildOperationRows(view);

    const metrics = buildOperationsMetrics(view, rows);

    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "domestic-impacts",
          label: "国内主要地域",
          description: "e-Stat の主食用収穫量と供給拠点で見る、コメの国内基盤",
          value: 48
        })
      ])
    );
  });
});
