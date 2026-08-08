import entities from "../../data/seed/entities.json";
import flows from "../../data/seed/flows.json";
import liveLogistics from "../../data/seed/live-logistics.json";
import observations from "../../data/seed/observations.json";
import roadOperations from "../../data/seed/logistics-road-operations.json";
import roadRouteEvidenceManifest from "../../data/seed/evidence/logistics-road-route-manifest.json";
import sources from "../../data/seed/sources.json";
import type { LiveLogisticsEvent } from "../../types/logistics";
import type { RoadOperationsDataset, RoadRouteEvidenceManifest } from "../../types/road-operations";
import { validateRoadRouteSources } from "../road-operations/source-gate";
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

export function loadSeedLiveLogistics(): LiveLogisticsEvent[] {
  return liveLogistics as LiveLogisticsEvent[];
}

export function loadRoadRouteEvidenceManifest(): RoadRouteEvidenceManifest {
  return structuredClone(roadRouteEvidenceManifest) as RoadRouteEvidenceManifest;
}

export function loadRoadRouteEvidenceManifests(): RoadRouteEvidenceManifest[] {
  return [loadRoadRouteEvidenceManifest()];
}

export function enforceRoadOperationsSourceGate(dataset: RoadOperationsDataset): RoadOperationsDataset {
  const gate = validateRoadRouteSources(dataset);
  if (!gate.ok) {
    throw new Error(`Road operations seed failed source gate: ${gate.errors.join("; ")}`);
  }
  return dataset;
}

export function loadSeedRoadOperations(): RoadOperationsDataset {
  const dataset = {
    ...(structuredClone(roadOperations) as unknown as Omit<RoadOperationsDataset, "evidenceManifests">),
    evidenceManifests: loadRoadRouteEvidenceManifests()
  };
  return enforceRoadOperationsSourceGate(dataset);
}

export { loadRankingSignals as loadSeedRankingSignals } from "../ranking/ranking-loader";
