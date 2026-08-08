// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { JapanMainMap } from "../JapanMainMap";
import { getStatusPalette, getThemePalette } from "../../lib/presentation/palette";

vi.mock("../JapanOperationsMapCanvas", () => ({
  JapanOperationsMapCanvas: () => <div data-testid="map-canvas" />
}));

describe("JapanMainMap attribution safe area", () => {
  test("publishes overlay insets as scoped CSS properties for the MapLibre attribution corner", () => {
    render(
      <JapanMainMap
        activeId=""
        focusTargetId={null}
        mapMode="route"
        model={{
          globalPoints: [],
          globalRoutes: [],
          points: [],
          regions: [],
          routes: []
        }}
        onSelect={vi.fn()}
        overlayInsets={{ bottom: 24, left: 336, right: 376, top: 16 }}
        statusPalette={getStatusPalette()}
        themePalette={getThemePalette("logistics")}
      />
    );

    const mapSection = screen.getByTestId("map-canvas").parentElement as HTMLElement;
    expect(mapSection.style.getPropertyValue("--map-overlay-left")).toBe("336px");
    expect(mapSection.style.getPropertyValue("--map-overlay-bottom")).toBe("24px");
  });
});
