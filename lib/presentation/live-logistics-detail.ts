import type { LiveLogisticsItemViewModel } from "../../types/logistics";
import type { DetailViewModel } from "../../types/presentation";
import type { DependencyFlow, SemanticEntity, SemanticGraph, SourceDocument } from "../../types/semantic";
import { getSourcesById } from "../semantic/provenance";
import { toResourceIri } from "../semantic/sparql";

export function buildLiveLogisticsDetail(
  graph: SemanticGraph,
  item: LiveLogisticsItemViewModel
): DetailViewModel {
  const linkedFlows = getFlowsById(graph, item.relatedIds);
  const relatedEntities = getRelatedEntities(graph, item, linkedFlows);
  const sources = getLiveLogisticsSources(graph, item, linkedFlows);

  return {
    id: item.id,
    label: item.title,
    kind: item.kindLabel,
    summary: [
      `${item.corridorLabel} を通る ${item.kindLabel} のライブ監視シグナルです。`,
      `${item.statusLabel} / ${item.etaLabel} / ${item.lastSeenLabel}`
    ].join(" "),
    whyItMatters: buildWhyItMatters(item),
    signal: {
      category: item.laneId === "maritime" ? "日本向けタンカー" : "国内物流接続",
      severity: toSignalSeverity(item.signalTone),
      status: item.statusLabel.toLowerCase().includes("underway") ? "監視中" : "表示対象",
      recommendedAction:
        item.laneId === "maritime"
          ? "AIS位置、海峡通過、港湾ETA、出典遅延をあわせて確認"
          : "港湾着地から国内配送・燃料接続への波及を確認",
      watchpoints: [item.corridorLabel, item.etaLabel, item.disclosureLabel].filter(Boolean)
    },
    sources,
    sourceHighlights: sources.slice(0, 2).map((source) => ({
      sourceId: source.id,
      claim: `${item.sourceLabel} / ${item.disclosureLabel}`
    })),
    relatedEntities,
    linkedFlows,
    sparql: {
      title: `SPARQL preview for ${item.title}`,
      query: [
        "PREFIX jpsdg: <https://data.jp-strategic-dependency-graph.org/ontology#>",
        "PREFIX prov: <http://www.w3.org/ns/prov#>",
        "",
        "SELECT ?signal ?flow ?point ?source WHERE {",
        `  VALUES ?signal { ${toResourceIri(item.id)} }`,
        `  VALUES ?flow { ${linkedFlows.map((flow) => toResourceIri(flow.id)).join(" ") || "UNDEF"} }`,
        `  VALUES ?point { ${relatedEntities.map((entity) => toResourceIri(entity.id)).join(" ") || "UNDEF"} }`,
        "  OPTIONAL { ?flow jpsdg:transitsVia ?point . }",
        "  OPTIONAL { ?flow prov:wasDerivedFrom ?source . }",
        "}"
      ].join("\n")
    }
  };
}

function buildWhyItMatters(item: LiveLogisticsItemViewModel) {
  if (item.laneId === "maritime") {
    return "日本向けタンカーを個別に追跡すると、ホルムズ・マラッカ・日本着地のどこで詰まりが出ているかを早く切り分けられます。";
  }

  return "国内物流接続を分けて見ることで、港湾到着後の燃料・物流ボトルネックを海上ルートと混同せずに確認できます。";
}

function toSignalSeverity(tone: LiveLogisticsItemViewModel["signalTone"]): DetailViewModel["signal"]["severity"] {
  if (tone === "high") {
    return "高";
  }

  if (tone === "watch" || tone === "monitoring") {
    return "中";
  }

  return "通常";
}

function getFlowsById(graph: SemanticGraph, ids: string[]): DependencyFlow[] {
  const idSet = new Set(ids);
  return graph.flows.filter((flow) => idSet.has(flow.id));
}

function getRelatedEntities(
  graph: SemanticGraph,
  item: LiveLogisticsItemViewModel,
  linkedFlows: DependencyFlow[]
): SemanticEntity[] {
  const entityIds = [
    ...item.pointIds,
    ...linkedFlows.flatMap((flow) => [
      flow.originId,
      flow.destinationId,
      flow.resourceId,
      flow.productId,
      ...flow.routeIds
    ])
  ].filter((id): id is string => Boolean(id));
  const seen = new Set<string>();

  return entityIds.flatMap((id) => {
    if (seen.has(id)) {
      return [];
    }

    seen.add(id);
    const entity = graph.entities.find((candidate) => candidate.id === id);
    return entity ? [entity] : [];
  });
}

function getLiveLogisticsSources(
  graph: SemanticGraph,
  item: LiveLogisticsItemViewModel,
  linkedFlows: DependencyFlow[]
): SourceDocument[] {
  const sourceIds = linkedFlows.flatMap((flow) => flow.sourceIds);
  const linkedSources = getSourcesById(graph, sourceIds);

  if (linkedSources.length > 0) {
    return linkedSources;
  }

  return [
    {
      id: `${item.id}:source`,
      label: item.sourceLabel,
      url: "#",
      publisher: item.sourceLabel,
      accessed: item.lastSeenLabel,
      description: item.disclosureLabel,
      accessMode: "api",
      tier: item.confidenceLabel.includes("高") ? "A" : "B"
    }
  ];
}
