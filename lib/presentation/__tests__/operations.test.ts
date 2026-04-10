import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { getThemeView } from "../../semantic/selectors";
import { buildOperationRows, filterOperationRows, getOperationModeLabel } from "../operations";

describe("operations presentation model", () => {
  test("builds map operations rows from flows, observations, and Japan landing entities", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");

    const rows = buildOperationRows(view);

    expect(rows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "flow:qatar-lng-japan",
        "observation:lng-electricity-april-2026",
        "terminal:sodegaura-lng"
      ])
    );
    expect(rows.find((row) => row.id === "flow:qatar-lng-japan")).toMatchObject({
      type: "依存ルート",
      urgency: "高",
      status: "監視中"
    });
  });

  test("uses Japanese operation map mode labels", () => {
    expect(getOperationModeLabel("route")).toBe("ルート");
    expect(getOperationModeLabel("choropleth")).toBe("地域塗り");
  });

  test("filters operation rows by Japanese search text", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");
    const rows = buildOperationRows(view);

    const filtered = filterOperationRows(rows, "LNG");

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((row) => `${row.label} ${row.subject} ${row.type}`.includes("LNG"))).toBe(true);
  });
});
