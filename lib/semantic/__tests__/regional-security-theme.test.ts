import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getThemeDefinition } from "../../config/theme-registry";
import { loadSeedGraph } from "../../data/seed-loader";
import { localizeKind } from "../../presentation/japanese";
import { THEME_IDS } from "../../../types/semantic";

describe("regional security theme", () => {
  it("uses regional security as the public theme name instead of direct threats", () => {
    expect(THEME_IDS).toContain("regional-security");
    expect(THEME_IDS).not.toContain("direct-threats");
    expect(getThemeDefinition("regional-security")).toEqual(
      expect.objectContaining({
        label: "地域安全保障",
        sublabel: "ミサイル / 航空活動 / 海空域"
      })
    );
  });

  it("adds safe regional security ontology classes and Japanese labels", () => {
    const ontology = fs.readFileSync(path.join(process.cwd(), "ontology/core.ttl"), "utf8");

    expect(ontology).toContain("jpsdg:SecurityActivity a owl:Class");
    expect(ontology).toContain("jpsdg:MissileTest a owl:Class");
    expect(ontology).toContain("jpsdg:LaunchSite a owl:Class");
    expect(ontology).toContain("jpsdg:ImpactArea a owl:Class");
    expect(ontology).toContain("jpsdg:MilitaryActivityRoute a owl:Class");
    expect(ontology).toContain("jpsdg:PublicAlertSignal a owl:Class");

    expect(localizeKind("SecurityActivity")).toBe("安全保障活動");
    expect(localizeKind("MissileTest")).toBe("ミサイル発射履歴");
    expect(localizeKind("MilitaryActivityRoute")).toBe("航空・海上活動経路");
  });

  it("registers official/public source groups for regional security evidence", () => {
    const graph = loadSeedGraph();
    const sourceIds = graph.sources.map((source) => source.id);

    expect(sourceIds).toEqual(
      expect.arrayContaining([
        "source:cns-north-korea-missile-test-database",
        "source:nagix-nk-missile-tests",
        "source:mod-dprk-missile-nuclear-development",
        "source:mod-joint-staff-air-activity"
      ])
    );

    expect(graph.sources.find((source) => source.id === "source:nagix-nk-missile-tests")).toEqual(
      expect.objectContaining({
        official: false,
        accessMode: "html"
      })
    );

    expect(graph.sources.find((source) => source.id === "source:mod-dprk-missile-nuclear-development")).toEqual(
      expect.objectContaining({
        official: true,
        accessMode: "pdf"
      })
    );
  });

  it("seeds a non-live regional security story with North Korea missile history and China activity placeholders", () => {
    const graph = loadSeedGraph();

    expect(graph.entities.find((entity) => entity.id === "country:north-korea")).toEqual(
      expect.objectContaining({
        kind: "Country",
        themes: ["regional-security"]
      })
    );

    expect(graph.entities.find((entity) => entity.kind === "MissileTest")).toEqual(
      expect.objectContaining({
        id: "activity:north-korea-missile-test-history",
        themes: ["regional-security"]
      })
    );
    expect(graph.entities.find((entity) => entity.kind === "LaunchSite")).toBeTruthy();
    expect(graph.entities.find((entity) => entity.kind === "ImpactArea")).toBeTruthy();

    expect(graph.flows.find((flow) => flow.id === "flow:nk-missile-history-japan-watch")).toEqual(
      expect.objectContaining({
        theme: "regional-security",
        originId: "country:north-korea",
        destinationId: "country:japan",
        mapLineKind: "impact-area"
      })
    );
    expect(graph.entities.find((entity) => entity.id === "impact-area:sea-of-japan")).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({
          estimatedImpactRadiusKm: 180
        })
      })
    );

    expect(graph.observations.find((observation) => observation.id === "observation:nk-missile-history-watch")).toEqual(
      expect.objectContaining({
        kind: "RegionalSecurityObservation",
        metric: "historical_public_activity",
        value: "non-live historical watch"
      })
    );

    expect(graph.entities.find((entity) => entity.id === "activity-route:china-air-activity-east-china-sea-public")).toEqual(
      expect.objectContaining({
        kind: "MilitaryActivityRoute",
        properties: expect.objectContaining({
          coverageClass: "official_public_aggregate",
          liveTracking: false
        })
      })
    );
  });
});
