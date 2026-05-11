import rankingTrends from "../../data/seed/ranking-trends.json";

export interface SignalTrendPointViewModel {
  label: string;
  value: number;
}

export interface SignalTrendViewModel {
  changeLabel: string;
  points: SignalTrendPointViewModel[];
  signalId: string;
  title: string;
  unitLabel: string;
  updatedLabel: string;
}

interface RankingTrendSeed {
  points: Array<{
    at: string;
    value: number;
  }>;
  signalId: string;
  title: string;
  unitLabel: string;
}

const typedRankingTrends = rankingTrends as RankingTrendSeed[];

export function getSignalTrend(signalId: string): SignalTrendViewModel | null {
  const trend = typedRankingTrends.find((entry) => entry.signalId === signalId);

  if (!trend || trend.points.length < 2) {
    return null;
  }

  const firstPoint = trend.points[0];
  const lastPoint = trend.points[trend.points.length - 1];
  const change = lastPoint.value - firstPoint.value;
  const windowDays = Math.max(1, diffInclusiveDays(firstPoint.at, lastPoint.at));

  return {
    changeLabel: `${windowDays}日変化 ${change >= 0 ? "+" : ""}${change}pt`,
    points: trend.points.map((point) => ({
      label: point.at.slice(5).replace("-", "/"),
      value: point.value
    })),
    signalId: trend.signalId,
    title: trend.title,
    unitLabel: trend.unitLabel,
    updatedLabel: `更新 ${lastPoint.at}`
  };
}

function diffInclusiveDays(from: string, to: string): number {
  const fromTime = new Date(`${from}T00:00:00.000Z`).getTime();
  const toTime = new Date(`${to}T00:00:00.000Z`).getTime();

  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) {
    return 1;
  }

  return Math.floor((toTime - fromTime) / (1000 * 60 * 60 * 24)) + 1;
}
