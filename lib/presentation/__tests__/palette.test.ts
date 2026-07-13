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

  test("provides a night-atlas map canvas with readable panel surfaces", () => {
    const energy = getThemePalette("energy");
    const logistics = getThemePalette("logistics");
    const status = getStatusPalette();

    expect(energy.surfaceCanvas).toBe("#0a121c");
    expect(logistics.accent).toBe("#4ec4d9");
    expect(status.selected).toBe("#f2c96a");
    expect(energy.surfacePanel).toContain("0.92");
    expect(energy.textPrimary).toBe("#eef4fb");
  });
});
