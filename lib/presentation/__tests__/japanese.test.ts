import { describe, expect, test } from "vitest";

import { getThemeLabel, localizeFlowLabel, localizeKind, localizeSummary } from "../japanese";

describe("Japanese presentation helpers", () => {
  test("localizes the public UI labels used by the main map and evidence drawer", () => {
    expect(getThemeLabel("energy").label).toBe("エネルギー");
    expect(localizeKind("DependencyFlow")).toBe("依存フロー");
    expect(localizeFlowLabel("flow:qatar-lng-japan", "Qatar LNG to Japan")).toBe("カタールLNG → 日本");
    expect(localizeSummary("flow:qatar-lng-japan", "fallback")).toContain("LNG");
  });
});
