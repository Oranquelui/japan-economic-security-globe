// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";

import { ActionBar } from "../ActionBar";
import { getThemePalette } from "../../lib/presentation/palette";

const themePalette = getThemePalette("rice");

afterEach(() => {
  cleanup();
});

describe("ActionBar", () => {
  test("shows compact product identity and a non-interactive current-view trail", () => {
    render(
      <ActionBar
        currentViewLabel="コメ / 収穫量 / 令和5年産"
        sharePath="/"
        themePalette={themePalette}
      />
    );

    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-testid")).toBe("layout-action-bar");
    expect(within(header).getByRole("heading", { name: "日本レジリエンス地図" })).toBeTruthy();
    expect(within(header).getByText("コメ / 収穫量 / 令和5年産")).toBeTruthy();
    expect(within(header).queryByRole("button", { name: "コメ / 収穫量 / 令和5年産" })).toBeNull();
    expect(within(header).getByRole("button", { name: "メニュー" })).toBeTruthy();

    expect(within(header).queryByText("選択中")).toBeNull();
    expect(within(header).queryByRole("button", { name: "フィルター解除" })).toBeNull();
    expect(within(header).queryByText("依存フロー")).toBeNull();
    expect(within(header).queryByText("サウジ原油 → 日本")).toBeNull();
    expect(within(header).queryByText("概念連関")).toBeNull();
    expect(within(header).queryByText("コメ", { selector: ".ops-chip" })).toBeNull();
  });

  test("preserves the share menu actions", async () => {
    const user = userEvent.setup();

    render(
      <ActionBar
        currentViewLabel="コメ / 収穫量 / 令和5年産"
        sharePath="/?layer=rice-harvest"
        themePalette={themePalette}
      />
    );

    await user.click(screen.getByRole("button", { name: "メニュー" }));

    expect(screen.getByRole("menuitem", { name: "共有" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Sources/License" }).getAttribute("href")).toBe("/sources-license");
    expect(screen.getByRole("menuitem", { name: "問い合わせ" }).getAttribute("href")).toBe("/contact");
  });
});
