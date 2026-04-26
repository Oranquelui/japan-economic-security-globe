import type { SourceDocument } from "../../types/semantic";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface SourceFreshness {
  accessedLabel: string;
  daysSince: number;
  label: string;
  tone: "fresh" | "recent" | "stale";
}

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

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function toUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
