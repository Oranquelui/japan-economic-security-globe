import { describe, expect, test } from "vitest";

import {
  getEstatSeriesByPriority,
  getEstatSeriesForTheme,
  getFirstVerticalSliceSeries,
  getSpineSeriesForTheme
} from "../estat-theme-map";

describe("estat theme map", () => {
  test("orders series by implementation priority", () => {
    const ordered = getEstatSeriesByPriority();
    expect(ordered.length).toBeGreaterThan(3);
    for (let index = 1; index < ordered.length; index += 1) {
      expect(ordered[index].priority).toBeGreaterThanOrEqual(ordered[index - 1].priority);
    }
  });

  test("first vertical slice is the seeded rice harvest family", () => {
    const slice = getFirstVerticalSliceSeries();
    expect(slice.id).toBe("rice-harvest-prefecture");
    expect(slice.themeIds).toContain("rice");
    expect(slice.status).toBe("seeded");
    expect(slice.sourceIds.some((id) => id.includes("estat"))).toBe(true);
  });

  test("rice theme has at least one spine series and energy has planned domestic spine", () => {
    const riceSpine = getSpineSeriesForTheme("rice");
    const energy = getEstatSeriesForTheme("energy");

    expect(riceSpine.length).toBeGreaterThan(0);
    expect(energy.some((series) => series.id === "energy-electricity-regional")).toBe(true);
  });

  test("trade critical goods remains context-only so e-Stat is not overclaimed", () => {
    const trade = getEstatSeriesByPriority().find((series) => series.id === "trade-critical-goods");
    expect(trade?.status).toBe("context-only");
  });
});
