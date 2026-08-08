import { describe, expect, test } from "vitest";

import type { LiveLogisticsViewModel } from "../../../types/logistics";
import { THEME_IDS } from "../../../types/semantic";
import {
  loadSeedGraph,
  loadSeedLiveLogistics,
  loadSeedRoadOperations
} from "../../data/seed-loader";
import { buildLiveLogisticsView } from "../live-logistics";
import { buildRoadOperationsView } from "../road-operations";
import { getThemeView } from "../../semantic/selectors";
import { buildJapanMapCanvasModel } from "../map-canvas";
import type {
  JapanMapCanvasModel,
  JapanMapLogisticsRoute,
  JapanMapRegion,
  JapanMapRoute
} from "../map-canvas";
import { buildWorkspacePresentation, resolveLegacyPresentation } from "../workspace";

describe("japan map canvas model", () => {
  test("requires logistics metadata only on live map routes", () => {
    const genericRoute: JapanMapRoute = {
      id: "flow:test",
      label: "一般経路",
      pointIds: ["point:a", "point:b"],
      relatedIds: []
    };
    const logisticsRoute: JapanMapLogisticsRoute = {
      id: "live-logistics:test",
      label: "物流経路",
      laneId: "rail",
      modeLabel: "鉄道",
      pointIds: ["point:a", "point:b"],
      relatedIds: [],
      selectionId: "live-logistics:test",
      selected: false
    };
    const validLiveRoutes: JapanMapCanvasModel["liveRoutes"] = [logisticsRoute];
    const invalidLiveRoutes: JapanMapCanvasModel["liveRoutes"] = [
      // @ts-expect-error Live routes require lane metadata.
      {
        id: "live-logistics:missing-lane",
        label: "レーン欠落の物流経路",
        modeLabel: "鉄道",
        pointIds: ["point:a", "point:b"],
        relatedIds: [],
        selectionId: "live-logistics:missing-lane",
        selected: false
      },
      // @ts-expect-error Live routes require mode metadata.
      {
        id: "live-logistics:missing-mode",
        label: "モード欠落の物流経路",
        laneId: "rail",
        pointIds: ["point:a", "point:b"],
        relatedIds: [],
        selectionId: "live-logistics:missing-mode",
        selected: false
      }
    ];

    expect(genericRoute).not.toHaveProperty("laneId");
    expect(validLiveRoutes?.every((route) => route.laneId && route.modeLabel)).toBe(true);
    void invalidLiveRoutes;
  });

  test("types geometry and metric state as strict discriminated pairs", () => {
    const validBoundaryMetric: JapanMapRegion = {
      id: "prefecture:tokyo",
      label: "東京都",
      lat: 35.6762,
      lon: 139.6503,
      geometryKind: "prefecture-boundary",
      prefectureCode: "JP-13",
      value: 50,
      rawValue: 465
    };
    const validMissingRadius: JapanMapRegion = {
      id: "reservoir:test",
      label: "テスト貯水池",
      lat: 35,
      lon: 139,
      geometryKind: "representative-radius",
      value: null
    };

    // @ts-expect-error Prefecture boundaries require a stable prefecture code.
    const boundaryWithoutCode: JapanMapRegion = {
      id: "prefecture:tokyo",
      label: "東京都",
      lat: 35.6762,
      lon: 139.6503,
      geometryKind: "prefecture-boundary",
      value: null
    };
    const radiusWithCode: JapanMapRegion = {
      id: "reservoir:test",
      label: "テスト貯水池",
      lat: 35,
      lon: 139,
      geometryKind: "representative-radius",
      // @ts-expect-error Representative-radius regions cannot carry a prefecture code.
      prefectureCode: "JP-13",
      value: null
    };
    // @ts-expect-error A finite normalized value requires a paired raw value.
    const normalizedWithoutRaw: JapanMapRegion = {
      id: "reservoir:test",
      label: "テスト貯水池",
      lat: 35,
      lon: 139,
      geometryKind: "representative-radius",
      value: 50
    };
    // @ts-expect-error A missing normalized value cannot carry a raw value.
    const missingWithRaw: JapanMapRegion = {
      id: "reservoir:test",
      label: "テスト貯水池",
      lat: 35,
      lon: 139,
      geometryKind: "representative-radius",
      value: null,
      rawValue: 10
    };

    expect([validBoundaryMetric, validMissingRadius]).toHaveLength(2);
    void boundaryWithoutCode;
    void radiusWithCode;
    void normalizedWithoutRaw;
    void missingWithRaw;
  });

  test("starts Japan-first but prepares global overlay points and routes for zoom-out", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "energy");

    const model = buildJapanMapCanvasModel(graph, view, "flow:qatar-lng-japan", null, null);

    expect(model.points.map((point) => point.id)).toEqual(
      expect.arrayContaining(["terminal:sodegaura-lng", "prefecture:tokyo"])
    );
    expect(model.points.map((point) => point.id)).not.toContain("country:qatar");
    expect(model.globalPoints.map((point) => point.id)).toEqual(
      expect.arrayContaining(["country:qatar", "chokepoint:hormuz", "country:japan"])
    );
    expect(model.globalRoutes.find((route) => route.id === "flow:qatar-lng-japan")?.pointIds).toEqual(
      expect.arrayContaining(["country:qatar", "chokepoint:hormuz", "terminal:sodegaura-lng"])
    );
    expect(model.foreignWindow?.entities.map((entity) => entity.id)).toContain("country:qatar");
    expect(model.routes).toHaveLength(0);
    expect(model.liveRoutePresentation).toBe("animated-tracking");
  });

  test("expands rice domestic points beyond the original two using prefectural production anchors", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "observation:rice-price-signal-2026", null, null);
    const ricePrefecturePoints = model.points.filter((point) => point.id.startsWith("prefecture:"));

    expect(model.points.map((point) => point.id)).toEqual(
      expect.arrayContaining([
        "prefecture:niigata",
        "prefecture:hokkaido",
        "prefecture:akita",
        "prefecture:miyagi",
        "prefecture:yamagata",
        "prefecture:hyogo",
        "prefecture:okayama",
        "prefecture:hiroshima",
        "prefecture:fukuoka"
      ])
    );
    expect(ricePrefecturePoints.length).toBeGreaterThanOrEqual(47);
    const niigata = model.regions.find((region) => region.id === "prefecture:niigata");
    const osaka = model.regions.find((region) => region.id === "prefecture:osaka");
    expect(niigata?.value).not.toBeNull();
    expect(niigata?.value ?? 0).toBeGreaterThan(osaka?.value ?? 0);
    expect(niigata).toMatchObject({
      geometryKind: "representative-radius",
      rawValue: expect.any(Number),
      unit: "トン",
      periodLabel: "令和5年産",
      sourceIds: ["source:estat-rice-prefecture-harvest-r5"]
    });
  });

  test.each([
    ["rice", "Prefecture", "riceMainUseHarvestTonsR5"],
    ["water", "Reservoir", "latestFillRatePercent"]
  ] as const)("retains a %s regional entity whose metric is missing", (themeId, kind, property) => {
    const graph = structuredClone(loadSeedGraph());
    const entity = graph.entities.find(
      (candidate) => candidate.kind === kind && candidate.themes.includes(themeId)
    );
    expect(entity?.coordinates).toBeDefined();
    delete entity?.properties?.[property];

    const model = buildJapanMapCanvasModel(graph, getThemeView(graph, themeId), entity!.id, null, null);
    const region = model.regions.find((candidate) => candidate.id === entity!.id);

    expect(region).toBeDefined();
    expect(region?.value).toBeNull();
    expect(region?.rawValue).toBeUndefined();
  });

  test("does not add null regional metrics to themes without a regional layer", () => {
    const graph = loadSeedGraph();
    const model = buildJapanMapCanvasModel(
      graph,
      getThemeView(graph, "energy"),
      "observation:lng-electricity-april-2026",
      null,
      null
    );

    expect(model.regions).toEqual([]);
  });

  test("does not surface rice route overlays for policy or price observations", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "observation:rice-stockpile-policy-2026", null, null);

    expect(model.routes).toHaveLength(0);
    expect(model.globalRoutes).toHaveLength(0);
    expect(model.foreignWindow).toBeUndefined();
  });

  test("does not render conceptual rice bridge flows as map routes even when the flow itself is selected", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");

    const model = buildJapanMapCanvasModel(graph, view, "flow:energy-inputs-rice", null, null);

    expect(model.routes).toHaveLength(0);
    expect(model.globalRoutes).toHaveLength(0);
    expect(model.foreignWindow).toBeUndefined();
  });

  test("adds live logistics routes and route-only points to the map model", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const liveLogistics = liveLogisticsFixture([
        {
          id: "live-logistics:container-asia-yokohama",
          laneId: "maritime",
          label: "コンテナ一般貨物: 東アジア → 横浜港 → 首都圏配送",
          modeLabel: "海上",
          pointIds: ["chokepoint:malacca", "port:yokohama", "prefecture:tokyo"],
          relatedIds: ["flow:japan-linked-maritime-watch"]
        },
        {
          id: "live-logistics:road-keihin-tokyo",
          laneId: "road",
          label: "陸路: 横浜港 → 首都圏配送",
          modeLabel: "道路",
          pointIds: ["port:yokohama", "prefecture:tokyo"],
          relatedIds: ["flow:japan-linked-maritime-watch"]
        }
      ]);

    const model = buildJapanMapCanvasModel(
      graph,
      view,
      "flow:japan-linked-maritime-watch",
      null,
      liveLogistics
    );

    const liveRoutes = model.liveRoutes ?? [];
    const livePoints = model.livePoints ?? [];
    const impactRegions = model.logisticsImpactRegions ?? [];
    const impactRoutes = model.logisticsImpactRoutes ?? [];
    const impactCorridors = model.logisticsImpactCorridors ?? [];

    expect(liveRoutes.map((route) => route.id)).toEqual(
      expect.arrayContaining(["live-logistics:container-asia-yokohama", "live-logistics:road-keihin-tokyo"])
    );
    const containerRoute = liveRoutes.find((route) => route.id === "live-logistics:container-asia-yokohama");
    expect(containerRoute?.pointIds).toEqual(["port:yokohama", "prefecture:tokyo"]);
    expect(livePoints.map((point) => point.id)).toEqual(
      expect.arrayContaining(["port:yokohama", "prefecture:tokyo"])
    );
    expect(livePoints.map((point) => point.id)).not.toContain("chokepoint:malacca");
    expect(model.liveVessels).toEqual([]);
    expect(impactRegions).toEqual([]);
    expect(impactRoutes).toEqual([]);
    expect(impactCorridors).toEqual([]);
  });

  test("uses validated detailed road geometry instead of only the matching endpoint chord", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const roadOperations = buildRoadOperationsView(
      loadSeedRoadOperations(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const selectedSegment = roadOperations.segments[0];
    const route = roadOperations.routes.find((candidate) => candidate.id === selectedSegment.routeId)!;

    const model = buildJapanMapCanvasModel(
      graph,
      view,
      selectedSegment.id,
      null,
      live,
      roadOperations
    );

    const roadSegments = model.roadSegments ?? [];
    const roadOperationalOverlays = model.roadOperationalOverlays ?? [];
    const roadJunctions = model.roadJunctions ?? [];
    expect(roadSegments).toHaveLength(roadOperations.segments.length);
    expect(model.liveRoutePresentation).toBe("static-logistics-modes");
    expect(roadSegments[0]).toMatchObject({
      id: selectedSegment.id,
      routeId: selectedSegment.routeId,
      routeLabel: route.label,
      label: selectedSegment.label,
      roadName: selectedSegment.roadName,
      routeNumber: selectedSegment.routeNumber,
      direction: selectedSegment.direction,
      conditionIds: selectedSegment.conditionIds,
      restrictionIds: selectedSegment.restrictionIds,
      selectionId: selectedSegment.routeId,
      selected: true
    });
    expect(roadSegments[0].coordinates).toEqual(selectedSegment.coordinates);
    expect(roadSegments[0].coordinates.length).toBeGreaterThan(2);
    expect(roadJunctions[0]).toMatchObject({
      id: roadOperations.junctions[0].id,
      routeId: roadOperations.junctions[0].routeId,
      sourceIds: roadOperations.junctions[0].sourceIds,
      selectionId: roadOperations.junctions[0].routeId,
      selected: false
    });
    expect(roadJunctions[0].coordinates).toEqual(roadOperations.junctions[0].coordinates);
    expect(model.liveRoutes?.map((candidate) => candidate.id)).not.toContain(
      "live-logistics:road-keihin-tokyo"
    );
    expect(roadOperationalOverlays.map((overlay) => overlay.id)).toEqual(expect.arrayContaining([
      "road-condition:demo-daikoku-ukishima-congestion",
      "road-restriction:demo-ukishima-oi-construction",
      "road-restriction:demo-oi-tatsumi-lane"
    ]));
    expect(roadOperationalOverlays.find((overlay) => (
      overlay.id === "road-condition:demo-daikoku-ukishima-congestion"
    ))).toMatchObject({
      routeId: "live-logistics:road-keihin-tokyo",
      segmentId: "road-segment:daikoku-ukishima-east",
      selectionId: "road-condition:demo-daikoku-ukishima-congestion",
      recordType: "condition",
      visualKind: "congestion",
      condition: "congestion",
      lifecycle: "current",
      freshness: "stale",
      dataPosture: "fixed-demo",
      stateLabel: "渋滞例・期限切れ",
      disclosureLabel: "固定デモ / 現在情報ではありません",
      selected: false
    });
    expect(roadOperationalOverlays.find((overlay) => (
      overlay.id === "road-restriction:demo-oi-tatsumi-lane"
    ))).toMatchObject({
      selectionId: "road-restriction:demo-oi-tatsumi-lane",
      recordType: "restriction",
      visualKind: "lane-restriction",
      restrictionKind: "lane-restriction",
      lifecycle: "planned",
      freshness: "stale",
      stateLabel: "予定 車線規制例・期限切れ"
    });
    const unknownOverlays = roadOperationalOverlays.filter((overlay) => overlay.recordType === "unknown");
    expect(unknownOverlays.length).toBeGreaterThan(0);
    expect(unknownOverlays.every((overlay) => (
      overlay.stateLabel === "状況不明" &&
      overlay.selectionId === overlay.routeId &&
      overlay.freshness === "unavailable"
    ))).toBe(true);
  });

  test("suppresses a matching endpoint chord without depending on a hardcoded road route id", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const roadOperations = buildRoadOperationsView(
      loadSeedRoadOperations(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const originalRouteId = roadOperations.routes[0].id;
    const genericRouteId = "live-logistics:road-complete-generic";
    roadOperations.routes[0].id = genericRouteId;
    roadOperations.segments
      .filter((segment) => segment.routeId === originalRouteId)
      .forEach((segment) => { segment.routeId = genericRouteId; });
    roadOperations.junctions
      .filter((junction) => junction.routeId === originalRouteId)
      .forEach((junction) => { junction.routeId = genericRouteId; });
    live.mapRoutes.find((route) => route.id === originalRouteId)!.id = genericRouteId;

    const model = buildJapanMapCanvasModel(graph, view, "", null, live, roadOperations);

    expect(model.roadSegments?.map((segment) => segment.routeId)).toContain(genericRouteId);
    expect(model.liveRoutes?.map((route) => route.id)).not.toContain(genericRouteId);
  });

  test("keeps the endpoint chord when one expected detailed segment is rejected", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const dataset = loadSeedRoadOperations();
    const rejectedSegment = dataset.segments![0];
    rejectedSegment.coordinates = [rejectedSegment.coordinates[0]];
    const roadOperations = buildRoadOperationsView(
      dataset,
      new Date("2026-08-08T00:00:00Z")
    )!;

    const model = buildJapanMapCanvasModel(graph, view, "", null, live, roadOperations);

    expect(roadOperations.diagnostics.rejectedSegmentIds).toContain(rejectedSegment.id);
    expect(model.roadSegments?.map((segment) => segment.id)).not.toContain(rejectedSegment.id);
    expect(model.liveRoutes?.map((route) => route.id)).toContain(
      "live-logistics:road-keihin-tokyo"
    );
  });

  test("keeps the endpoint chord when actual segment ids duplicate one expected id and omit another", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const roadOperations = buildRoadOperationsView(
      loadSeedRoadOperations(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const duplicateSegmentId = roadOperations.segments[0].id;
    const missingSegmentId = roadOperations.segments[1].id;
    roadOperations.segments[1].id = duplicateSegmentId;

    const model = buildJapanMapCanvasModel(graph, view, "", null, live, roadOperations);

    expect(roadOperations.routes[0].segmentIds).toContain(missingSegmentId);
    expect(model.roadSegments?.map((segment) => segment.id)).not.toContain(missingSegmentId);
    expect(model.liveRoutes?.map((route) => route.id)).toContain(
      "live-logistics:road-keihin-tokyo"
    );
  });

  test("keeps supported logistics routes with lane metadata and leaves an empty active id unselected", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const roadOperations = buildRoadOperationsView(
      loadSeedRoadOperations(),
      new Date("2026-08-08T00:00:00Z")
    )!;

    const model = buildJapanMapCanvasModel(graph, view, "", null, live, roadOperations);

    expect(model.liveRoutes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "live-logistics:rail-tokyo-aichi-osaka",
        laneId: "rail",
        modeLabel: "鉄道",
        selectionId: "live-logistics:rail-tokyo-aichi-osaka",
        selected: false
      }),
      expect.objectContaining({
        id: "live-logistics:coastal-tokyo-bay-hanshin",
        laneId: "coastal",
        modeLabel: "内航",
        selected: false
      }),
      expect.objectContaining({
        id: "live-logistics:air-tokyo-fukuoka",
        laneId: "air",
        modeLabel: "航空",
        selected: false
      }),
      expect.objectContaining({
        id: "live-logistics:airport-haneda-narita-ops",
        laneId: "air",
        modeLabel: "航空",
        selected: false
      }),
      expect.objectContaining({
        id: "live-logistics:container-asia-yokohama",
        laneId: "maritime",
        modeLabel: "海上",
        selected: false
      })
    ]));
    expect(model.liveRoutes?.map((candidate) => candidate.id)).not.toContain(
      "live-logistics:road-keihin-tokyo"
    );
    expect(model.roadSegments?.every((segment) => segment.selected === false)).toBe(true);
    expect(model.roadJunctions?.every((junction) => junction.selected === false)).toBe(true);
    expect(model.liveRoutes?.every((route) => route.laneId && route.modeLabel)).toBe(true);
    expect(model.liveRoutes?.every((route) => route.selected === false)).toBe(true);
  });

  test("does not fabricate a semantic logistics impact model without typed impact metrics", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-07-18T00:00:00Z")
    );
    const workspace = buildWorkspacePresentation(graph, view, live);
    const impactLayer = workspace.layers.find((layer) => layer.id === "logistics-impact")!;
    const model = buildJapanMapCanvasModel(graph, view, "prefecture:tokyo", impactLayer, live);

    expect(impactLayer.available).toBe(false);
    expect(model.logisticsImpactRegions).toEqual([]);
    expect(model.logisticsImpactCorridors).toEqual([]);
    expect(JSON.stringify(model)).not.toMatch(/影響指数|\"rawValue\":(?:92|76|68)|\"periodLabel\":\"現在\"/);
  });

  test("keeps the logistics arrival layer on the static route presentation contract", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const workspace = buildWorkspacePresentation(graph, view, live);
    const arrivalLayer = workspace.layers.find((layer) => layer.id === "logistics-arrival")!;

    const model = buildJapanMapCanvasModel(graph, view, "", arrivalLayer, live);

    expect(arrivalLayer.content).toEqual({ kind: "live-logistics", view: "arrival" });
    expect(model.liveRoutePresentation).toBe("static-logistics-modes");
  });

  test("keeps the logistics impact layer on the static route presentation contract", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const live = buildLiveLogisticsView(
      "logistics",
      null,
      loadSeedLiveLogistics(),
      new Date("2026-08-08T00:00:00Z")
    )!;
    const workspace = buildWorkspacePresentation(graph, view, live);
    const impactLayer = workspace.layers.find((layer) => layer.id === "logistics-impact")!;

    const model = buildJapanMapCanvasModel(graph, view, "", impactLayer, live);

    expect(impactLayer.content).toEqual({ kind: "live-logistics", view: "impact" });
    expect(model.liveRoutePresentation).toBe("static-logistics-modes");
  });

  test("renders airport operations as facility points without aircraft markers", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "logistics");
    const liveLogistics = liveLogisticsFixture([
        {
          id: "live-logistics:airport-haneda-narita-ops",
          laneId: "air",
          label: "空港運用",
          modeLabel: "航空",
          pointIds: ["airport:haneda", "airport:narita", "prefecture:tokyo"],
          relatedIds: ["airport:haneda", "airport:narita"]
        }
      ]);

    const model = buildJapanMapCanvasModel(
      graph,
      view,
      "live-logistics:airport-haneda-narita-ops",
      null,
      liveLogistics
    );

    expect((model.liveRoutes ?? []).map((route) => route.id)).toEqual([
      "live-logistics:airport-haneda-narita-ops"
    ]);
    expect((model.livePoints ?? []).map((point) => [point.id, point.kind])).toEqual(
      expect.arrayContaining([
        ["airport:haneda", "Airport"],
        ["airport:narita", "Airport"]
      ])
    );
    expect(model.liveVessels).toEqual([]);
  });

  test("renders regional security historical routes without live tracking points", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "regional-security");

    const model = buildJapanMapCanvasModel(graph, view, "flow:nk-missile-history-japan-watch", null, null);

    expect(model.globalRoutes.find((route) => route.id === "flow:nk-missile-history-japan-watch")?.pointIds).toEqual([
      "country:north-korea",
      "launch-site:north-korea-representative",
      "activity-route:nk-missile-representative-arc",
      "impact-area:sea-of-japan",
      "country:japan"
    ]);
    expect(model.globalPoints.map((point) => point.id)).toEqual(
      expect.arrayContaining([
        "country:north-korea",
        "launch-site:north-korea-representative",
        "activity-route:nk-missile-representative-arc",
        "impact-area:sea-of-japan",
        "country:japan"
      ])
    );
    expect(model.livePoints).toEqual([]);
    expect(model.liveRoutes).toEqual([]);
    expect(model.liveVessels).toEqual([]);
  });

  test("uses a semantic regional layer to build the rice harvest choropleth", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const workspace = buildWorkspacePresentation(graph, view);
    const layer = workspace.layers.find((candidate) => candidate.id === "rice-harvest")!;

    const model = buildJapanMapCanvasModel(graph, view, "prefecture:niigata", layer, null);
    const niigata = model.regions.find((region) => region.id === "prefecture:niigata")!;
    const hokkaido = model.regions.find((region) => region.id === "prefecture:hokkaido")!;

    expect(model.regions).toHaveLength(47);
    expect(model.regions.filter((region) => region.rawValue !== undefined)).toHaveLength(47);
    expect(niigata.value ?? 0).toBeGreaterThan(hokkaido.value ?? 0);
    expect(niigata).toMatchObject({
      geometryKind: "prefecture-boundary",
      prefectureCode: "JP-15",
      rawValue: 514100,
      unit: "トン",
      periodLabel: "令和5年産",
      sourceIds: [
        "source:estat-rice-prefecture-harvest-r5",
        "source:natural-earth-admin1-japan-5-1-1"
      ]
    });
    expect(model.routes).toEqual([]);
    expect(model.globalRoutes).toEqual([]);
  });

  test("keeps non-prefecture regional metrics on the representative-radius contract", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "water");
    const workspace = buildWorkspacePresentation(graph, view);
    const layer = workspace.layers.find((candidate) => candidate.id === "water-fill-rate")!;

    const model = buildJapanMapCanvasModel(graph, view, "reservoir:ogouchi", layer, null);

    expect(model.regions.length).toBeGreaterThan(0);
    expect(model.regions.every((region) => region.geometryKind === "representative-radius")).toBe(true);
    expect(model.regions.every((region) => region.prefectureCode === undefined)).toBe(true);
  });

  test("builds distinct selectable observation points for rice price and inventory policy", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "rice");
    const workspace = buildWorkspacePresentation(graph, view);
    const priceLayer = workspace.layers.find((layer) => layer.id === "rice-price")!;
    const inventoryLayer = workspace.layers.find((layer) => layer.id === "rice-inventory-policy")!;

    const price = buildJapanMapCanvasModel(graph, view, "observation:rice-price-signal-2026", priceLayer, null);
    const inventory = buildJapanMapCanvasModel(graph, view, "observation:rice-private-inventory-feb-2026", inventoryLayer, null);

    expect(price.points.map((point) => point.selectionId)).toEqual([
      "observation:rice-price-signal-2026"
    ]);
    expect(inventory.points.map((point) => point.selectionId)).toEqual([
      "observation:rice-private-inventory-feb-2026",
      "observation:rice-stockpile-policy-2026"
    ]);
    expect(new Set(inventory.points.map((point) => `${point.lat}:${point.lon}`)).size).toBe(2);
    expect(price.points.map((point) => point.id)).not.toEqual(inventory.points.map((point) => point.id));
    expect(price.regions).toEqual([]);
    expect(inventory.regions).toEqual([]);
  });

  test("keeps every fallback defense observation individually selectable at a stable distinct coordinate", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "defense");
    const workspace = buildWorkspacePresentation(graph, view);
    const layer = workspace.layers.find((candidate) => candidate.id === "defense-capability-budget")!;
    const expectedIds = layer.content.kind === "observations" ? layer.content.observationIds : [];
    const japan = graph.entities.find((entity) => entity.id === "country:japan")!;

    const model = buildJapanMapCanvasModel(graph, view, expectedIds[0], layer, null);
    const repeatedModel = buildJapanMapCanvasModel(graph, view, expectedIds[0], layer, null);
    const coordinates = model.points.map((point) => `${point.lat}:${point.lon}`);

    expect(model.points.map((point) => point.id)).toEqual(expectedIds);
    expect(model.points.map((point) => point.selectionId)).toEqual(expectedIds);
    expect(new Set(coordinates).size).toBe(expectedIds.length);
    expect(repeatedModel.points.map((point) => `${point.lat}:${point.lon}`)).toEqual(coordinates);
    expect(model.points.every((point) => (
      Math.abs(point.lat - japan.coordinates!.lat) < 0.5
      && Math.abs(point.lon - japan.coordinates!.lon) < 0.5
    ))).toBe(true);
  });

  test("preserves the coordinates of an observation subject that already has map geometry", () => {
    const graph = loadSeedGraph();
    const view = getThemeView(graph, "water");
    const workspace = buildWorkspacePresentation(graph, view);
    const layer = workspace.layers.find((candidate) => candidate.id === "water-supply")!;
    const subject = graph.entities.find((entity) => entity.id === "port:yokohama")!;

    const model = buildJapanMapCanvasModel(
      graph,
      view,
      "observation:capital-lifeline-watch-2026",
      layer,
      null
    );

    expect(model.points).toHaveLength(1);
    expect(model.points[0]).toMatchObject({
      selectionId: "observation:capital-lifeline-watch-2026",
      lat: subject.coordinates?.lat,
      lon: subject.coordinates?.lon
    });
  });

  test("produces visible configured geometry for every runtime-available semantic layer", () => {
    const graph = loadSeedGraph();
    const now = new Date("2026-07-18T00:00:00Z");

    for (const themeId of THEME_IDS) {
      const view = getThemeView(graph, themeId);
      const live = buildLiveLogisticsView(themeId, null, loadSeedLiveLogistics(), now);
      const workspace = buildWorkspacePresentation(graph, view, live);
      const activeId = view.flows[0]?.id ?? view.observations[0]?.id ?? view.entities[0]?.id ?? "country:japan";

      for (const layer of workspace.layers.filter((candidate) => candidate.available)) {
        const model = buildJapanMapCanvasModel(graph, view, activeId, layer, live);
        expect(
          [...model.regions, ...(model.logisticsImpactRegions ?? [])].every(
            (region) => region.geometryKind === "prefecture-boundary"
              || region.geometryKind === "representative-radius"
          ),
          `${themeId}/${layer.id}/geometryKind`
        ).toBe(true);
        expect(
          visibleFeatureCount(layer.renderMode, model),
          `${themeId}/${layer.id}/${layer.renderMode}`
        ).toBeGreaterThan(0);
      }
    }
  });

  test("keeps bare rice mobile points and every valid legacy mode visible", () => {
    const graph = loadSeedGraph();
    const riceView = getThemeView(graph, "rice");
    const mobileModel = buildJapanMapCanvasModel(
      graph,
      riceView,
      "observation:rice-price-signal-2026",
      null,
      null
    );
    expect(mobileModel.points.length).toBeGreaterThan(0);

    const requestedModes = ["point", "cluster", "choropleth", "route", "static"] as const;
    const now = new Date("2026-07-18T00:00:00Z");

    for (const themeId of THEME_IDS) {
      const view = getThemeView(graph, themeId);
      const live = buildLiveLogisticsView(themeId, null, loadSeedLiveLogistics(), now);
      const workspace = buildWorkspacePresentation(graph, view, live);
      const activeId = view.flows[0]?.id ?? view.observations[0]?.id ?? view.entities[0]?.id ?? "country:japan";
      const legacyModel = buildJapanMapCanvasModel(graph, view, activeId, null, live);

      for (const requestedMode of requestedModes) {
        const { mapModeOverride } = resolveLegacyPresentation(themeId, requestedMode, workspace);
        expect(
          visibleFeatureCount(mapModeOverride, legacyModel),
          `${themeId}/${requestedMode}->${mapModeOverride}`
        ).toBeGreaterThan(0);
      }
    }
  });
});

function visibleFeatureCount(
  mode: "point" | "cluster" | "choropleth" | "route" | "static",
  model: ReturnType<typeof buildJapanMapCanvasModel>
) {
  const points = model.points.length
    + model.globalPoints.length
    + (model.livePoints?.length ?? 0)
    + (model.liveVessels?.length ?? 0);
  const routes = model.routes.length
    + model.globalRoutes.length
    + (model.liveRoutes?.length ?? 0)
    + (model.logisticsImpactRoutes?.length ?? 0)
    + (model.logisticsImpactCorridors?.length ?? 0);
  const regions = model.regions.length + (model.logisticsImpactRegions?.length ?? 0);

  if (mode === "cluster") {
    return points;
  }

  if (mode === "choropleth") {
    return regions;
  }

  if (mode === "route") {
    return points + routes;
  }

  return points + (mode === "static" ? regions : 0);
}

function liveLogisticsFixture(
  mapRoutes: LiveLogisticsViewModel["mapRoutes"]
): LiveLogisticsViewModel {
  return {
    disclosureLabel: "公開系統",
    items: [],
    lanes: [],
    mapRoutes,
    mapVessels: [],
    subtitle: "テスト",
    title: "テスト物流",
    updatedLabel: "更新済み"
  };
}
