// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { SourcesLicensePage } from "../SourcesLicensePage";

afterEach(() => {
  cleanup();
});

describe("SourcesLicensePage", () => {
  test("renders the approved sections and source groups", () => {
    render(<SourcesLicensePage sources={loadSeedGraph().sources} />);

    expect(screen.getByRole("heading", { name: "このサイトの利用方針" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "出典ソース一覧" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "ライセンス / 権利処理" })).toBeTruthy();
    expect(screen.getByText("政府・公的機関ソース")).toBeTruthy();
    expect(screen.getByText("民間企業ソース")).toBeTruthy();
  });
});
