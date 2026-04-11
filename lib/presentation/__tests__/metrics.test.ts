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

    expect(metrics).toEqual([
      expect.objectContaining({ id: "displayed", value: 8 }),
      expect.objectContaining({ id: "high-risk", value: 3 }),
      expect.objectContaining({ id: "monitoring", value: 3 }),
      expect.objectContaining({ id: "domestic-impacts", value: 4 }),
      expect.objectContaining({ id: "sources", value: 4 })
    ]);
  });
});
