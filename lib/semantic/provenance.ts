import type { SemanticGraph, SourceDocument } from "../../types/semantic";

export function getSourcesById(graph: SemanticGraph, sourceIds: string[]): SourceDocument[] {
  const seen = new Set<string>();

  return sourceIds.flatMap((sourceId) => {
    if (seen.has(sourceId)) {
      return [];
    }

    seen.add(sourceId);
    const source = graph.sources.find((candidate) => candidate.id === sourceId);
    return source ? [source] : [];
  });
}
