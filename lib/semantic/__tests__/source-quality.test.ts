import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";

describe("source quality", () => {
  test("uses a concrete METI energy source URL instead of the METI homepage", () => {
    const graph = loadSeedGraph();
    const source = graph.sources.find((item) => item.id === "source:meti-2026-energy-taskforce");

    expect(source?.url).toBeDefined();
    expect(source?.url).not.toBe("https://www.meti.go.jp/");
    expect(source?.url).toContain("meti.go.jp");
  });

  test("uses concrete official release pages for rice and water observations", () => {
    const graph = loadSeedGraph();
    const ricePriceSource = graph.sources.find((item) => item.id === "source:maff-rice-policy");
    const riceInventorySource = graph.sources.find((item) => item.id === "source:maff-rice-monthly-report");
    const ricePrefectureSource = graph.sources.find((item) => item.id === "source:estat-rice-prefecture-harvest-r5");
    const waterSource = graph.sources.find((item) => item.id === "source:mlit-drought-portal");

    expect(ricePriceSource?.url).toBe("https://www.maff.go.jp/j/press/nousan/kikaku/260313.html");
    expect(riceInventorySource?.url).toBe("https://www.maff.go.jp/j/press/nousan/kikaku/260331.html");
    expect(ricePrefectureSource?.url).toBe("https://www.e-stat.go.jp/dbview?sid=0002114508");
    expect(waterSource?.url).toBe("https://www.ktr.mlit.go.jp/river/shihon/river_shihon00000226.html");
  });

  test("registers the processed Natural Earth prefecture geometry with immutable provenance", () => {
    const graph = loadSeedGraph();
    const source = graph.sources.find((item) => item.id === "source:natural-earth-admin1-japan-5-1-1");

    expect(source).toEqual({
      id: "source:natural-earth-admin1-japan-5-1-1",
      label: "地図形状: Natural Earth Admin 1（一般化・加工）",
      url: "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/",
      publisher: "Natural Earth",
      accessed: "2026-07-18",
      official: false,
      sourceCategory: "open-data",
      accessMode: "geojson",
      rights: {
        licenseLabel: "Public domain",
        licenseUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
        sourceVersion: "Natural Earth 5.1.1",
        immutableArchiveUrl:
          "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip",
        immutableArchiveSha256: "efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05",
        processingStatement:
          "Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成",
        limitationStatement:
          "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
      }
    });
  });
});
