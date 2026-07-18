import type { MetricSeriesPoint } from "../../types/presentation";

export type MetricSeriesValidation =
  | { comparable: true; period: string; unit: string }
  | { comparable: false; message: string; reason: "insufficient" | "mixed-periods" | "mixed-units" };

export function validateMetricSeries(series: readonly MetricSeriesPoint[]): MetricSeriesValidation {
  if (series.length < 2) {
    return {
      comparable: false,
      message: "比較には同じ系列のデータが2件以上必要です。",
      reason: "insufficient"
    };
  }

  const units = new Set(series.map((point) => point.unit));
  if (units.size !== 1) {
    return {
      comparable: false,
      message: "単位が混在しているため比較できません。",
      reason: "mixed-units"
    };
  }

  const periods = new Set(series.map((point) => point.period));
  if (periods.size !== 1) {
    return {
      comparable: false,
      message: "期間が混在しているため比較できません。",
      reason: "mixed-periods"
    };
  }

  return {
    comparable: true,
    period: series[0].period,
    unit: series[0].unit
  };
}
