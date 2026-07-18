import type { MetricSeriesPoint } from "../../types/presentation";
import type { SourceDocument } from "../../types/semantic";

export type MetricSeriesValidation =
  | { comparable: true; period: string; sourceIds: string[]; unit: string }
  | {
      comparable: false;
      message: string;
      reason:
        | "blank-period"
        | "blank-unit"
        | "insufficient"
        | "missing-sources"
        | "mixed-periods"
        | "mixed-units"
        | "no-common-source"
        | "no-official-source";
    };

export function validateMetricSeries(
  series: readonly MetricSeriesPoint[],
  sources?: readonly SourceDocument[]
): MetricSeriesValidation {
  if (series.length < 2) {
    return {
      comparable: false,
      message: "比較には同じ系列のデータが2件以上必要です。",
      reason: "insufficient"
    };
  }

  const normalizedUnits = series.map((point) => point.unit.trim());
  if (normalizedUnits.some((unit) => !unit)) {
    return {
      comparable: false,
      message: "単位が空のため比較できません。",
      reason: "blank-unit"
    };
  }

  const units = new Set(normalizedUnits);
  if (units.size !== 1) {
    return {
      comparable: false,
      message: "単位が混在しているため比較できません。",
      reason: "mixed-units"
    };
  }

  const normalizedPeriods = series.map((point) => point.period.trim());
  if (normalizedPeriods.some((period) => !period)) {
    return {
      comparable: false,
      message: "期間が空のため比較できません。",
      reason: "blank-period"
    };
  }

  const periods = new Set(normalizedPeriods);
  if (periods.size !== 1) {
    return {
      comparable: false,
      message: "期間が混在しているため比較できません。",
      reason: "mixed-periods"
    };
  }

  const sourceIdsByPoint = series.map((point) => (
    [...new Set(point.sourceIds.map((sourceId) => sourceId.trim()).filter(Boolean))]
  ));
  if (sourceIdsByPoint.some((sourceIds) => sourceIds.length === 0)) {
    return {
      comparable: false,
      message: "出典がないデータを含むため比較できません。",
      reason: "missing-sources"
    };
  }

  const commonSourceIds = sourceIdsByPoint[0].filter((sourceId) => (
    sourceIdsByPoint.every((sourceIds) => sourceIds.includes(sourceId))
  ));
  if (commonSourceIds.length === 0) {
    return {
      comparable: false,
      message: "全データに共通する出典がないため比較できません。",
      reason: "no-common-source"
    };
  }

  const validatedSourceIds = sources
    ? commonSourceIds.filter((sourceId) => sources.some((source) => (
        source.id.trim() === sourceId && source.official === true && isRealUrl(source.url)
      )))
    : commonSourceIds;
  if (validatedSourceIds.length === 0) {
    return {
      comparable: false,
      message: "共通する公式出典を確認できないため比較できません。",
      reason: "no-official-source"
    };
  }

  return {
    comparable: true,
    period: normalizedPeriods[0],
    sourceIds: validatedSourceIds,
    unit: normalizedUnits[0]
  };
}

function isRealUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
