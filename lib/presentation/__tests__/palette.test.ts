import { describe, expect, test } from "vitest";

import { getStatusPalette, getThemePalette } from "../palette";

describe("presentation palettes", () => {
  test("separates theme colors from status colors", () => {
    const energy = getThemePalette("energy");
    const rice = getThemePalette("rice");
    const status = getStatusPalette();

    expect(energy.accent).not.toBe(rice.accent);
    expect(energy.accent).not.toBe(status.high);
    expect(status.high).not.toBe(status.normal);
  });

  test("provides a neutral gray map canvas with readable panel surfaces", () => {
    const energy = getThemePalette("energy");

    expect(energy.surfaceCanvas).toBe("#d7dde2");
    expect(energy.surfacePanel).toContain("rgba");
    expect(energy.textPrimary).toBe("#f5f7fa");
  });
});
