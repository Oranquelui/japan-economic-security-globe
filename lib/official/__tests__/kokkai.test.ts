import { describe, expect, test, vi } from "vitest";

import {
  buildKokkaiSpeechUrl,
  fetchKokkaiSpeeches,
  normalizeKokkaiSpeechRecord
} from "../kokkai";

const sampleSpeechRecord = {
  speechID: "0001",
  issueID: "100001234X00120250401",
  imageKind: "会議録",
  searchObject: "本文",
  session: 217,
  nameOfHouse: "衆議院",
  nameOfMeeting: "経済産業委員会",
  issue: "1",
  date: "2025-04-01",
  closing: false,
  speechOrder: 12,
  speaker: "山田太郎",
  speakerYomi: "やまだたろう",
  speakerGroup: "自由民主党",
  speakerPosition: "大臣政務官",
  speakerRole: "答弁",
  speech: "経済安全保障とサプライチェーン強靱化について答弁します。",
  startPage: 4,
  createTime: "2025-04-01T09:00:00+09:00",
  updateTime: "2025-04-01T09:15:00+09:00",
  speechURL: "https://kokkai.ndl.go.jp/txt/0001",
  meetingURL: "https://kokkai.ndl.go.jp/meeting/0001",
  pdfURL: "https://kokkai.ndl.go.jp/pdf/0001.pdf"
};

describe("kokkai official adapter", () => {
  test("builds a speech search URL with json packing", () => {
    const url = new URL(
      buildKokkaiSpeechUrl({
        any: "経済安全保障",
        speaker: "山田太郎",
        maximumRecords: 5,
        from: "2025-01-01",
        until: "2025-04-01"
      })
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://kokkai.ndl.go.jp/api/speech");
    expect(url.searchParams.get("recordPacking")).toBe("json");
    expect(url.searchParams.get("any")).toBe("経済安全保障");
    expect(url.searchParams.get("speaker")).toBe("山田太郎");
    expect(url.searchParams.get("maximumRecords")).toBe("5");
    expect(url.searchParams.get("from")).toBe("2025-01-01");
    expect(url.searchParams.get("until")).toBe("2025-04-01");
  });

  test("normalizes a speech record into a stable internal shape", () => {
    expect(normalizeKokkaiSpeechRecord(sampleSpeechRecord)).toEqual({
      id: "0001",
      issueId: "100001234X00120250401",
      house: "衆議院",
      meeting: "経済産業委員会",
      issue: "1",
      spokenOn: "2025-04-01",
      speaker: "山田太郎",
      speakerGroup: "自由民主党",
      speakerPosition: "大臣政務官",
      text: "経済安全保障とサプライチェーン強靱化について答弁します。",
      speechUrl: "https://kokkai.ndl.go.jp/txt/0001",
      meetingUrl: "https://kokkai.ndl.go.jp/meeting/0001",
      pdfUrl: "https://kokkai.ndl.go.jp/pdf/0001.pdf"
    });
  });

  test("fetches and normalizes a speech search response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          numberOfRecords: 1,
          numberOfReturn: 1,
          startRecord: 1,
          nextRecordPosition: 2,
          speechRecord: [sampleSpeechRecord]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await fetchKokkaiSpeeches({ any: "経済安全保障", maximumRecords: 1 }, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.totalRecords).toBe(1);
    expect(result.returnedRecords).toBe(1);
    expect(result.nextStartRecord).toBe(2);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: "0001",
        speaker: "山田太郎",
        meeting: "経済産業委員会"
      })
    );
  });
});
