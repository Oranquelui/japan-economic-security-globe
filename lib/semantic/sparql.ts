import type { DependencyFlow, Observation, SemanticEntity } from "../../types/semantic";

const DATA_BASE_IRI = "https://data.jp-strategic-dependency-graph.org/id/";

export function toResourceIri(id: string): string {
  return `<${DATA_BASE_IRI}${id.replace(":", "/")}>`;
}

export function buildFlowSparqlPreview(flow: DependencyFlow): { title: string; query: string } {
  return {
    title: `SPARQL preview for ${flow.label}`,
    query: [
      "PREFIX jpsdg: <https://data.jp-strategic-dependency-graph.org/ontology#>",
      "PREFIX prov: <http://www.w3.org/ns/prov#>",
      "",
      "SELECT ?flow ?predicate ?object ?source WHERE {",
      `  VALUES ?flow { ${toResourceIri(flow.id)} }`,
      "  { ?flow jpsdg:importsFrom ?object . BIND(jpsdg:importsFrom AS ?predicate) }",
      "  UNION { ?flow jpsdg:importsTo ?object . BIND(jpsdg:importsTo AS ?predicate) }",
      "  UNION { ?flow jpsdg:dependsOn ?object . BIND(jpsdg:dependsOn AS ?predicate) }",
      "  UNION { ?flow jpsdg:transitsVia ?object . BIND(jpsdg:transitsVia AS ?predicate) }",
      "  OPTIONAL { ?flow prov:wasDerivedFrom ?source . }",
      "}"
    ].join("\n")
  };
}

export function buildEntitySparqlPreview(entity: SemanticEntity): { title: string; query: string } {
  return {
    title: `SPARQL preview for ${entity.label}`,
    query: [
      "PREFIX jpsdg: <https://data.jp-strategic-dependency-graph.org/ontology#>",
      "PREFIX prov: <http://www.w3.org/ns/prov#>",
      "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
      "",
      "SELECT ?entity ?label ?predicate ?object ?source WHERE {",
      `  VALUES ?entity { ${toResourceIri(entity.id)} }`,
      "  OPTIONAL { ?entity rdfs:label ?label . }",
      "  OPTIONAL { ?entity ?predicate ?object . }",
      "  OPTIONAL { ?entity prov:wasDerivedFrom ?source . }",
      "}"
    ].join("\n")
  };
}

export function buildObservationSparqlPreview(observation: Observation): { title: string; query: string } {
  return {
    title: `SPARQL preview for ${observation.label}`,
    query: [
      "PREFIX jpsdg: <https://data.jp-strategic-dependency-graph.org/ontology#>",
      "PREFIX prov: <http://www.w3.org/ns/prov#>",
      "",
      "SELECT ?observation ?metric ?value ?subject ?source WHERE {",
      `  VALUES ?observation { ${toResourceIri(observation.id)} }`,
      "  ?observation jpsdg:metric ?metric ;",
      "    jpsdg:value ?value ;",
      "    jpsdg:observedAt ?subject .",
      "  OPTIONAL { ?observation prov:wasDerivedFrom ?source . }",
      "}"
    ].join("\n")
  };
}
