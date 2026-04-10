import type { ThemeView } from "../../types/presentation";
import type { SemanticGraph, ThemeId } from "../../types/semantic";

const THEME_META: Record<ThemeId, Pick<ThemeView, "title" | "headline" | "accent">> = {
  energy: {
    title: "エネルギー",
    headline: "原油・LNG・海上輸送路の揺れは、日本のどこに着地するのか。",
    accent: "#ff9f2f"
  },
  rice: {
    title: "コメ",
    headline: "価格、備蓄、水、政策シグナルは、食卓にどうつながるのか。",
    accent: "#d9b45b"
  },
  water: {
    title: "水",
    headline: "水不足が生活問題になる前に、どの地域と貯水池に兆候が出るのか。",
    accent: "#39c6ff"
  },
  defense: {
    title: "防衛",
    headline: "2026年度防衛予算は、どの能力領域へ流れているのか。",
    accent: "#d85d68"
  },
  semiconductors: {
    title: "半導体",
    headline: "日本の半導体依存は、どの国・政策・産業基盤に支えられているのか。",
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
