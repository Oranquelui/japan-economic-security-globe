import { describe, expect, test, vi } from "vitest";

import {
  buildBojApiUrl,
  fetchBojMetadata,
  normalizeBojMetadataRecord
} from "../boj";

const sampleMetadataRecord = {
  CLASSIFICATION: "金融市場",
  CODE: "0001",
  SERIES_CODE: "MD100",
  NAME_OF_TIME_SERIES: "Dubai原油輸入価格",
  UNIT: "円/kl",
  FREQUENCY: "Monthly",
  CATEGORY: "Commodity Prices",
  START_OF_THE_TIME_SERIES: "2020-01",
  END_OF_THE_TIME_SERIES: "2026-03",
  LAST_UPDATE: "2026-04-01",
  NOTES: "Sample note"
};

describe("boj official adapter", () => {
  test("builds a metadata URL with query parameters", () => {
    const url = new URL(
      buildBojApiUrl("getMetadata", {
        db: "pr01",
        lang: "en",
        format: "json",
        key: "Dubai"
      })
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://www.stat-search.boj.or.jp/api/v1/getMetadata");
    expect(url.searchParams.get("db")).toBe("pr01");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("format")).toBe("json");
    expect(url.searchParams.get("key")).toBe("Dubai");
  });

  test("normalizes a metadata row into a stable internal shape", () => {
    expect(normalizeBojMetadataRecord(sampleMetadataRecord)).toEqual({
      seriesCode: "MD100",
      name: "Dubai原油輸入価格",
      unit: "円/kl",
      frequency: "Monthly",
      category: "Commodity Prices",
      start: "2020-01",
      end: "2026-03",
      lastUpdate: "2026-04-01",
      notes: "Sample note"
    });
  });

  test("fetches and normalizes metadata response rows", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          STATUS: 0,
          MESSAGEID: "000",
          MESSAGE: "OK",
          DATE: "2026-04-01",
          DB: "pr01",
          RESULTSET: [sampleMetadataRecord]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await fetchBojMetadata(
      {
        db: "pr01",
        lang: "en",
        format: "json",
        key: "Dubai"
      },
      fetcher
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(0);
    expect(result.database).toBe("pr01");
    expect(result.items).toEqual([
      expect.objectContaining({
        seriesCode: "MD100",
        name: "Dubai原油輸入価格"
      })
    ]);
  });
});
