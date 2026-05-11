// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { SignalTrendChart } from "../SignalTrendChart";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

describe("signal trend chart", () => {
  test("renders a compact chart with a change label and last value", () => {
    render(
      <SignalTrendChart
        themePalette={getThemePalette("energy")}
        trend={{
          signalId: "ranking-signal:energy-middle-east-route",
          title: "中東エネルギー輸送路圧力",
          unitLabel: "watch index",
          updatedLabel: "更新 2026-04-25",
          changeLabel: "7日変化 +32pt",
          points: [
            { label: "04/19", value: 62 },
            { label: "04/21", value: 68 },
            { label: "04/23", value: 79 },
            { label: "04/25", value: 94 }
          ]
        }}
      />
    );

    expect(screen.getByText("Trend")).toBeTruthy();
    expect(screen.getByText("7日変化 +32pt")).toBeTruthy();
    expect(screen.getByText("94")).toBeTruthy();
    expect(screen.getByLabelText("Trend chart for ranking-signal:energy-middle-east-route")).toBeTruthy();
  });
});
