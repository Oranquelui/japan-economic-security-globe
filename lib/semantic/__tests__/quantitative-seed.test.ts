import { describe, expect, test } from "vitest";

import { loadSeedGraph } from "../../data/seed-loader";

describe("quantitative seed coverage", () => {
  test("provides quantitative observations for rice, water, and defense", () => {
    const graph = loadSeedGraph();
    const ricePrice = graph.observations.find((item) => item.id === "observation:rice-price-signal-2026");
    const riceInventory = graph.observations.find((item) => item.id === "observation:rice-private-inventory-feb-2026");
    const reservoir = graph.observations.find((item) => item.id === "observation:ogochi-reservoir-stress");
    const defenseBudgetObservations = graph.observations.filter(
      (item) => item.theme === "defense" && item.kind === "BudgetObservation"
    );

    expect(ricePrice).toEqual(
      expect.objectContaining({
        metric: "relative_transaction_price",
        value: expect.any(Number),
        unit: "jpy_per_60kg",
        period: "2026-02"
      })
    );
    expect(riceInventory).toEqual(
      expect.objectContaining({
        metric: "private_inventory",
        value: expect.any(Number),
        unit: "10k_genmai_tons",
        period: "2026-02"
      })
    );
    expect(reservoir).toEqual(
      expect.objectContaining({
        metric: "reservoir_fill_rate",
        value: expect.any(Number),
        unit: "percent",
        period: "2026-04-10"
      })
    );
    expect(defenseBudgetObservations).toHaveLength(3);
    expect(defenseBudgetObservations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "observation:defense-budget-standoff-fy2026",
          value: 973.3,
          unit: "billion_jpy"
        }),
        expect.objectContaining({
          id: "observation:defense-budget-iamd-fy2026",
          value: 509.1,
          unit: "billion_jpy"
        }),
        expect.objectContaining({
          id: "observation:defense-budget-unmanned-fy2026",
          value: 277.3,
          unit: "billion_jpy"
        })
      ])
    );
  });

  test("exposes multiple FY2026 defense budget categories as linked flows", () => {
    const graph = loadSeedGraph();
    const defenseFlowIds = graph.flows.filter((item) => item.theme === "defense").map((item) => item.id);

    expect(defenseFlowIds).toEqual(
      expect.arrayContaining([
        "flow:defense-budget-standoff",
        "flow:defense-budget-integrated-air-missile",
        "flow:defense-budget-unmanned"
      ])
    );
  });
});
