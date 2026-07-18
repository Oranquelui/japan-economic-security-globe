import { describe, expect, test } from "vitest";

import * as semanticModule from "../../../types/semantic";
import { parseOperationsUrlState, serializeOperationsUrlState } from "../url-state";

describe("operations url state", () => {
  test("uses the semantic rice workspace defaults", () => {
    expect(parseOperationsUrlState({})).toEqual({
      themeId: "rice",
      selectedId: null,
      layerId: "rice-harvest",
      mapModeOverride: null,
      workspaceView: "map"
    });
  });

  test("uses a single runtime theme id list for validation", () => {
    const themeIds = (semanticModule as Record<string, unknown>).THEME_IDS;

    expect(themeIds).toEqual(["energy", "logistics", "regional-security", "defense", "semiconductors", "rice", "water"]);

    for (const themeId of themeIds as string[]) {
      expect(parseOperationsUrlState({ theme: themeId }).themeId).toBe(themeId);
    }
  });

  test("gives a valid semantic layer precedence over legacy mode", () => {
    expect(
      parseOperationsUrlState({
        theme: "rice",
        layer: "rice-price",
        mode: "route",
        view: "signals",
        selected: "observation:rice-price-signal-2026"
      })
    ).toEqual({
      themeId: "rice",
      selectedId: "observation:rice-price-signal-2026",
      layerId: "rice-price",
      mapModeOverride: null,
      workspaceView: "signals"
    });
  });

  test("resolves legacy route links to their semantic layer", () => {
    expect(parseOperationsUrlState({ theme: "rice", mode: "route" })).toEqual({
      themeId: "rice",
      selectedId: null,
      layerId: "rice-logistics-inputs",
      mapModeOverride: "route",
      workspaceView: "map"
    });
  });

  test("normalizes unsupported legacy choropleths to point mode", () => {
    expect(parseOperationsUrlState({ theme: "energy", mode: "choropleth" })).toEqual({
      themeId: "energy",
      selectedId: null,
      layerId: "energy-supply",
      mapModeOverride: "point",
      workspaceView: "map"
    });
  });

  test("falls back invalid values while preserving only non-empty selections", () => {
    expect(
      parseOperationsUrlState({
        theme: "invalid",
        layer: "energy-price",
        mode: "bad",
        view: "table",
        selected: ""
      })
    ).toEqual({
      themeId: "rice",
      selectedId: null,
      layerId: "rice-harvest",
      mapModeOverride: null,
      workspaceView: "map"
    });
  });

  test("serializes only non-default semantic state", () => {
    expect(
      serializeOperationsUrlState({
        themeId: "rice",
        selectedId: null,
        layerId: "rice-harvest",
        mapModeOverride: null,
        workspaceView: "map"
      })
    ).toBe("");

    expect(
      serializeOperationsUrlState({
        themeId: "rice",
        selectedId: null,
        layerId: "rice-price",
        mapModeOverride: null,
        workspaceView: "comparison"
      })
    ).toBe("layer=rice-price&view=comparison");
  });

  test("serializes legacy overrides instead of their resolved layer", () => {
    expect(
      serializeOperationsUrlState({
        themeId: "energy",
        selectedId: "flow:saudi-oil-japan",
        layerId: "energy-route",
        mapModeOverride: "route",
        workspaceView: "signals"
      })
    ).toBe("theme=energy&mode=route&view=signals&selected=flow%3Asaudi-oil-japan");
  });
});
