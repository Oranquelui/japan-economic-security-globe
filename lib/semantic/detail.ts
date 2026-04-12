import type { DetailViewModel } from "../../types/presentation";
import type { DependencyFlow, Observation, SemanticEntity, SemanticGraph } from "../../types/semantic";
import { getSourcesById } from "./provenance";
import {
  buildSignalNarrativeForEntity,
  buildSignalNarrativeForFlow,
  buildSignalNarrativeForObservation,
  buildSourceHighlightsFromEntity,
  buildSourceHighlightsFromFlow,
  buildSourceHighlightsFromObservation
} from "./signal-narrative";
import {
  buildEntitySparqlPreview,
  buildFlowSparqlPreview,
  buildObservationSparqlPreview
} from "./sparql";

export function getDetailView(graph: SemanticGraph, id: string): DetailViewModel {
  const flow = graph.flows.find((candidate) => candidate.id === id);
  if (flow) {
    return buildFlowDetail(graph, flow);
  }

  const observation = graph.observations.find((candidate) => candidate.id === id);
  if (observation) {
    return buildObservationDetail(graph, observation);
  }

  const entity = graph.entities.find((candidate) => candidate.id === id);
  if (entity) {
    return buildEntityDetail(graph, entity);
  }

  throw new Error(`No semantic item found for ${id}`);
}

function buildFlowDetail(graph: SemanticGraph, flow: DependencyFlow): DetailViewModel {
  const relatedEntityIds = [
    flow.originId,
    flow.destinationId,
    flow.resourceId,
    flow.productId,
    ...flow.routeIds
  ].filter(Boolean) as string[];
  const relatedEntities = getEntitiesById(graph, relatedEntityIds);

  const sources = getSourcesById(graph, flow.sourceIds);

  return {
    id: flow.id,
    label: flow.label,
    kind: "DependencyFlow",
    summary: flow.summary,
    whyItMatters: summarizeWhyItMatters(relatedEntities),
    signal: buildSignalNarrativeForFlow(flow),
    sources,
    sourceHighlights: buildSourceHighlightsFromFlow(flow, sources),
    relatedEntities,
    linkedFlows: [flow],
    sparql: buildFlowSparqlPreview(flow)
  };
}

function buildEntityDetail(graph: SemanticGraph, entity: SemanticEntity): DetailViewModel {
  const linkedFlows = graph.flows.filter(
    (flow) =>
      flow.originId === entity.id ||
      flow.destinationId === entity.id ||
      flow.resourceId === entity.id ||
      flow.productId === entity.id ||
      flow.routeIds.includes(entity.id)
  );
  const relatedEntityIds = linkedFlows.flatMap((flow) => [
    flow.originId,
    flow.destinationId,
    flow.resourceId,
    flow.productId,
    ...flow.routeIds
  ]);

  const sources = getSourcesById(graph, [...(entity.sourceIds ?? []), ...entity.provenance]);

  return {
    id: entity.id,
    label: entity.label,
    kind: entity.kind,
    summary: entity.summary,
    whyItMatters: entity.whyItMatters,
    signal: buildSignalNarrativeForEntity(entity),
    sources,
    sourceHighlights: buildSourceHighlightsFromEntity(entity, sources),
    relatedEntities: getEntitiesById(
      graph,
      relatedEntityIds.filter((relatedId): relatedId is string => Boolean(relatedId) && relatedId !== entity.id)
    ),
    linkedFlows,
    sparql: buildEntitySparqlPreview(entity)
  };
}

function buildObservationDetail(graph: SemanticGraph, observation: Observation): DetailViewModel {
  const subject = graph.entities.find((entity) => entity.id === observation.subjectId);
  const sources = getSourcesById(graph, observation.sourceIds);

  return {
    id: observation.id,
    label: observation.label,
    kind: observation.kind,
    summary: observation.summary,
    whyItMatters: subject?.whyItMatters ?? "This observation is a source-linked signal in Japan's dependency graph.",
    signal: buildSignalNarrativeForObservation(observation),
    sources,
    sourceHighlights: buildSourceHighlightsFromObservation(observation, sources),
    relatedEntities: subject ? [subject] : [],
    linkedFlows: graph.flows.filter(
      (flow) =>
        flow.originId === observation.subjectId ||
        flow.destinationId === observation.subjectId ||
        flow.resourceId === observation.subjectId ||
        flow.productId === observation.subjectId ||
        flow.routeIds.includes(observation.subjectId)
    ),
    sparql: buildObservationSparqlPreview(observation)
  };
}

function getEntitiesById(graph: SemanticGraph, ids: string[]): SemanticEntity[] {
  const seen = new Set<string>();

  return ids.flatMap((id) => {
    if (seen.has(id)) {
      return [];
    }

    seen.add(id);
    const entity = graph.entities.find((candidate) => candidate.id === id);
    return entity ? [entity] : [];
  });
}

function summarizeWhyItMatters(entities: SemanticEntity[]): string {
  const japanFocusedReason = entities.find((entity) => entity.id === "country:japan")?.whyItMatters;
  const concreteReason = entities.find((entity) => entity.id !== "country:japan")?.whyItMatters;

  return [concreteReason, japanFocusedReason].filter(Boolean).join(" ");
}
