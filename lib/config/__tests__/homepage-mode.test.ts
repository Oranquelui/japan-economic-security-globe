import { describe, expect, test } from "vitest";

import { resolveHomepageMode } from "../homepage-mode";

describe("resolveHomepageMode", () => {
  test("returns app only for the supported app mode value", () => {
    expect(resolveHomepageMode("app")).toBe("app");
    expect(resolveHomepageMode(undefined)).toBe("default");
    expect(resolveHomepageMode("bogus")).toBe("default");
  });
});
