import { describe, expect, test } from "vitest";

import { summarizeSourceStatus } from "../source-freshness";
import type { SourceDocument } from "../../../types/semantic";

function source(overrides: Partial<SourceDocument>): SourceDocument {
  return {
    id: overrides.id ?? "source:test",
    label: overrides.label ?? "Test source",
    url: overrides.url ?? "https://example.test/source",
    publisher: overrides.publisher ?? "Example publisher",
    accessed: overrides.accessed ?? "2026-04-18",
    official: overrides.official,
    accessMode: overrides.accessMode,
    tier: overrides.tier
  };
}

describe("source status summary", () => {
  test("summarizes official, api-like, document, and freshness counts for theme sources", () => {
    const summary = summarizeSourceStatus(
      [
        source({ id: "source:estat", accessed: "2026-04-18", official: true, accessMode: "api" }),
        source({ id: "source:lod", accessed: "2026-04-16", official: true, accessMode: "sparql" }),
        source({ id: "source:whitepaper", accessed: "2026-04-12", official: true, accessMode: "pdf" }),
        source({ id: "source:utility", accessed: "2026-04-01", official: false, accessMode: "html" })
      ],
      new Date("2026-04-18T00:00:00.000Z")
    );

    expect(summary).toEqual({
      totalSources: 4,
      officialSources: 3,
      apiLikeSources: 2,
      documentSources: 2,
      staleSources: 1,
      freshestAccessed: "2026-04-18",
      oldestAccessed: "2026-04-01",
      overallTone: "stale"
    });
  });

  test("detects stale sources using a fixed reference date", () => {
    const summary = summarizeSourceStatus(
      [source({ id: "source:stale", accessed: "2026-04-10", official: true, accessMode: "html" })],
      new Date("2026-04-18T09:00:00+09:00")
    );

    expect(summary.staleSources).toBe(1);
    expect(summary.overallTone).toBe("stale");
    expect(summary.oldestAccessed).toBe("2026-04-10");
    expect(summary.freshestAccessed).toBe("2026-04-10");
  });

  test("keeps all-fresh theme sources in the fresh tone", () => {
    const summary = summarizeSourceStatus(
      [
        source({ id: "source:today", accessed: "2026-04-18", official: true, accessMode: "api" }),
        source({ id: "source:yesterday", accessed: "2026-04-17", official: true, accessMode: "pdf" })
      ],
      new Date("2026-04-18T00:00:00.000Z")
    );

    expect(summary.staleSources).toBe(0);
    expect(summary.overallTone).toBe("fresh");
  });
});
