import { describe, expect, test } from "vitest";

import { loadSeedRankingSignals } from "../../data/seed-loader";
import type { RankingSignal } from "../../../types/ranking";
import { loadRankingSignals, loadRankings } from "../ranking-loader";

describe("ranking loader", () => {
  test("loads representative ranking signals across the initial importance axes", () => {
    const signals = loadRankingSignals();
    const ids = signals.map((signal) => signal.id);
    const axes = new Set(signals.flatMap((signal) => signal.importanceAxes));

    expect(ids).toEqual(
      expect.arrayContaining([
        "ranking-signal:energy-middle-east-route",
        "ranking-signal:energy-lng-terminal-exposure",
        "ranking-signal:food-rice-price-pressure",
        "ranking-signal:semiconductors-kumamoto-exposure",
        "ranking-signal:logistics-japan-maritime-watch",
        "ranking-signal:disaster-ogochi-water-stress"
      ])
    );
    expect(axes.has("energy")).toBe(true);
    expect(axes.has("food")).toBe(true);
    expect(axes.has("semiconductors")).toBe(true);
    expect(axes.has("logistics")).toBe(true);
    expect(axes.has("disaster_infrastructure")).toBe(true);
  });

  test("requires canonical references, source ids, and component inputs for every signal", () => {
    const signals = loadSeedRankingSignals();

    expect(signals.every((signal) => signal.canonicalRefs.length > 0)).toBe(true);
    expect(signals.every((signal) => signal.sourceIds.length > 0)).toBe(true);
    expect(signals.every((signal) => typeof signal.retrievedAt === "string")).toBe(true);
    expect(
      signals.every(
        (signal) =>
          typeof signal.componentInputs.nationalImportance === "number" &&
          typeof signal.componentInputs.disruptionDepth === "number" &&
          typeof signal.componentInputs.sourceConfidence === "number" &&
          typeof signal.componentInputs.publicAttention === "number"
      )
    ).toBe(true);
  });

  test("loads large mixed ranking bundles asynchronously without dropping valid signals", async () => {
    const largeBundle: RankingSignal[] = Array.from({ length: 1000 }, (_, index) => ({
      id: `ranking-signal:test-${index}`,
      label: `Signal ${index}`,
      importanceAxes: [index % 2 === 0 ? "energy" : "food"],
      canonicalRefs: [
        {
          kind: index % 2 === 0 ? "flow" : "observation",
          id: index % 2 === 0 ? "flow:saudi-oil-japan" : "observation:rice-price-signal-2026"
        }
      ],
      sourceIds: ["source:enecho-energy-trends"],
      componentInputs: {
        nationalImportance: 0.7,
        disruptionDepth: 0.6,
        sourceConfidence: 0.8,
        publicAttention: 0.2
      },
      retrievedAt: "2026-04-25T00:00:00.000Z"
    }));

    const loaded = await loadRankings(largeBundle);

    expect(loaded).toHaveLength(1000);
    expect(loaded[999]?.id).toBe("ranking-signal:test-999");
  });

  test("rejects ranking bundles that contain non-canonical items", async () => {
    await expect(
      loadRankings([
        {
          id: "ranking-signal:invalid",
          label: "Invalid",
          importanceAxes: ["energy"],
          canonicalRefs: [] as unknown as RankingSignal["canonicalRefs"],
          sourceIds: ["source:enecho-energy-trends"],
          componentInputs: {
            nationalImportance: 0.7,
            disruptionDepth: 0.6,
            sourceConfidence: 0.8,
            publicAttention: 0.2
          },
          retrievedAt: "2026-04-25T00:00:00.000Z"
        }
      ])
    ).rejects.toThrow("Ranking signal ranking-signal:invalid must include at least one canonical reference.");
  });
});
