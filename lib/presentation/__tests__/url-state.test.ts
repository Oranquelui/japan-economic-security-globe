import { describe, expect, test } from "vitest";

import { parseOperationsUrlState, serializeOperationsUrlState } from "../url-state";

describe("operations url state", () => {
  test("parses valid query params and falls back on invalid ones", () => {
    expect(
      parseOperationsUrlState({
        theme: "rice",
        mode: "cluster",
        selected: "observation:rice-price-signal-2026"
      })
    ).toEqual({
      mapMode: "cluster",
      selectedId: "observation:rice-price-signal-2026",
      themeId: "rice"
    });

    expect(
      parseOperationsUrlState({
        theme: "invalid",
        mode: "bad",
        selected: ""
      })
    ).toEqual({
      mapMode: "point",
      selectedId: null,
      themeId: "energy"
    });
  });

  test("serializes only non-default state", () => {
    expect(
      serializeOperationsUrlState({
        themeId: "energy",
        mapMode: "point",
        selectedId: null
      })
    ).toBe("");

    expect(
      serializeOperationsUrlState({
        themeId: "rice",
        mapMode: "cluster",
        selectedId: "observation:rice-price-signal-2026"
      })
    ).toBe("theme=rice&mode=cluster&selected=observation%3Arice-price-signal-2026");
  });
});
