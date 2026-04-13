// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
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
});
