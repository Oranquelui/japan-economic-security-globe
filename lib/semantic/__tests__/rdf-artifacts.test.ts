import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("RDF artifacts", () => {
  test("ships ontology stubs and launch SPARQL examples", () => {
    const ontology = readFileSync(join(root, "ontology/core.ttl"), "utf8");
    const observations = readFileSync(join(root, "ontology/observations.ttl"), "utf8");
    const energyQuery = readFileSync(join(root, "queries/energy-route-evidence.rq"), "utf8");
    const riceQuery = readFileSync(join(root, "queries/rice-policy-impact.rq"), "utf8");

    expect(ontology).toContain("jpsdg:DependencyFlow");
    expect(ontology).toContain("prov:wasDerivedFrom");
    expect(ontology).toContain("jpsdg:Chokepoint");
    expect(observations).toContain("jpsdg:ReservoirObservation");
    expect(energyQuery).toContain("jpsdg:transitsVia");
    expect(energyQuery).toContain("Strait of Hormuz");
    expect(riceQuery).toContain("jpsdg:PolicySignal");
  });
});
