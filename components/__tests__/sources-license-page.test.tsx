// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { SourcesLicensePage } from "../SourcesLicensePage";

afterEach(() => {
  cleanup();
});

describe("SourcesLicensePage", () => {
  test("renders the approved sections, source groups, and page-specific footer navigation", () => {
    render(<SourcesLicensePage sources={loadSeedGraph().sources} />);

    expect(screen.getByRole("heading", { name: "このサイトの利用方針" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "出典ソース一覧" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "ライセンス / 権利処理" })).toBeTruthy();
    expect(screen.getByText("政府・公的機関ソース")).toBeTruthy();
    expect(screen.getByText("公開・オープンデータ")).toBeTruthy();
    expect(screen.getByText("民間企業ソース")).toBeTruthy();

    expect(screen.getByRole("contentinfo")).toBeTruthy();
    const mainLink = screen.getByRole("link", { name: "Main (App)" });
    expect(mainLink.getAttribute("href")).toBe("/");
    expect(mainLink.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "共有" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sources/License" }).getAttribute("href")).toBe("/sources-license");
    expect(screen.getByRole("link", { name: "問い合わせ" }).getAttribute("href")).toBe("/contact");
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe("https://x.com/quadrillionboss");
  });

  test("renders Natural Earth only as open data with its complete rights and provenance", () => {
    render(<SourcesLicensePage sources={loadSeedGraph().sources} />);

    const openDataSection = screen.getByRole("heading", { name: "公開・オープンデータ" }).closest("section");
    const officialSection = screen.getByRole("heading", { name: "政府・公的機関ソース" }).closest("section");
    const privateSection = screen.getByRole("heading", { name: "民間企業ソース" }).closest("section");
    const sourceLabel = "地図形状: Natural Earth Admin 1（一般化・加工）";

    expect(openDataSection).not.toBeNull();
    expect(officialSection).not.toBeNull();
    expect(privateSection).not.toBeNull();
    const sourceLink = within(openDataSection!).getByRole("link", { name: sourceLabel });
    expect(sourceLink.getAttribute("href")).toBe(
      "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/"
    );
    expect(sourceLink.getAttribute("target")).toBe("_blank");
    expect(sourceLink.getAttribute("rel")).toBe("noreferrer");
    expect(within(officialSection!).queryByRole("link", { name: sourceLabel })).toBeNull();
    expect(within(privateSection!).queryByRole("link", { name: sourceLabel })).toBeNull();

    const rights = within(openDataSection!).getByTestId("source-rights");
    for (const field of [
      "利用条件",
      "ソース版",
      "固定取得元",
      "SHA-256",
      "加工内容",
      "精度・境界の制約"
    ]) {
      expect(within(rights).getByText(field)).toBeTruthy();
    }
    expect(rights.textContent).toContain("Public domain");
    expect(rights.textContent).toContain("Natural Earth 5.1.1");
    expect(rights.textContent).toContain("efc59726337323058f9446210adc96673179cd344e053666ee3d28cb58ba2b05");
    expect(rights.textContent).toContain(
      "Natural Earth 5.1.1 Admin-1 States, Provinces を日本の47都道府県に絞り、本サービスの全国表示向けに属性整理・簡略化して作成"
    );
    expect(rights.textContent).toContain(
      "Natural Earth Admin-1 は beta で、原則として de facto（実効支配）境界を採用した一般化地図です。日本政府の領土・管轄に関する公式見解を示すものではなく、法令、測量、境界確定その他の正確な行政区域確認には使用できません。"
    );

    const termsLink = within(rights).getByRole("link", { name: "Public domain" });
    expect(termsLink.getAttribute("href")).toBe("https://www.naturalearthdata.com/about/terms-of-use/");
    expect(termsLink.getAttribute("target")).toBe("_blank");
    expect(termsLink.getAttribute("rel")).toBe("noreferrer");
    const archiveLink = within(rights).getByRole("link", { name: "固定アーカイブ" });
    expect(archiveLink.getAttribute("href")).toBe(
      "https://naciscdn.org/naturalearth/5.1.1/10m/cultural/ne_10m_admin_1_states_provinces.zip"
    );
    expect(archiveLink.getAttribute("target")).toBe("_blank");
    expect(archiveLink.getAttribute("rel")).toBe("noreferrer");
  });

  test("does not add a rights block to existing cards without structured rights metadata", () => {
    const sources = loadSeedGraph().sources.filter(
      (source) => source.id === "source:estat-rice-prefecture-harvest-r5"
    );

    render(<SourcesLicensePage sources={sources} />);

    expect(screen.queryByTestId("source-rights")).toBeNull();
  });
});
