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

  test("provides dark system surfaces for the operating picture", () => {
    const energy = getThemePalette("energy");

    expect(energy.surfaceCanvas).toMatch(/^#/);
    expect(energy.surfacePanel).toMatch(/^#/);
    expect(energy.textPrimary).toBe("#f3f6fa");
  });
});
