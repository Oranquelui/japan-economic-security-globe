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

  test("provides a subdued map canvas with readable panel surfaces", () => {
    const energy = getThemePalette("energy");
    const logistics = getThemePalette("logistics");
    const status = getStatusPalette();

    expect(energy.surfaceCanvas).toBe("#c8d2d6");
    expect(logistics.accent).toBe("#42a6bd");
    expect(status.selected).toBe("#f0c95a");
    expect(energy.surfacePanel).toContain("0.9");
    expect(energy.textPrimary).toBe("#f5f7fa");
  });
});
