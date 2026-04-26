import rankingSignals from "../../data/seed/ranking-signals.json";
import type { RankingSignal } from "../../types/ranking";

export function loadRankingSignals(): RankingSignal[] {
  return validateRankingSignals(rankingSignals as RankingSignal[]);
}

export async function loadRankings(signals: RankingSignal[] = rankingSignals as RankingSignal[]): Promise<RankingSignal[]> {
  return validateRankingSignals(signals);
}

function validateRankingSignals(signals: RankingSignal[]): RankingSignal[] {
  return signals.map((signal) => validateRankingSignal(signal));
}

function validateRankingSignal(signal: RankingSignal): RankingSignal {
  if (signal.canonicalRefs.length === 0) {
    throw new Error(`Ranking signal ${signal.id} must include at least one canonical reference.`);
  }

  if (signal.sourceIds.length === 0) {
    throw new Error(`Ranking signal ${signal.id} must include at least one source id.`);
  }

  if (!hasRequiredComponentInputs(signal)) {
    throw new Error(`Ranking signal ${signal.id} must include all ranking component inputs.`);
  }

  return signal;
}

function hasRequiredComponentInputs(signal: RankingSignal): boolean {
  return (
    typeof signal.componentInputs.nationalImportance === "number"
    && typeof signal.componentInputs.disruptionDepth === "number"
    && typeof signal.componentInputs.sourceConfidence === "number"
    && typeof signal.componentInputs.publicAttention === "number"
  );
}
