import { describe, expect, test } from "vitest";

import { resolveHomepageMode } from "../homepage-mode";

describe("resolveHomepageMode", () => {
  test("defaults to app unless default mode is explicitly requested", () => {
    expect(resolveHomepageMode("app")).toBe("app");
    expect(resolveHomepageMode(undefined)).toBe("app");
    expect(resolveHomepageMode("bogus")).toBe("app");
    expect(resolveHomepageMode("default")).toBe("default");
  });
});
