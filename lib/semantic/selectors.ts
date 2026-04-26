import { getThemeDefinition } from "../config/theme-registry";
import type { ThemeView } from "../../types/presentation";
import type { SemanticGraph, ThemeId } from "../../types/semantic";

export function getThemeView(graph: SemanticGraph, themeId: ThemeId): ThemeView {
  const theme = getThemeDefinition(themeId);
  const entities = graph.entities.filter((entity) => entity.themes.includes(themeId));
  const flows = graph.flows.filter((flow) => flow.theme === themeId);
  const observations = graph.observations.filter((observation) => observation.theme === themeId);
  const sourceIds = new Set([
    ...entities.flatMap((entity) => entity.sourceIds ?? []),
    ...entities.flatMap((entity) => entity.provenance),
    ...flows.flatMap((flow) => flow.sourceIds),
    ...observations.flatMap((observation) => observation.sourceIds)
  ]);
  const evidenceEdges = graph.edges.filter((edge) => edge.theme === themeId || !edge.theme);

  return {
    id: themeId,
    accent: theme.accent,
    headline: theme.headline,
    title: theme.title,
    entities,
    flows,
    observations,
    sources: graph.sources.filter((source) => sourceIds.has(source.id)),
    japanImpacts: entities.filter((entity) =>
      ["Prefecture", "Port", "Terminal", "Refinery", "Reservoir", "Facility", "BudgetLine"].includes(
        entity.kind
      )
    ),
    evidenceEdges
  };
}
