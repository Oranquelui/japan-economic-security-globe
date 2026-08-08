import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1680, height: 900 }
] as const;

const LOGISTICS_PATH = "/?theme=logistics&layer=logistics-domestic";
const ROAD_ROUTE_ID = "live-logistics:road-keihin-tokyo";
const CONGESTION_ID = "road-condition:demo-daikoku-ukishima-congestion";
const CONSTRUCTION_ID = "road-restriction:demo-ukishima-oi-construction";
const PLANNED_ID = "road-restriction:demo-oi-tatsumi-lane";
const ANCHOR_LABELS = [
  "横浜港・本牧ふ頭",
  "本牧JCT",
  "大黒JCT",
  "川崎浮島JCT",
  "大井JCT",
  "辰巳JCT",
  "東京湾岸配送圏"
] as const;

type LogisticsDiagnostics = {
  attributions: string[];
  camera: {
    allDetailedRoadCoordinatesInBounds: boolean;
    center: [number, number];
    zoom: number;
  };
  junctions: Array<{
    id: string;
    label: string;
    screenPoint: [number, number];
    selectionId: string;
  }>;
  layers: Array<{
    filter?: unknown;
    id: string;
    layout?: Record<string, unknown>;
    paint?: Record<string, unknown>;
    source?: string;
    type: string;
  }>;
  logisticsRoutes: Array<{
    coordinates: Array<[number, number]>;
    id: string;
    label: string;
    laneId: string;
    modeLabel: string;
    selectionId: string;
  }>;
  roadOperations: Array<{
    dataPosture: string;
    freshness: string;
    id: string;
    lifecycle: string;
    selectionId: string;
    stateLabel: string;
    visualKind: string;
  }>;
  roadSegments: Array<{
    coordinates: Array<[number, number]>;
    direction: string;
    id: string;
    routeId: string;
    selected: boolean;
    selectionId: string;
  }>;
  tilesLoaded: boolean;
};

test.describe("logistics road conditions acceptance", () => {
  for (const viewport of VIEWPORTS) {
    test(`keeps the domestic logistics overview explicit and truthful at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      const network = await installLocalNetworkGuard(page);
      await openLogistics(page, viewport);

      const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
      const overview = page.locator('[data-testid="logistics-route-overview"]:visible');
      await expect(map).toHaveCount(1);
      await expect(overview).toHaveCount(1);
      await expect(page.locator('[data-testid="layout-context-inspector"]:visible')).toHaveCount(0);
      await expect(page.locator('[data-testid="road-condition-inspector"]:visible')).toHaveCount(0);
      await expect(overview.locator('button[aria-pressed="true"]')).toHaveCount(0);
      expect(new URL(page.url()).searchParams.has("selected")).toBe(false);

      await expect(overview).toContainText("5代表経路");
      await expect(overview).toContainText("4輸送モード");
      await expect(overview).toContainText("港湾前後 1補助");
      await expect(overview).toContainText("対象地域");
      await expect(overview).toContainText("首都圏 / 中京圏 / 関西圏 / 九州北部");
      await expect(overview).toContainText("公式道路交通フィード未接続");
      await expect(overview).toContainText("固定デモ");
      await expect(overview).toContainText("公的公開情報 / 遅延集約");
      await expect(overview).toContainText("現在情報ではありません");
      await expect(overview).toContainText("到着見込み: データなし");
      await expect(overview).toContainText("物流影響: データなし");

      const visibleWorkspaceText = await page.locator('[data-testid="layout-desktop-workspace"]:visible').innerText();
      expect(visibleWorkspaceText).not.toMatch(/今日|監視中|次回更新|\d+分前|SCAN/);

      await assertPermanentLayout(page, viewport);
      await assertJunctionAnchorSafeAreas(page);
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(`logistics-overview-${viewport.width}x${viewport.height}.png`)
      });
      expect(network.unexpected).toEqual([]);
    });
  }

  test("registers detailed route geometry, mode encodings, and the road-state matrix", async ({ page }) => {
    const network = await installLocalNetworkGuard(page);
    await openLogistics(page, VIEWPORTS[1]);
    const diagnostics = await readLogisticsDiagnostics(page);

    expect(diagnostics.tilesLoaded).toBe(true);
    expect(diagnostics.roadSegments).toHaveLength(6);
    expect(diagnostics.junctions.map((junction) => junction.label)).toEqual(ANCHOR_LABELS);
    expect(diagnostics.attributions).toContain("© OpenStreetMap contributors");
    expect(diagnostics.roadSegments.every((segment) => segment.direction === "東行き")).toBe(true);
    expect(diagnostics.roadSegments.every((segment) => segment.coordinates.length > 2)).toBe(true);
    expect(new Set(diagnostics.roadSegments.flatMap((segment) => segment.coordinates.map((coordinate) => coordinate.join(",")))).size)
      .toBeGreaterThan(7);

    const laneRoutes = groupBy(diagnostics.logisticsRoutes, (route) => route.laneId);
    // The representative road is intentionally supplied by the detailed segment source,
    // so the legacy endpoint chord is absent from the multimodal route source.
    expect([...laneRoutes.keys()].sort()).toEqual(["air", "coastal", "maritime", "rail"]);
    expect(laneRoutes.get("maritime")).toHaveLength(1);
    expect(diagnostics.logisticsRoutes.filter((route) => route.laneId !== "maritime")).toHaveLength(4);
    expect(new Set([
      ...diagnostics.logisticsRoutes.filter((route) => route.laneId !== "maritime").map((route) => route.selectionId),
      ...diagnostics.roadSegments.map((segment) => segment.routeId)
    ]).size).toBe(5);

    const roadLayer = layer(diagnostics, "live-logistics-road-line");
    const railLayer = layer(diagnostics, "live-logistics-rail-line");
    const coastalLayer = layer(diagnostics, "live-logistics-coastal-line");
    const airLayer = layer(diagnostics, "live-logistics-air-line");
    const maritimeLayer = layer(diagnostics, "live-logistics-maritime-support-line");
    expect(roadLayer.filter).toEqual(["==", ["get", "laneId"], "road"]);
    expect(roadLayer.paint?.["line-dasharray"]).toBeUndefined();
    expect(railLayer.paint?.["line-dasharray"]).toEqual([1.5, 1]);
    expect(coastalLayer.paint?.["line-dasharray"]).toEqual([0.25, 1.25]);
    expect(airLayer.paint?.["line-dasharray"]).toEqual([4, 2]);
    expect(maritimeLayer.filter).toEqual(["==", ["get", "laneId"], "maritime"]);
    expect(new Set([railLayer, coastalLayer, airLayer].map((entry) => JSON.stringify(entry.paint?.["line-dasharray"]))).size).toBe(3);

    const expectedModeLabels = [
      ["road", "◆", "道路"],
      ["rail", "╫", "鉄道"],
      ["coastal", "≈", "内航"],
      ["air", "✈", "航空"],
      ["maritime-support", "≈", "海上輸送"]
    ] as const;
    for (const [mode, symbol, modeLabel] of expectedModeLabels) {
      const labelLayer = layer(diagnostics, `live-logistics-${mode}-label`);
      expect(JSON.stringify(labelLayer.layout?.["text-field"])).toContain(symbol);
      expect(JSON.stringify(labelLayer.layout?.["text-field"])).toContain("modeLabel");
      expect(
        mode === "road"
          ? diagnostics.roadSegments.some((segment) => segment.routeId === ROAD_ROUTE_ID)
          : diagnostics.logisticsRoutes.some((route) => (
              route.modeLabel === modeLabel
              || (mode === "maritime-support" && route.laneId === "maritime")
            ))
      ).toBe(true);
    }

    for (const visualKind of ["normal", "slow", "congestion", "accident", "construction", "lane-restriction", "closure", "unknown"]) {
      expect(layer(diagnostics, `logistics-road-operation-${visualKind}`).filter)
        .toEqual(["==", ["get", "visualKind"], visualKind]);
    }
    expect(layer(diagnostics, "logistics-road-operation-planned-outline").filter)
      .toEqual(["==", ["get", "lifecycle"], "planned"]);
    const opacityExpression = JSON.stringify(layer(diagnostics, "logistics-road-operation-label").paint?.["text-opacity"]);
    expect(opacityExpression).toContain("ended");
    expect(opacityExpression).toContain("stale");
    const symbolExpression = JSON.stringify(layer(diagnostics, "logistics-road-operation-symbol").layout?.["text-field"]);
    expect(symbolExpression).toContain("!");
    expect(symbolExpression).toContain("◆");
    expect(symbolExpression).toContain("|");
    expect(symbolExpression).toContain("×");

    const operations = new Map(diagnostics.roadOperations.map((operation) => [operation.id, operation]));
    expect(operations.get(CONGESTION_ID)).toMatchObject({
      dataPosture: "fixed-demo",
      freshness: "stale",
      visualKind: "congestion"
    });
    expect(operations.get(CONSTRUCTION_ID)).toMatchObject({
      dataPosture: "fixed-demo",
      freshness: "stale",
      visualKind: "construction"
    });
    expect(operations.get(PLANNED_ID)).toMatchObject({
      dataPosture: "fixed-demo",
      freshness: "stale",
      lifecycle: "planned",
      visualKind: "lane-restriction"
    });
    expect(diagnostics.roadOperations.some((operation) => operation.freshness === "unavailable" && operation.visualKind === "unknown"))
      .toBe(true);
    expect(network.unexpected).toEqual([]);
  });

  test("opens route and event inspectors with exact URL selection and route-wide focus", async ({ page }, testInfo) => {
    const network = await installLocalNetworkGuard(page);
    await openLogistics(page, VIEWPORTS[1]);
    const overview = page.locator('[data-testid="logistics-route-overview"]:visible');

    const roadRoute = overview.getByRole("button", { name: /道路 代表経路/ }).first();
    await roadRoute.click();
    await expectSelected(page, ROAD_ROUTE_ID);
    const inspector = page.locator('[data-testid="road-condition-inspector"]:visible');
    await expect(inspector).toHaveCount(1);
    await expect(inspector).toContainText("横浜港・本牧ふ頭 → 東京湾岸配送圏");
    await expect(inspector).toContainText("高速湾岸線 B");
    await expect(inspector).toContainText("東行き");
    await expect(inspector).toContainText("公式道路交通フィード未接続 / 利用不可");
    await expect(inspector).toContainText("© OpenStreetMap contributors");
    await expect(inspector).toContainText("固定デモ");
    await expect(inspector).toContainText("現在情報ではありません");
    await expect(inspector).toContainText("到着見込み:  データなし");
    await expect(inspector).toContainText("物流影響:  データなし");
    await expect(page.locator('[aria-label="選択中の詳細と根拠"]:visible')).toHaveCount(0);

    await expect.poll(async () => (await readLogisticsDiagnostics(page)).camera.allDetailedRoadCoordinatesInBounds).toBe(true);
    await expect.poll(async () => (await readLogisticsDiagnostics(page)).roadSegments.every((segment) => segment.selected)).toBe(true);

    await inspector.getByRole("button", { name: "道路状況の詳細を閉じる" }).click();
    await expect(inspector).toHaveCount(0);
    await expectSelected(page, ROAD_ROUTE_ID);
    await roadRoute.click();
    await expect(inspector).toHaveCount(1);

    await assertEventSelection(page, overview, /道路 渋滞例/, CONGESTION_ID, ["渋滞例", "期限切れ", "2026-06-03T09:00:00+09:00"]);
    await assertEventSelection(page, overview, /道路 工事例/, CONSTRUCTION_ID, ["工事例", "期限切れ", "2026-06-03T09:00:00+09:00"]);
    await assertEventSelection(page, overview, /道路 車線規制例/, PLANNED_ID, ["車線規制例", "予定", "期限切れ", "2026-06-03T09:00:00+09:00"]);

    await assertPermanentLayout(page, VIEWPORTS[1]);
    await page.screenshot({
      fullPage: false,
      path: testInfo.outputPath("logistics-planned-road-inspector-1680x900.png")
    });
    expect(network.unexpected).toEqual([]);
  });

  test("keeps the Niigata default free from logistics road UI", async ({ page }) => {
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize(VIEWPORTS[1]);
    await page.goto("/?selected=prefecture%3Aniigata");
    await closeInitialNotice(page);

    await expect(page.locator('[data-testid="jp-operations-map-canvas"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-testid="logistics-route-overview"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-testid="road-condition-inspector"]:visible')).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get("selected")).toBe("prefecture:niigata");
    expect(new URL(page.url()).searchParams.get("theme")).not.toBe("logistics");
    expect(network.unexpected).toEqual([]);
  });
});

async function openLogistics(page: Page, viewport: Readonly<{ height: number; width: number }>) {
  await page.setViewportSize(viewport);
  await page.goto(LOGISTICS_PATH);
  await closeInitialNotice(page);
  const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
  await expect(map).toHaveCount(1);
  await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics?.readLogistics))).toBe(true);
  await expect.poll(async () => (await readLogisticsDiagnostics(page)).tilesLoaded).toBe(true);
}

async function closeInitialNotice(page: Page) {
  const close = page.getByRole("button", { name: "お知らせを閉じる" });
  if (await close.count()) {
    await close.click();
    await expect(close).toHaveCount(0);
  }
}

async function readLogisticsDiagnostics(page: Page): Promise<LogisticsDiagnostics> {
  return page.locator('[data-testid="jp-operations-map-canvas"]:visible').evaluate((element: any) => (
    element.__prefectureMapDiagnostics.readLogistics()
  ));
}

function layer(diagnostics: LogisticsDiagnostics, id: string) {
  const result = diagnostics.layers.find((candidate) => candidate.id === id);
  expect(result, id).toBeTruthy();
  return result!;
}

async function expectSelected(page: Page, expected: string) {
  await expect.poll(() => new URL(page.url()).searchParams.get("selected")).toBe(expected);
}

async function assertEventSelection(
  page: Page,
  overview: Locator,
  name: RegExp,
  expectedId: string,
  expectedText: string[]
) {
  await overview.getByRole("button", { name }).click();
  await expectSelected(page, expectedId);
  const inspector = page.locator('[data-testid="road-condition-inspector"]:visible');
  await expect(inspector).toHaveCount(1);
  for (const text of expectedText) await expect(inspector).toContainText(text);
  await expect(page.locator('[aria-label="選択中の詳細と根拠"]:visible')).toHaveCount(0);
}

async function assertPermanentLayout(page: Page, viewport: Readonly<{ height: number; width: number }>) {
  const leftPane = await requiredBox(page.locator('[data-testid="layout-command-pane"]:visible'));
  const map = await requiredBox(page.locator('[data-testid="layout-map-section"]:visible'));
  const zoomControl = await requiredBox(page.getByRole("button", { name: "地図を拡大" }));
  const attribution = await requiredBox(page.locator('.maplibregl-ctrl-attrib:visible'));
  const inspectorLocator = page.locator('[data-testid="layout-context-inspector"]:visible');
  const inspector = await inspectorLocator.count() ? await requiredBox(inspectorLocator) : null;

  for (const box of [leftPane, map, zoomControl, attribution, inspector].filter(Boolean)) {
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  }
  expect(zoomControl.x).toBeGreaterThanOrEqual(leftPane.x + leftPane.width + 16);
  expect(attribution.x).toBeGreaterThanOrEqual(leftPane.x + leftPane.width + 16);
  if (inspector) {
    expect(zoomControl.x + zoomControl.width).toBeLessThanOrEqual(inspector.x - 24);
    expect(attribution.x + attribution.width).toBeLessThanOrEqual(inspector.x - 24);
  }
}

async function assertJunctionAnchorSafeAreas(page: Page) {
  const diagnostics = await readLogisticsDiagnostics(page);
  const map = await requiredBox(page.locator('[data-testid="layout-map-section"]:visible'));
  const leftPane = await requiredBox(page.locator('[data-testid="layout-command-pane"]:visible'));

  // MapLibre glyph boxes are not stable browser APIs. This checks the actual projected
  // anchor of every required JCT label with a 24px map safe area; the screenshots retain
  // the visual glyph-level evidence for review.
  expect(diagnostics.junctions.map((junction) => junction.label)).toEqual(ANCHOR_LABELS);
  for (const junction of diagnostics.junctions) {
    expect(junction.screenPoint[0], junction.label).toBeGreaterThanOrEqual(leftPane.width + 24);
    expect(junction.screenPoint[0], junction.label).toBeLessThanOrEqual(map.width - 24);
    expect(junction.screenPoint[1], junction.label).toBeGreaterThanOrEqual(24);
    expect(junction.screenPoint[1], junction.label).toBeLessThanOrEqual(map.height - 24);
  }
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) grouped.set(getKey(item), [...(grouped.get(getKey(item)) ?? []), item]);
  return grouped;
}

async function installLocalNetworkGuard(page: Page) {
  const unexpected: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      await route.continue();
      return;
    }
    if (url.hostname === "fonts.googleapis.com") {
      await route.fulfill({ body: "", contentType: "text/css", status: 200 });
      return;
    }
    if (url.hostname === "fonts.gstatic.com" || url.hostname === "demotiles.maplibre.org") {
      await route.fulfill({ body: "", contentType: "application/octet-stream", status: 200 });
      return;
    }
    unexpected.push(url.href);
    await route.abort("blockedbyclient");
  });
  return { unexpected };
}
