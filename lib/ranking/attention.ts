import { ATTENTION_SOURCE_REGISTRY } from "../config/ranking-registry";
import type { AttentionSignal } from "../../types/ranking";

export interface AttentionObservationSummary {
  semanticId: string;
  score: number;
  observedAt: string;
  url?: string;
}

export interface AttentionSourceAdapter {
  sourceId: string;
  getAttentionScore(semanticId: string): Promise<number | null>;
  getObservedAt?(semanticId: string, fallbackNow: string): Promise<string>;
  getUrl?(semanticId: string): Promise<string | undefined>;
}

type FixtureAttentionRecord = Record<
  string,
  {
    observedAt: string;
    score: number;
    url?: string;
  }
>;

export class FixtureAttentionSourceAdapter implements AttentionSourceAdapter {
  readonly sourceId: string;

  constructor(sourceId: string, private readonly records: FixtureAttentionRecord) {
    this.sourceId = sourceId;
  }

  async getAttentionScore(semanticId: string): Promise<number | null> {
    return this.records[semanticId]?.score ?? null;
  }

  async getObservedAt(semanticId: string, fallbackNow: string): Promise<string> {
    return this.records[semanticId]?.observedAt ?? fallbackNow;
  }

  async getUrl(semanticId: string): Promise<string | undefined> {
    return this.records[semanticId]?.url;
  }
}

export function normalizeAttentionSignals(
  sourceId: string,
  observations: AttentionObservationSummary[]
): AttentionSignal[] {
  const source = ATTENTION_SOURCE_REGISTRY[sourceId];

  if (!source || !source.enabled || source.termsStatus !== "allowed") {
    return [];
  }

  return observations
    .filter((observation) => observation.semanticId.startsWith("ranking-signal:"))
    .map((observation) => ({
      id: `attention:${sourceId}:${observation.semanticId}`,
      signalId: observation.semanticId,
      sourceLabel: source.label,
      observedAt: observation.observedAt,
      score: clampScore(observation.score),
      url: observation.url
    }));
}

export async function loadAttentionSignals(
  semanticIds: string[],
  adapter?: AttentionSourceAdapter,
  now = new Date().toISOString()
): Promise<AttentionSignal[]> {
  if (!adapter) {
    return [];
  }

  const metadata = ATTENTION_SOURCE_REGISTRY[adapter.sourceId];

  if (!metadata || !metadata.enabled || metadata.termsStatus !== "allowed") {
    return [];
  }

  const observations = await Promise.all(
    semanticIds.map(async (semanticId) => {
      const score = await adapter.getAttentionScore(semanticId);

      if (score == null) {
        return null;
      }

      return {
        semanticId,
        score,
        observedAt: adapter.getObservedAt ? await adapter.getObservedAt(semanticId, now) : now,
        url: adapter.getUrl ? await adapter.getUrl(semanticId) : undefined
      } satisfies AttentionObservationSummary;
    })
  );

  return normalizeAttentionSignals(adapter.sourceId, observations.flatMap((observation) => (observation ? [observation] : [])));
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
