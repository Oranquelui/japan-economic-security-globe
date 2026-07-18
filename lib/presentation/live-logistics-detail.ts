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
      `${item.corridorLabel} を通る ${item.kindLabel} の ${getSummarySignalLabel(item)} です。`,
      `${item.statusLabel} / ${item.etaLabel} / ${item.lastSeenLabel}`
    ].join(" "),
    whyItMatters: buildWhyItMatters(item),
    signal: {
      category: getSignalCategory(item),
      severity: toSignalSeverity(item.signalTone),
      status: item.statusLabel.toLowerCase().includes("underway") ? "監視中" : "表示対象",
      recommendedAction: getRecommendedAction(item),
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

function getSummarySignalLabel(item: LiveLogisticsItemViewModel) {
  if (item.kindLabel === "空港運用") {
    return "airport-level公開集約シグナル";
  }

  if (item.laneId === "maritime") {
    return item.kindLabel === "外航海上補助" ? "遅延AIS補助シグナル" : "公開集約シグナル";
  }

  return "国内物流公開シグナル";
}

function buildWhyItMatters(item: LiveLogisticsItemViewModel) {
  if (item.laneId === "maritime") {
    return item.kindLabel === "外航海上補助"
      ? "外航AISは Energy theme の補助線として扱い、海峡通過・港湾ETA・出典遅延をエネルギー着地点の前段文脈として確認します。"
      : "非エネルギー一般貨物は、港湾到着前後の公開集約として扱い、港湾後続と国内配送への波及を確認します。";
  }

  if (item.kindLabel === "空港運用") {
    return "空港運用は、個別便ではなく airport-level の公開集約として扱い、航空貨物と国内配送への波及を人物・個別便追跡と切り離して確認します。";
  }

  return "国内物流を道路・鉄道・内航海運・航空に分けて見ることで、港湾到着後の燃料・物流ボトルネックを外航AISルートと混同せずに確認できます。";
}

function getSignalCategory(item: LiveLogisticsItemViewModel) {
  if (item.laneId === "maritime") {
    return item.kindLabel === "外航海上補助" ? "外航AIS補助" : "一般貨物・港湾後続";
  }

  return item.kindLabel === "空港運用" ? "空港運用・航空貨物" : "国内物流接続";
}

function getRecommendedAction(item: LiveLogisticsItemViewModel) {
  if (item.laneId === "maritime") {
    return item.kindLabel === "外航海上補助"
      ? "AIS位置、海峡通過、港湾ETA、出典遅延を Energy theme の補助線として確認"
      : "港湾到着前後の公開集約と、道路・鉄道・内航・空港への後続接続を確認";
  }

  if (item.kindLabel === "空港運用") {
    return "公開空港情報と気象文脈を airport-level で確認。個別旅客・個別便・軍用機は対象外";
  }

  return "道路・鉄道・内航海運・航空のどの国内モードで着地後の波及が出るか確認";
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
  if (item.laneId !== "maritime") {
    return buildItemFallbackSource(item);
  }

  const sourceIds = linkedFlows.flatMap((flow) => flow.sourceIds);
  const linkedSources = getSourcesById(graph, sourceIds);

  if (linkedSources.length > 0) {
    return linkedSources;
  }

  return buildItemFallbackSource(item);
}

function buildItemFallbackSource(item: LiveLogisticsItemViewModel): SourceDocument[] {
  return [
    {
      id: `${item.id}:source`,
      label: item.sourceLabel,
      url: "",
      publisher: item.sourceLabel,
      accessed: "",
      description: `${item.disclosureLabel} / demo seed, not an official live-provider feed`,
      official: false,
      accessMode: "html",
      tier: item.confidenceLabel.includes("高") ? "A" : "B"
    }
  ];
}
