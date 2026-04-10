import type { EvidenceGraphViewModel, GlobeFlowViewModel } from "../../types/presentation";
import type { SemanticEntity, SemanticGraph, ThemeId } from "../../types/semantic";

export function buildGlobeFlows(graph: SemanticGraph, themeId: ThemeId): GlobeFlowViewModel[] {
  return graph.flows
    .filter((flow) => flow.theme === themeId)
    .flatMap((flow) => {
      const origin = getEntity(graph, flow.originId);
      const destination = getEntity(graph, flow.destinationId);

      if (!origin?.coordinates || !destination?.coordinates) {
        return [];
      }

      return [
        {
          id: flow.id,
          label: flow.label,
          origin,
          destination,
          route: getEntities(graph, flow.routeIds),
          theme: flow.theme,
          magnitudeLabel: flow.magnitudeLabel,
          riskLabel: flow.riskLabel
        }
      ];
    });
}

export function buildEvidenceGraph(graph: SemanticGraph, themeId: ThemeId): EvidenceGraphViewModel {
  const themeEntityIds = new Set(
    graph.entities.filter((entity) => entity.themes.includes(themeId)).map((entity) => entity.id)
  );
  const themeObservationIds = new Set(
    graph.observations.filter((observation) => observation.theme === themeId).map((observation) => observation.id)
  );
  const themeFlowIds = new Set(graph.flows.filter((flow) => flow.theme === themeId).map((flow) => flow.id));
  const edgeIds = new Set([...themeEntityIds, ...themeObservationIds, ...themeFlowIds]);
  const edges = graph.edges.filter(
    (edge) =>
      edge.theme === themeId ||
      edgeIds.has(edge.subjectId) ||
      edgeIds.has(edge.objectId) ||
      (themeEntityIds.has(edge.subjectId) && themeEntityIds.has(edge.objectId))
  );
  const nodeIds = new Set<string>();

  for (const edge of edges) {
    nodeIds.add(edge.subjectId);
    nodeIds.add(edge.objectId);
  }

  for (const id of themeEntityIds) {
    nodeIds.add(id);
  }

  return {
    nodes: [...nodeIds].map((id) => {
      const entity = getEntity(graph, id);
      const observation = graph.observations.find((candidate) => candidate.id === id);
      const flow = graph.flows.find((candidate) => candidate.id === id);

      return {
        id,
        label: entity?.label ?? observation?.label ?? flow?.label ?? id,
        kind: entity?.kind ?? observation?.kind ?? "DependencyFlow",
        theme: entity?.themes[0] ?? observation?.theme ?? flow?.theme
      };
    }),
    links: edges.map((edge) => ({
      id: edge.id,
      source: edge.subjectId,
      target: edge.objectId,
      label: edge.predicate
    }))
  };
}

function getEntity(graph: SemanticGraph, id: string): SemanticEntity | undefined {
  return graph.entities.find((entity) => entity.id === id);
}

function getEntities(graph: SemanticGraph, ids: string[]): SemanticEntity[] {
  return ids.flatMap((id) => {
    const entity = getEntity(graph, id);
    return entity ? [entity] : [];
  });
}
