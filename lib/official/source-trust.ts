import sources from "../../data/seed/sources.json";
import type { SourceDocument } from "../../types/semantic";

export interface SignalSourceTrustViewModel {
  detail: string;
  label: string;
  officialCount: number;
  totalCount: number;
}

const typedSources = sources as SourceDocument[];
const sourceById = new Map(typedSources.map((source) => [source.id, source] as const));

export function buildSignalSourceTrust(sourceIds: string[]): SignalSourceTrustViewModel {
  const resolvedSources = dedupeSources(sourceIds);

  if (resolvedSources.length === 0) {
    return {
      label: "出典未登録",
      detail: "出典が未登録です。",
      officialCount: 0,
      totalCount: 0
    };
  }

  const officialCount = resolvedSources.filter((source) => source.official !== false).length;
  const modes = resolvedSources
    .map((source) => source.accessMode)
    .filter((mode): mode is NonNullable<SourceDocument["accessMode"]> => Boolean(mode))
    .map(localizeSourceMode);

  return {
    label:
      officialCount === resolvedSources.length
        ? "公式中心"
        : officialCount > 0
          ? "公式+補助"
          : "補助中心",
    detail: `${resolvedSources.length}件中${officialCount}件が公式一次ソース${modes.length ? ` / ${modes.join("・")}` : ""}`,
    officialCount,
    totalCount: resolvedSources.length
  };
}

function dedupeSources(sourceIds: string[]): SourceDocument[] {
  const seen = new Set<string>();

  return sourceIds.flatMap((sourceId) => {
    if (seen.has(sourceId)) {
      return [];
    }

    seen.add(sourceId);
    const source = sourceById.get(sourceId);

    return source ? [source] : [];
  });
}

function localizeSourceMode(mode: NonNullable<SourceDocument["accessMode"]>) {
  switch (mode) {
    case "api":
      return "API";
    case "sparql":
      return "SPARQL";
    case "csv":
      return "CSV";
    case "excel":
      return "Excel";
    case "pdf":
      return "PDF";
    case "html":
      return "HTML";
  }
}
