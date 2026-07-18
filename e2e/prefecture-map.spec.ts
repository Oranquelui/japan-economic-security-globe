import { mkdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

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
  renderedFeatures: Array<{ entityId: string; layers: string[]; value: number | null }>;
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
      await expect.poll(async () => map.evaluate((element: any) => (
        element.__prefectureMapDiagnostics.read([]).renderedLabelIds.length
      ))).toBe(47);

      const exclusions = await readPermanentExclusions(page);
      const diagnostics = await map.evaluate((element: any, rectangles) => (
        element.__prefectureMapDiagnostics.read(rectangles)
      ), exclusions) as Diagnostics;

      expect(diagnostics.zoom).toBeCloseTo(5.3, 1);
      expect(new Set(diagnostics.renderedLabelIds).size).toBe(47);
      expect(diagnostics.renderedLabelIds).toHaveLength(47);
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
    await page.goto("/?theme=rice&layer=rice-harvest");
    const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
    await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);

    const initialUrl = page.url();
    const zoomIn = page.locator('button[aria-label="地図を拡大"]:visible');
    for (let index = 0; index < 4; index += 1) {
      await zoomIn.click();
    }
    await expect.poll(async () => map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([])
    )) as Promise<Diagnostics>, { timeout: 10_000 }).toMatchObject({
      renderedPolygonIds: [],
      zoom: expect.any(Number)
    });
    const detailed = await map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([])) as Diagnostics;
    expect(detailed.zoom).toBeGreaterThanOrEqual(9);
    expect(detailed.renderedPolygonIds).toEqual([]);
    await map.click({ position: { x: 720, y: 450 } });
    expect(page.url()).toBe(initialUrl);
    expect(network.unexpected).toEqual([]);
  });

  test("renders an acceptance-only missing value with the neutral polygon, border, and label", async ({ page }) => {
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?theme=rice&layer=rice-harvest");
    const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
    await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);

    await map.evaluate((element: any) => element.__prefectureMapDiagnostics.setPrefectureValueNull("prefecture:tokyo"));
    await expect.poll(async () => map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([]).renderedFeatures
    )) as Promise<Diagnostics["renderedFeatures"]>).toEqual(expect.arrayContaining([
      expect.objectContaining({
        entityId: "prefecture:tokyo",
        layers: expect.arrayContaining(["jp-prefecture-fill", "jp-prefecture-outline", "jp-prefecture-label"]),
        value: null
      })
    ]));
    expect(network.unexpected).toEqual([]);
  });
});

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
