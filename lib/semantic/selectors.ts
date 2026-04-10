import type { ThemeView } from "../../types/presentation";
import type { SemanticGraph, ThemeId } from "../../types/semantic";

const THEME_META: Record<ThemeId, Pick<ThemeView, "title" | "headline" | "accent">> = {
  energy: {
    title: "Energy",
    headline: "When global energy routes shake, where does the risk land inside Japan?",
    accent: "#ff9f2f"
  },
  rice: {
    title: "Rice",
    headline: "How do import pressure, stockpiles, water, and policy signals reach the dinner table?",
    accent: "#d9b45b"
  },
  water: {
    title: "Water",
    headline: "Which reservoirs and regions show stress before it becomes a household issue?",
    accent: "#39c6ff"
  },
  defense: {
    title: "Defense",
    headline: "Where does FY2026 defense spending flow, and which capabilities does it support?",
    accent: "#d85d68"
  },
  semiconductors: {
    title: "Semiconductors",
    headline: "Which countries and policies shape Japan's semiconductor dependency graph?",
    accent: "#49f0d0"
  }
};

export function getThemeView(graph: SemanticGraph, themeId: ThemeId): ThemeView {
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
    ...THEME_META[themeId],
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
