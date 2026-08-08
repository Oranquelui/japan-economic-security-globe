import type {
  RoadOperationsDataset,
  RoadRestrictionEvent
} from "../../types/road-operations";

export const ACCEPTANCE_ENDED_CLOSURE_ID = "road-restriction:acceptance-ended-closure";

interface AcceptanceFixtureEnvironment {
  acceptanceFixtures: string | undefined;
  nodeEnv: string | undefined;
}

const ACCEPTANCE_ENDED_CLOSURE: RoadRestrictionEvent = {
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
};

export function buildRoadOperationsAcceptanceDataset(
  dataset: RoadOperationsDataset,
  environment: AcceptanceFixtureEnvironment = {
    acceptanceFixtures: process.env.NEXT_PUBLIC_MAP_ACCEPTANCE_FIXTURES,
    nodeEnv: process.env.NODE_ENV
  }
): RoadOperationsDataset {
  if (environment.nodeEnv === "production" || environment.acceptanceFixtures !== "1") {
    return dataset;
  }

  const clone = structuredClone(dataset);
  clone.restrictionEvents = [
    ...(clone.restrictionEvents ?? []),
    structuredClone(ACCEPTANCE_ENDED_CLOSURE)
  ];
  return clone;
}
