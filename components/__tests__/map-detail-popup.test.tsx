// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loadSeedGraph } from "../../lib/data/seed-loader";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";
import type { RankingExplanationViewModel } from "../../lib/ranking/explain";
import { getDetailView } from "../../lib/semantic/detail";
import { MapDetailPopup } from "../MapDetailPopup";

afterEach(() => {
  cleanup();
});

describe("MapDetailPopup", () => {
  test("renders selected map detail with compact proof and related navigation", () => {
    const graph = loadSeedGraph();
    const detail = getDetailView(graph, "flow:saudi-oil-japan");
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const rankingExplanation = {
      rankLabel: "#1",
      summary: "国家的重要度が高く、日本向けの監視優先度が高い。",
      sourceTrust: { detail: "METI と Trade Statistics を確認。" }
    } as RankingExplanationViewModel;

    render(
      <MapDetailPopup
        detail={detail}
        onClose={onClose}
        onSelect={onSelect}
        rankingExplanation={rankingExplanation}
        routeStatusLabel="ルートあり"
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("energy")}
        themeTitle="エネルギー"
      />
    );

    expect(screen.getByTestId("map-detail-popup")).toBeTruthy();
    expect(screen.getByText("サウジ原油 → 日本")).toBeTruthy();
    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("ルートあり")).toBeTruthy();
    expect(screen.getByText("国家的重要度が高く、日本向けの監視優先度が高い。")).toBeTruthy();
    expect(screen.getByText("METI と Trade Statistics を確認。")).toBeTruthy();
    expect(screen.getAllByText(/出典/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /関連:/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /関連:/ })[0]);
    expect(onSelect).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "地図詳細を閉じる" }));
    expect(onClose).toHaveBeenCalled();
  });
});
