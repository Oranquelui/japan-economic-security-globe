import type { SourceDocument } from "../../types/semantic";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SourceFreshnessTone = "fresh" | "recent" | "stale";

export interface SourceFreshness {
  accessedLabel: string;
  daysSince: number;
  label: string;
  tone: SourceFreshnessTone;
}

export interface SourceStatusSummary {
  totalSources: number;
  officialSources: number;
  apiLikeSources: number;
  documentSources: number;
  staleSources: number;
  freshestAccessed?: string;
  oldestAccessed?: string;
  overallTone: SourceFreshnessTone;
}

const API_LIKE_MODES = new Set<NonNullable<SourceDocument["accessMode"]>>(["api", "sparql"]);
const DOCUMENT_MODES = new Set<NonNullable<SourceDocument["accessMode"]>>(["html", "pdf", "csv", "excel"]);

export function getSourceFreshness(
  source: Pick<SourceDocument, "accessed">,
  referenceDate = new Date()
): SourceFreshness {
  const accessedAt = parseDateOnly(source.accessed);
  const referenceAt = toUtcDay(referenceDate);
  const daysSince = Math.max(0, Math.floor((referenceAt.getTime() - accessedAt.getTime()) / DAY_IN_MS));

  return {
    accessedLabel: `確認日 ${source.accessed}`,
    daysSince,
    label: daysSince === 0 ? "本日確認" : `${daysSince}日前確認`,
    tone: daysSince <= 2 ? "fresh" : daysSince <= 7 ? "recent" : "stale"
  };
}

export function summarizeSourceStatus(
  sources: SourceDocument[],
  referenceDate = new Date()
): SourceStatusSummary {
  const freshnessEntries = sources.map((source) => getSourceFreshness(source, referenceDate));
  const staleSources = freshnessEntries.filter((freshness) => freshness.tone === "stale").length;
  const accessedDates = sources.map((source) => source.accessed).sort();

  return {
    totalSources: sources.length,
    officialSources: sources.filter((source) => source.official !== false).length,
    apiLikeSources: sources.filter((source) => source.accessMode && API_LIKE_MODES.has(source.accessMode)).length,
    documentSources: sources.filter((source) => source.accessMode && DOCUMENT_MODES.has(source.accessMode)).length,
    staleSources,
    freshestAccessed: accessedDates[accessedDates.length - 1],
    oldestAccessed: accessedDates[0],
    overallTone: resolveOverallFreshnessTone(freshnessEntries)
  };
}

function resolveOverallFreshnessTone(freshnessEntries: SourceFreshness[]): SourceFreshnessTone {
  if (!freshnessEntries.length) {
    return "recent";
  }

  if (freshnessEntries.some((freshness) => freshness.tone === "stale")) {
    return "stale";
  }

  if (freshnessEntries.some((freshness) => freshness.tone === "recent")) {
    return "recent";
  }

  return "fresh";
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function toUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
