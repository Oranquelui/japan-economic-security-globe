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
    const sections = buildInboxSections("energy", rows);

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

  test("uses rice-specific domestic section copy", () => {
    const sections = buildInboxSections("rice", rows);

    expect(sections[2]).toEqual(
      expect.objectContaining({
        id: "domestic",
        label: "国内主要地域",
        description: "e-Stat の主食用収穫量と供給拠点で見る、コメの国内基盤"
      })
    );
  });

  test("orders domestic rows by strategic anchor before prefectural regions", () => {
    const sections = buildInboxSections("energy", [
      ...rows,
      {
        id: "refinery:mizushima",
        type: "製油所",
        label: "水島製油所",
        subject: "国内着地点",
        urgency: "通常",
        status: "表示対象",
        action: "国内精製の偏りを確認",
        period: "第0段階"
      }
    ]);

    expect(sections[2].rows.slice(0, 2).map((row) => row.id)).toEqual([
      "refinery:mizushima",
      "terminal:sodegaura-lng"
    ]);
  });

  test("keeps ranked rows ahead of unranked ones within each monitoring section", () => {
    const sections = buildInboxSections("energy", [
      {
        id: "watch-2",
        type: "海上ルート依存",
        label: "監視2",
        subject: "LNG",
        urgency: "通常",
        status: "監視中",
        action: "確認",
        period: "2026",
        ranking: {
          finalScore: 0.81,
          primaryAxis: "energy",
          primaryAxisLabel: "エネルギー",
          priorityTier: "critical",
          rank: 2,
          signalId: "ranking-signal:watch-2",
          topComponentId: "nationalImportance",
          whyRanked: "国家的重要度が高い。"
        }
      },
      {
        id: "watch-1",
        type: "海上ルート依存",
        label: "監視1",
        subject: "LNG",
        urgency: "通常",
        status: "監視中",
        action: "確認",
        period: "2026",
        ranking: {
          finalScore: 0.88,
          primaryAxis: "energy",
          primaryAxisLabel: "エネルギー",
          priorityTier: "critical",
          rank: 1,
          signalId: "ranking-signal:watch-1",
          topComponentId: "nationalImportance",
          whyRanked: "国家的重要度が高い。"
        }
      },
      {
        id: "watch-3",
        type: "海上ルート依存",
        label: "監視3",
        subject: "LNG",
        urgency: "通常",
        status: "監視中",
        action: "確認",
        period: "2026"
      }
    ] as OperationRow[]);

    expect(sections[1].rows.map((row) => row.id)).toEqual(["watch-1", "watch-2", "watch-3"]);
  });
});
