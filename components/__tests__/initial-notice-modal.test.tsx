// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { HOMEPAGE_NOTICE_STORAGE_KEY, InitialNoticeModal } from "../InitialNoticeModal";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("InitialNoticeModal", () => {
  test("renders the first-visit notice as a non-blocking status notice in homepage app mode", async () => {
    render(<InitialNoticeModal homepageMode="app" locale="ja" />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "MVP/テスト運用中" })).toBeTruthy();
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("MVP/テスト運用中")).toBeTruthy();
    expect(screen.getByText("無料公開中")).toBeTruthy();
    expect(screen.getByText("更新: 国内物流監視と地形地図を追加しました")).toBeTruthy();
    expect(screen.getByText("仕様は予告なく変更される場合があります")).toBeTruthy();
    expect(screen.getByAltText("Homepage notice seal").getAttribute("src")).toBe("/brand/homepage-notice-seal.webp");
  });

  test("does not render when the notice was already dismissed", () => {
    window.localStorage.setItem(HOMEPAGE_NOTICE_STORAGE_KEY, "dismissed");

    render(<InitialNoticeModal homepageMode="app" locale="ja" />);

    expect(screen.queryByRole("region", { name: "MVP/テスト運用中" })).toBeNull();
  });

  test("persists dismissal when the close button is pressed", async () => {
    render(<InitialNoticeModal homepageMode="app" locale="ja" />);

    const closeButton = await screen.findByRole("button", { name: "お知らせを閉じる" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "MVP/テスト運用中" })).toBeNull();
    });

    expect(window.localStorage.getItem(HOMEPAGE_NOTICE_STORAGE_KEY)).toBe("dismissed");
  });

  test("closes on Escape and stores the dismissal state", async () => {
    render(<InitialNoticeModal homepageMode="app" locale="ja" />);

    await screen.findByRole("region", { name: "MVP/テスト運用中" });
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "MVP/テスト運用中" })).toBeNull();
    });

    expect(window.localStorage.getItem(HOMEPAGE_NOTICE_STORAGE_KEY)).toBe("dismissed");
  });
});
