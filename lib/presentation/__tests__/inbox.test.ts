import { describe, expect, test } from "vitest";

import type { OperationRow } from "../operations";
import { buildInboxSections } from "../inbox";

const rows: OperationRow[] = [
  {
    id: "flow:qatar-lng-japan",
    type: "海上ルート依存",
    label: "カタールLNG → 日本",
    subject: "LNG",
    urgency: "高",
    status: "監視中",
    action: "LNG調達と電気料金の連動を確認",
    period: "2026"
  },
  {
    id: "observation:rice-price-signal-2026",
    type: "価格圧力",
    label: "コメ価格圧力シグナル",
    subject: "コメ",
    urgency: "高",
    status: "要確認",
    action: "価格の持続性と家計への波及を確認",
    period: "2026年2月"
  },
  {
    id: "terminal:sodegaura-lng",
    type: "国内着地点",
    label: "袖ケ浦LNG受入基地",
    subject: "国内着地点",
    urgency: "通常",
    status: "表示対象",
    action: "どこで国内影響に変わるかを確認",
    period: "第0段階"
  },
  {
    id: "prefecture:niigata",
    type: "都道府県",
    label: "新潟県",
    subject: "国内着地点",
    urgency: "通常",
    status: "表示対象",
    action: "地域影響を確認",
    period: "第0段階"
  },
  {
    id: "observation:semiconductor-policy-signal-2026",
    type: "産業基盤政策",
    label: "半導体産業基盤の政策シグナル",
    subject: "政策文書",
    urgency: "中",
    status: "要確認",
    action: "設備投資と政策文書、貿易統計の接続を確認",
    period: "2026"
  }
];

describe("inbox sections", () => {
  test("groups rows into user-facing monitoring sections", () => {
    const sections = buildInboxSections(rows);

    expect(sections.map((section) => section.id)).toEqual(["priority", "watch", "domestic"]);
    expect(sections[0].rows.map((row) => row.id)).toEqual([
      "observation:rice-price-signal-2026",
      "flow:qatar-lng-japan",
      "observation:semiconductor-policy-signal-2026"
    ]);
    expect(sections[1].rows.map((row) => row.id)).toEqual([]);
    expect(sections[2].rows.map((row) => row.id)).toEqual([
      "terminal:sodegaura-lng",
      "prefecture:niigata"
    ]);
  });
});
