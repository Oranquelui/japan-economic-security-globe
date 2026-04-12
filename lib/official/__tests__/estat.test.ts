import { describe, expect, test, vi } from "vitest";

import {
  buildEstatApiUrl,
  fetchEstatMetaInfo,
  fetchEstatStatsData,
  fetchEstatStatsList,
  normalizeEstatMetaInfoResponse,
  normalizeEstatStatsDataResponse,
  normalizeEstatStatsListResponse,
  resolveEstatAppId
} from "../estat";

const sampleStatsListPayload = {
  GET_STATS_LIST: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: ""
    },
    DATALIST_INF: {
      NUMBER: 1,
      FROM_NUMBER: 1,
      TO_NUMBER: 1,
      NEXT_KEY: 2,
      TABLE_INF: [
        {
          ID: "0003412313",
          STAT_NAME: { $: "小売物価統計調査" },
          GOV_ORG: { $: "総務省" },
          STATISTICS_NAME: { $: "小売物価統計調査" },
          TITLE: { $: "東京都区部 小売価格" },
          CYCLE: "月次",
          SURVEY_DATE: "202501",
          OPEN_DATE: "2025-02-28"
        }
      ]
    }
  }
};

const sampleMetaInfoPayload = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: ""
    },
    META_INFO: {
      TABLE_INF: {
        ID: "0003412313",
        TITLE: { $: "東京都区部 小売価格" }
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "time",
            "@name": "時間軸",
            CLASS: [
              {
                "@code": "2025010000",
                $: "2025年1月"
              }
            ]
          }
        ]
      }
    }
  }
};

const sampleLiveLikeMetaInfoPayload = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: ""
    },
    METADATA_INF: {
      TABLE_INF: {
        "@id": "0002114508",
        TITLE: { $: "米 水陸稲の収穫量 水稲（全国農業地域別・都道府県別）" }
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            "@name": "(F002-05-2-001)全国農業地域・都道府県",
            CLASS: [
              {
                "@code": "1013",
                "@name": "(都道府県)_北海道"
              }
            ]
          }
        ]
      }
    }
  }
};

const sampleStatsDataPayload = {
  GET_STATS_DATA: {
    RESULT_INF: {
      STATUS: 0,
      ERROR_MSG: ""
    },
    STATISTICAL_DATA: {
      TABLE_INF: {
        ID: "0003412313",
        TITLE: { $: "東京都区部 小売価格" }
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "time",
            "@name": "時間軸",
            CLASS: [
              {
                "@code": "2025010000",
                $: "2025年1月"
              }
            ]
          }
        ]
      },
      DATA_INF: {
        VALUE: [
          {
            "@time": "2025010000",
            "@area": "13000",
            "$": "2816"
          }
        ]
      }
    }
  }
};

describe("estat official adapter", () => {
  test("builds a getStatsList URL under the app/json endpoint", () => {
    const url = new URL(
      buildEstatApiUrl("getStatsList", {
        appId: "demo-app-id",
        searchWord: "米",
        limit: 10
      })
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList");
    expect(url.searchParams.get("appId")).toBe("demo-app-id");
    expect(url.searchParams.get("searchWord")).toBe("米");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  test("requires appId for authenticated estat requests", () => {
    expect(() =>
      buildEstatApiUrl("getStatsData", {
        statsDataId: "0000000000"
      })
    ).toThrow("appId is required");
  });

  test("falls back to ESTAT_APP_ID when appId is not passed directly", () => {
    const url = new URL(
      buildEstatApiUrl(
        "getMetaInfo",
        {
          statsDataId: "0003412313"
        },
        "https://api.e-stat.go.jp/rest",
        "3.0",
        "env-app-id"
      )
    );

    expect(url.searchParams.get("appId")).toBe("env-app-id");
    expect(resolveEstatAppId(undefined, "env-app-id")).toBe("env-app-id");
  });

  test("normalizes stats list payload into a stable result", () => {
    expect(normalizeEstatStatsListResponse(sampleStatsListPayload)).toEqual({
      status: 0,
      errorMessage: "",
      totalCount: 1,
      fromNumber: 1,
      toNumber: 1,
      nextKey: "2",
      items: [
        {
          statsDataId: "0003412313",
          statName: "小売物価統計調査",
          govOrg: "総務省",
          statisticsName: "小売物価統計調査",
          title: "東京都区部 小売価格",
          cycle: "月次",
          surveyDate: "202501",
          openDate: "2025-02-28"
        }
      ]
    });
  });

  test("normalizes meta info payload into table + class objects", () => {
    expect(normalizeEstatMetaInfoResponse(sampleMetaInfoPayload)).toEqual({
      status: 0,
      errorMessage: "",
      table: {
        statsDataId: "0003412313",
        title: "東京都区部 小売価格"
      },
      classes: [
        {
          id: "time",
          name: "時間軸",
          entries: [
            {
              code: "2025010000",
              label: "2025年1月"
            }
          ]
        }
      ]
    });
  });

  test("normalizes live-like meta info payloads from METADATA_INF and @name fields", () => {
    expect(normalizeEstatMetaInfoResponse(sampleLiveLikeMetaInfoPayload)).toEqual({
      status: 0,
      errorMessage: "",
      table: {
        statsDataId: "0002114508",
        title: "米 水陸稲の収穫量 水稲（全国農業地域別・都道府県別）"
      },
      classes: [
        {
          id: "cat01",
          name: "(F002-05-2-001)全国農業地域・都道府県",
          entries: [
            {
              code: "1013",
              label: "(都道府県)_北海道"
            }
          ]
        }
      ]
    });
  });

  test("normalizes stats data payload into rows with dimensions", () => {
    expect(normalizeEstatStatsDataResponse(sampleStatsDataPayload)).toEqual({
      status: 0,
      errorMessage: "",
      table: {
        statsDataId: "0003412313",
        title: "東京都区部 小売価格"
      },
      classes: [
        {
          id: "time",
          name: "時間軸",
          entries: [
            {
              code: "2025010000",
              label: "2025年1月"
            }
          ]
        }
      ],
      rows: [
        {
          value: "2816",
          dimensions: {
            time: "2025010000",
            area: "13000"
          }
        }
      ]
    });
  });

  test("fetches and normalizes getStatsList results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleStatsListPayload), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await fetchEstatStatsList(
      {
        searchWord: "米",
        limit: 1
      },
      fetcher,
      "env-app-id"
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.items[0]?.statsDataId).toBe("0003412313");
    expect(result.nextKey).toBe("2");
  });

  test("fetches and normalizes getMetaInfo results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleMetaInfoPayload), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await fetchEstatMetaInfo(
      {
        statsDataId: "0003412313"
      },
      fetcher,
      "env-app-id"
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.table?.statsDataId).toBe("0003412313");
    expect(result.classes[0]?.entries[0]?.label).toBe("2025年1月");
  });

  test("fetches and normalizes getStatsData results", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(sampleStatsDataPayload), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await fetchEstatStatsData(
      {
        statsDataId: "0003412313",
        metaGetFlg: "Y",
        limit: 1
      },
      fetcher,
      "env-app-id"
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.rows[0]?.value).toBe("2816");
    expect(result.rows[0]?.dimensions.area).toBe("13000");
  });
});
