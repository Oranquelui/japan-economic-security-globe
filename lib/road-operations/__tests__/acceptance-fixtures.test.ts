import { describe, expect, test } from "vitest";

import { loadSeedGraph, loadSeedRoadOperations } from "../../data/seed-loader";
import { isAbsoluteRoadTimestamp } from "../provider-adapter";
import {
  ACCEPTANCE_ENDED_CLOSURE_ID,
  buildRoadOperationsAcceptanceDataset
} from "../acceptance-fixtures";

describe("road operations acceptance fixtures", () => {
  test("returns the production/default dataset unchanged", () => {
    const seed = loadSeedRoadOperations();

    expect(buildRoadOperationsAcceptanceDataset(seed, {
      acceptanceFixtures: "1",
      nodeEnv: "production"
    })).toBe(seed);
    expect(buildRoadOperationsAcceptanceDataset(seed, {
      acceptanceFixtures: undefined,
      nodeEnv: "development"
    })).toBe(seed);
    expect(seed.restrictionEvents?.some((record) => record.id === ACCEPTANCE_ENDED_CLOSURE_ID)).toBe(false);
  });

  test("clones the dataset and adds one valid ended fixed-demo closure in acceptance", () => {
    const seed = loadSeedRoadOperations();
    const result = buildRoadOperationsAcceptanceDataset(seed, {
      acceptanceFixtures: "1",
      nodeEnv: "development"
    });

    expect(result).not.toBe(seed);
    expect(result.segments).not.toBe(seed.segments);
    expect(result.restrictionEvents).toHaveLength((seed.restrictionEvents?.length ?? 0) + 1);
    const closure = result.restrictionEvents?.find((record) => record.id === ACCEPTANCE_ENDED_CLOSURE_ID);
    expect(closure).toEqual({
      id: ACCEPTANCE_ENDED_CLOSURE_ID,
      recordType: "restriction",
      segmentId: "road-segment:tatsumi-distribution-east",
      direction: "東行き",
      restrictionKind: "closure",
      lifecycle: "ended",
      dataPosture: "fixed-demo",
      startsAt: "2026-06-03T07:00:00+09:00",
      endsAt: "2026-06-03T08:00:00+09:00",
      providerObservedAt: "2026-06-03T09:00:00+09:00",
      retrievedAt: "2026-06-03T09:05:00+09:00",
      sourceIds: ["source:logistics-road-demo-fixture"],
      disclosureLabel: "固定デモ / 現在情報ではありません",
      affectedRange: {
        fromLabel: "辰巳JCT東側",
        toLabel: "東京湾岸配送圏手前",
        startRatio: 0.22,
        endRatio: 0.64
      }
    });
    expect(result.segments?.find((segment) => segment.id === closure?.segmentId)?.direction).toBe(closure?.direction);
    expect(loadSeedGraph().sources.some((source) => closure?.sourceIds.includes(source.id))).toBe(true);
    expect(isAbsoluteRoadTimestamp(closure?.startsAt)).toBe(true);
    expect(isAbsoluteRoadTimestamp(closure?.endsAt)).toBe(true);
    expect(isAbsoluteRoadTimestamp(closure?.providerObservedAt)).toBe(true);
    expect(isAbsoluteRoadTimestamp(closure?.retrievedAt)).toBe(true);
    expect(seed.restrictionEvents?.some((record) => record.id === ACCEPTANCE_ENDED_CLOSURE_ID)).toBe(false);
  });
});
