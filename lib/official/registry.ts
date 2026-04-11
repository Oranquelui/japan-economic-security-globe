import sources from "../../data/seed/sources.json";
import type { SemanticGraph, SourceDocument, ThemeId } from "../../types/semantic";

export type OfficialSourceCoverage = {
  totalSources: number;
  officialSources: number;
  apiLikeSources: number;
  documentSources: number;
  primaryModes: Array<NonNullable<SourceDocument["accessMode"]>>;
};

const typedSources = sources as SourceDocument[];

export function getOfficialSourceCatalog(): SourceDocument[] {
  return typedSources;
}

export function buildThemeOfficialCoverage(graph: SemanticGraph, themeId: ThemeId): OfficialSourceCoverage {
  const sourceIds = new Set<string>();

  for (const flow of graph.flows) {
    if (flow.theme === themeId) {
      for (const sourceId of flow.sourceIds) {
        sourceIds.add(sourceId);
      }
    }
  }

  for (const observation of graph.observations) {
    if (observation.theme === themeId) {
      for (const sourceId of observation.sourceIds) {
        sourceIds.add(sourceId);
      }
    }
  }

  const themeSources = [...sourceIds]
    .map((sourceId) => graph.sources.find((source) => source.id === sourceId))
    .filter((source): source is SourceDocument => Boolean(source));

  const apiLikeModes = new Set<NonNullable<SourceDocument["accessMode"]>>(["api", "sparql"]);
  const documentModes = new Set<NonNullable<SourceDocument["accessMode"]>>(["html", "pdf", "csv", "excel"]);
  const primaryModes = [...new Set(themeSources.map((source) => source.accessMode).filter(Boolean))] as Array<
    NonNullable<SourceDocument["accessMode"]>
  >;

  return {
    totalSources: themeSources.length,
    officialSources: themeSources.filter((source) => source.official !== false).length,
    apiLikeSources: themeSources.filter((source) => source.accessMode && apiLikeModes.has(source.accessMode)).length,
    documentSources: themeSources.filter((source) => source.accessMode && documentModes.has(source.accessMode)).length,
    primaryModes
  };
}
