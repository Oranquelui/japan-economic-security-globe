import entities from "../../data/seed/entities.json";
import flows from "../../data/seed/flows.json";
import observations from "../../data/seed/observations.json";
import sources from "../../data/seed/sources.json";
import type {
  DependencyFlow,
  GraphEdge,
  Observation,
  SemanticEntity,
  SemanticGraph,
  SourceDocument
} from "../../types/semantic";

function buildEdges(flowData: DependencyFlow[], observationData: Observation[]): GraphEdge[] {
  const flowEdges = flowData.flatMap((flow) => [
    {
      id: `edge:${flow.id}:origin`,
      subjectId: flow.id,
      predicate: "importsFrom",
      objectId: flow.originId,
      sourceIds: flow.sourceIds,
      theme: flow.theme
    },
    {
      id: `edge:${flow.id}:destination`,
      subjectId: flow.id,
      predicate: "landsAt",
      objectId: flow.destinationId,
      sourceIds: flow.sourceIds,
      theme: flow.theme
    },
    ...flow.routeIds.map((routeId) => ({
      id: `edge:${flow.id}:route:${routeId}`,
      subjectId: flow.id,
      predicate: "transitsVia",
      objectId: routeId,
      sourceIds: flow.sourceIds,
      theme: flow.theme
    }))
  ]);

  const observationEdges = observationData.map((observation) => ({
    id: `edge:${observation.id}:subject`,
    subjectId: observation.id,
    predicate: "observedAt",
    objectId: observation.subjectId,
    sourceIds: observation.sourceIds,
    theme: observation.theme
  }));

  return [...flowEdges, ...observationEdges];
}

export function loadSeedGraph(): SemanticGraph {
  const typedEntities = entities as SemanticEntity[];
  const typedFlows = flows as DependencyFlow[];
  const typedObservations = observations as Observation[];
  const typedSources = sources as SourceDocument[];

  return {
    entities: typedEntities,
    flows: typedFlows,
    observations: typedObservations,
    sources: typedSources,
    edges: buildEdges(typedFlows, typedObservations)
  };
}
