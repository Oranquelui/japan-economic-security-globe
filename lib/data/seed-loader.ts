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
  SourceDocument,
  SourceRights
} from "../../types/semantic";

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string, context: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${context}.${key} must be a nonblank string`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string, context: string): string | undefined {
  return record[key] === undefined ? undefined : requiredString(record, key, context);
}

function parseSourceRights(value: unknown, sourceId: string): SourceRights {
  const context = `${sourceId}.rights`;
  const record = asRecord(value, context);
  const immutableArchiveUrl = requiredString(record, "immutableArchiveUrl", context);
  const immutableArchiveSha256 = requiredString(record, "immutableArchiveSha256", context);
  if (!immutableArchiveUrl.startsWith("/") && !immutableArchiveUrl.startsWith("https://")) {
    throw new Error(`${context}.immutableArchiveUrl must be a local artifact or HTTPS URL`);
  }
  if (!/^[a-f0-9]{64}$/.test(immutableArchiveSha256)) {
    throw new Error(`${context}.immutableArchiveSha256 must be a lowercase SHA-256`);
  }
  return {
    licenseLabel: requiredString(record, "licenseLabel", context),
    licenseUrl: requiredString(record, "licenseUrl", context),
    sourceVersion: requiredString(record, "sourceVersion", context),
    artifactVersion: requiredString(record, "artifactVersion", context),
    processingDate: requiredString(record, "processingDate", context),
    immutableArchiveUrl,
    immutableArchiveSha256,
    processingStatement: requiredString(record, "processingStatement", context),
    limitationStatement: requiredString(record, "limitationStatement", context)
  };
}

function parseSourceDocument(value: unknown): SourceDocument {
  const record = asRecord(value, "source");
  const id = requiredString(record, "id", "source");
  const sourceCategory = record.sourceCategory;
  const accessMode = record.accessMode;
  const tier = record.tier;
  if (sourceCategory !== undefined && !["official", "open-data", "private"].includes(String(sourceCategory))) {
    throw new Error(`${id}.sourceCategory is invalid`);
  }
  if (accessMode !== undefined && ![
    "api", "sparql", "ckan", "csv", "excel", "geojson", "tile", "pdf", "html"
  ].includes(String(accessMode))) {
    throw new Error(`${id}.accessMode is invalid`);
  }
  if (tier !== undefined && !["A", "B", "C"].includes(String(tier))) {
    throw new Error(`${id}.tier is invalid`);
  }
  if (record.official !== undefined && typeof record.official !== "boolean") {
    throw new Error(`${id}.official must be boolean`);
  }
  return {
    id,
    label: requiredString(record, "label", id),
    url: requiredString(record, "url", id),
    publisher: requiredString(record, "publisher", id),
    published: optionalString(record, "published", id),
    accessed: requiredString(record, "accessed", id),
    description: optionalString(record, "description", id),
    official: record.official as boolean | undefined,
    sourceCategory: sourceCategory as SourceDocument["sourceCategory"],
    rights: record.rights === undefined ? undefined : parseSourceRights(record.rights, id),
    accessMode: accessMode as SourceDocument["accessMode"],
    tier: tier as SourceDocument["tier"]
  };
}

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
  const typedSources = sources.map(parseSourceDocument);

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
