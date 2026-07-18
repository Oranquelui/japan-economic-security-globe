import { mkdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1680, height: 900 }
] as const;

type ExclusionRect = { bottom: number; left: number; right: number; top: number };
type Diagnostics = {
  collisionReport: {
    boxes: Array<ExclusionRect & { entityId: string }>;
    clipped: string[];
    overlaps: Array<{ first: string; second: string }>;
  };
  renderedLabelIds: string[];
  renderedPolygonIds: string[];
  renderedFeatures: Array<{
    entityId: string;
    hasData: boolean;
    layers: string[];
    value: number | null;
  }>;
  tilesLoaded: boolean;
  zoom: number;
};

test.describe("prefecture map acceptance", () => {
  for (const viewport of VIEWPORTS) {
    test(`renders every curated label without collisions at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      const network = await installLocalNetworkGuard(page);
      await page.setViewportSize(viewport);
      await page.goto("/?theme=rice&layer=rice-harvest");

      const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
      await expect(map).toHaveCount(1);
      await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);
      await waitForOverviewReadiness(map);

      const exclusions = await readPermanentExclusions(page);
      const diagnostics = await map.evaluate((element: any, rectangles) => (
        element.__prefectureMapDiagnostics.read(rectangles)
      ), exclusions) as Diagnostics;

      expect(diagnostics.zoom).toBeCloseTo(5.3, 1);
      expect(new Set(diagnostics.renderedLabelIds).size).toBe(47);
      expect(diagnostics.renderedLabelIds).toHaveLength(47);
      expect(diagnostics.tilesLoaded).toBe(true);
      expect(diagnostics.collisionReport.overlaps).toEqual([]);
      expect(diagnostics.collisionReport.clipped).toEqual([]);
      expectBoxesInsideMapAndOutsideExclusions(diagnostics.collisionReport.boxes, await map.boundingBox(), exclusions);
      expect(network.unexpected).toEqual([]);

      await page.screenshot({ path: testInfo.outputPath(`prefecture-labels-${viewport.width}x${viewport.height}.png`) });
      await writeOptionalEvidenceScreenshot(page, testInfo, `prefecture-labels-${viewport.width}x${viewport.height}.png`);
    });
  }

  test("removes polygons at detailed zoom and keeps clicks from changing selection", async ({ page }) => {
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?theme=rice&layer=rice-harvest&selected=prefecture%3Atokyo");
    const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
    await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);
    await waitForOverviewReadiness(map);

    const initialUrl = page.url();
    const overview = await map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([])) as Diagnostics;
    expect(overview.zoom).toBeCloseTo(5.3, 1);
    expect(overview.renderedLabelIds).toHaveLength(47);
    expect(page.url()).toBe(initialUrl);

    await panInitialCoordinateToMapCenter(page, map, {
      latitude: 35.69,
      longitude: 139.69,
      zoom: overview.zoom
    });
    const zoomIn = page.locator('button[aria-label="地図を拡大"]:visible');
    for (let index = 0; index < 4; index += 1) {
      await zoomIn.click();
      await expect.poll(async () => (
        map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([]).zoom)
      )).toBeGreaterThan(overview.zoom + index + 0.8);
    }
    await expect.poll(async () => map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([])
    )) as Promise<Diagnostics>, { timeout: 10_000 }).toMatchObject({
      renderedLabelIds: ["prefecture:tokyo"],
      renderedPolygonIds: [],
      tilesLoaded: true,
      zoom: expect.any(Number)
    });
    const detailed = await map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([])) as Diagnostics;
    expect(detailed.zoom).toBeCloseTo(9.3, 1);
    expect(detailed.renderedLabelIds).toEqual(["prefecture:tokyo"]);
    expect(detailed.renderedPolygonIds).toEqual([]);
    expect(detailed.tilesLoaded).toBe(true);
    await map.click({ position: { x: 720, y: 450 } });
    expect(page.url()).toBe(initialUrl);
    expect(network.unexpected).toEqual([]);
  });

  test("missing-value evidence renders an acceptance-only missing value with the neutral polygon, border, and label", async ({ page }, testInfo) => {
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?theme=rice&layer=rice-harvest");
    const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
    await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);
    await waitForOverviewReadiness(map);

    await map.evaluate((element: any) => element.__prefectureMapDiagnostics.setPrefectureValueNull("prefecture:tokyo"));
    await expect.poll(async () => map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([])
    )) as Promise<Diagnostics>).toMatchObject({
      renderedFeatures: expect.arrayContaining([
        expect.objectContaining({
          entityId: "prefecture:tokyo",
          hasData: false,
          layers: expect.arrayContaining(["jp-prefecture-fill", "jp-prefecture-outline", "jp-prefecture-label"]),
          value: null
        })
      ]),
      tilesLoaded: true
    });
    const renderedFeatures = await map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([]).renderedFeatures
    )) as Diagnostics["renderedFeatures"];
    expect(renderedFeatures.some((feature) => feature.entityId !== "prefecture:tokyo"
      && feature.hasData
      && typeof feature.value === "number")).toBe(true);
    expect(network.unexpected).toEqual([]);

    await page.screenshot({ path: testInfo.outputPath("prefecture-choropleth-missing-value.png") });
    await writeOptionalEvidenceScreenshot(page, testInfo, "prefecture-choropleth-missing-value.png");
  });
});

async function waitForOverviewReadiness(map: Locator) {
  await expect.poll(async () => map.evaluate((element: any) => {
    const diagnostics = element.__prefectureMapDiagnostics.read([]);
    return {
      renderedLabelCount: diagnostics.renderedLabelIds.length,
      tilesLoaded: diagnostics.tilesLoaded
    };
  }), { timeout: 10_000 }).toEqual({ renderedLabelCount: 47, tilesLoaded: true });
}

async function panInitialCoordinateToMapCenter(
  page: Page,
  map: Locator,
  target: Readonly<{ latitude: number; longitude: number; zoom: number }>
) {
  const rect = await map.boundingBox();
  expect(rect).not.toBeNull();
  const worldSize = 512 * (2 ** target.zoom);
  const start = {
    x: rect!.x + rect!.width / 2 + (target.longitude - 138.45) / 360 * worldSize,
    y: rect!.y + rect!.height / 2 + (mercatorY(target.latitude) - mercatorY(36.25)) * worldSize
  };
  const center = {
    x: rect!.x + rect!.width / 2,
    y: rect!.y + rect!.height / 2
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(center.x, center.y, { steps: 12 });
  await page.mouse.up();
}

function mercatorY(latitude: number) {
  const radians = latitude * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
}

async function installLocalNetworkGuard(page: Page) {
  const knownPresentation: string[] = [];
  const unexpected: string[] = [];

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      await route.continue();
      return;
    }
    if (url.hostname === "fonts.googleapis.com") {
      knownPresentation.push(url.href);
      await route.fulfill({ body: "", contentType: "text/css", status: 200 });
      return;
    }
    if (url.hostname === "fonts.gstatic.com") {
      knownPresentation.push(url.href);
      await route.fulfill({ body: "", contentType: "application/octet-stream", status: 200 });
      return;
    }
    unexpected.push(url.href);
    await route.abort("blockedbyclient");
  });

  return { knownPresentation, unexpected };
}

async function readPermanentExclusions(page: Page): Promise<ExclusionRect[]> {
  return page.locator([
    '[data-testid="scope-context-panel"]:visible',
    '[aria-label="選択中の詳細と根拠"]:visible'
  ].join(",")).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
  }));
}

function expectBoxesInsideMapAndOutsideExclusions(
  boxes: Diagnostics["collisionReport"]["boxes"],
  mapBoundingBox: { height: number; width: number; x: number; y: number } | null,
  exclusions: ExclusionRect[]
) {
  expect(mapBoundingBox).not.toBeNull();
  const mapRect = mapBoundingBox && {
    left: mapBoundingBox.x,
    right: mapBoundingBox.x + mapBoundingBox.width,
    top: mapBoundingBox.y,
    bottom: mapBoundingBox.y + mapBoundingBox.height
  };
  for (const box of boxes) {
    expect(box.left, box.entityId).toBeGreaterThanOrEqual(mapRect!.left);
    expect(box.right, box.entityId).toBeLessThanOrEqual(mapRect!.right);
    expect(box.top, box.entityId).toBeGreaterThanOrEqual(mapRect!.top);
    expect(box.bottom, box.entityId).toBeLessThanOrEqual(mapRect!.bottom);
    for (const exclusion of exclusions) {
      const overlaps = box.left < exclusion.right && box.right > exclusion.left
        && box.top < exclusion.bottom && box.bottom > exclusion.top;
      expect(overlaps, `${box.entityId} overlaps a permanent map exclusion`).toBe(false);
    }
  }
}

async function writeOptionalEvidenceScreenshot(page: Page, testInfo: TestInfo, fileName: string) {
  const configured = process.env.PREFECTURE_EVIDENCE_DIR;
  if (!configured) {
    return;
  }

  const repository = resolve(process.cwd());
  const targetDirectory = resolve(repository, configured);
  const pathFromRepository = relative(repository, targetDirectory);
  if (isAbsolute(pathFromRepository) || pathFromRepository === ".." || pathFromRepository.startsWith(`..${sep}`)) {
    throw new Error("PREFECTURE_EVIDENCE_DIR must resolve beneath the repository root");
  }
  await mkdir(targetDirectory, { recursive: true });
  await page.screenshot({ path: resolve(targetDirectory, fileName) });
}
