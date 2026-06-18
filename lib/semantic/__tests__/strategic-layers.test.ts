import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";
import { buildOperationRows } from "../../presentation/operations";
import { THEME_IDS } from "../../../types/semantic";
import { getDetailView } from "../detail";
import { getThemeView } from "../selectors";

describe("strategic dependency layers", () => {
  test("adds cross-cutting layers without creating duplicate themes or duplicate inbox rows", () => {
    const graph = loadSeedGraph();

    expect(THEME_IDS).not.toContain("strategic-autonomy");
    expect(THEME_IDS).not.toContain("defense-industrial-base");

    const layers = graph.entities.filter((entity) => entity.kind === "StrategicLayer");
    expect(layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining(["layer:defense-industrial-base", "layer:strategic-autonomy"])
    );

    const layerRows = THEME_IDS.flatMap((themeId) =>
      buildOperationRows(getThemeView(graph, themeId))
        .filter((row) => row.id.startsWith("layer:"))
        .map((row) => `${themeId}:${row.id}`)
    );

    expect(layerRows).toEqual([
      "defense:layer:defense-industrial-base",
      "defense:layer:strategic-autonomy"
    ]);
  });

  test("makes the defense industrial base layer a navigable bridge to concrete capability areas", () => {
    const graph = loadSeedGraph();

    const detail = getDetailView(graph, "layer:defense-industrial-base");

    expect(detail.kind).toBe("StrategicLayer");
    expect(detail.signal.category).toBe("横断レイヤー");
    expect(detail.linkedFlows.map((flow) => flow.id)).toEqual(
      expect.arrayContaining([
        "flow:defense-industrial-base-shipbuilding",
        "flow:defense-industrial-base-munitions",
        "flow:defense-industrial-base-hardening"
      ])
    );
    expect(detail.relatedEntities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining([
        "capability:shipbuilding-sustainment",
        "capability:munitions-stockpile",
        "capability:base-hardening"
      ])
    );
  });
});
