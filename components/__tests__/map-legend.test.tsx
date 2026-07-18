// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { getThemePalette } from "../../lib/presentation/palette";
import type { LayerLegend } from "../../types/presentation";
import { MapLegend } from "../MapLegend";

afterEach(cleanup);

describe("MapLegend", () => {
  test("shows continuous bounds, unit, missing-data treatment, and authored map meaning", () => {
    render(
      <MapLegend
        legend={{
          kind: "continuous",
          title: "主食用米収穫量",
          minLabel: "低",
          maxLabel: "高",
          missingLabel: "データなし",
          unit: "トン"
        }}
        mapEncodingDescription="都道府県の代表点で収穫量を表します。"
        themePalette={getThemePalette("rice")}
      />
    );

    expect(screen.getByRole("region", { name: "主食用米収穫量の凡例" })).toBeTruthy();
    expect(screen.getByText("低")).toBeTruthy();
    expect(screen.getByText("高")).toBeTruthy();
    expect(screen.getByText("トン")).toBeTruthy();
    expect(screen.getByText("データなし")).toBeTruthy();
    expect(screen.getByText("地図の読み方")).toBeTruthy();
    expect(screen.getByText("都道府県の代表点で収穫量を表します。")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("renders categorical items in declared order with text labels", () => {
    const legend: LayerLegend = {
      kind: "categorical",
      title: "供給状態",
      missingLabel: "データなし",
      items: [
        { colorToken: "accent", label: "供給拠点" },
        { colorToken: "watch", label: "要監視" },
        { colorToken: "normal", label: "通常" }
      ]
    };

    render(
      <MapLegend
        legend={legend}
        mapEncodingDescription="供給状態を分類別のマーカーで表します。"
        themePalette={getThemePalette("energy")}
      />
    );

    const list = screen.getByRole("list", { name: "供給状態" });
    expect(Array.from(list.querySelectorAll("li")).map((item) => item.textContent)).toEqual([
      "供給拠点",
      "要監視",
      "通常"
    ]);
    expect(screen.getByText("地図の読み方")).toBeTruthy();
    expect(screen.getByText("供給状態を分類別のマーカーで表します。")).toBeTruthy();
  });
});
