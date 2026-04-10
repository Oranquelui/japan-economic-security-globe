import { describe, expect, test } from "vitest";

import { toStableSvgNumber } from "../svg";

describe("SVG presentation helpers", () => {
  test("rounds floating point coordinates so server and browser markup stay stable", () => {
    expect(toStableSvgNumber(49.067332602633954)).toBe(49.067);
    expect(toStableSvgNumber(49.06733260263397)).toBe(49.067);
  });
});
