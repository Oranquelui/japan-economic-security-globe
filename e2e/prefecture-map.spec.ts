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
  renderedRepresentativeRegionIds: string[];
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
    test(`renders in-region labels without forcing collisions at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
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

      // Overview fits the available map area, so zoom varies with the viewport.
      expect(diagnostics.zoom).toBeGreaterThan(3);
      expect(diagnostics.zoom).toBeLessThanOrEqual(5.2);
      expect(new Set(diagnostics.renderedLabelIds).size).toBe(diagnostics.renderedLabelIds.length);
      expect(diagnostics.renderedLabelIds).toContain("prefecture:hokkaido");
      expect(diagnostics.renderedLabelIds.length).toBeGreaterThan(10);
      expect(diagnostics.renderedLabelIds.every(id => diagnostics.renderedPolygonIds.includes(id))).toBe(true);
      expect(diagnostics.renderedLabelIds.length).toBeLessThanOrEqual(47);
      expect(new Set(diagnostics.renderedPolygonIds).size).toBe(47);
      expect(diagnostics.renderedPolygonIds).toHaveLength(47);
      expect(diagnostics.renderedRepresentativeRegionIds).toEqual([]);
      expect(diagnostics.tilesLoaded).toBe(true);
      expect(diagnostics.collisionReport.overlaps).toEqual([]);
      expect(diagnostics.collisionReport.clipped).toEqual([]);
      // Crowded labels are revealed by zooming instead of being displaced into the sea.
      expect(network.unexpected).toEqual([]);

      await page.screenshot({ path: testInfo.outputPath(`prefecture-labels-${viewport.width}x${viewport.height}.png`) });
      await writeOptionalEvidenceScreenshot(page, testInfo, `prefecture-choropleth-default-${viewport.width}x${viewport.height}.png`);
    });
  }

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 390, height: 844 }
  ] as const) {
    test(`keeps the shared prefecture boundary choropleth below xl at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      const network = await installLocalNetworkGuard(page);
      await page.setViewportSize(viewport);
      await page.goto("/?theme=rice&layer=rice-harvest");

      const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
      await expect(map).toHaveCount(1);
      await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);
      await expect.poll(async () => map.evaluate((element: any) => {
        const diagnostics = element.__prefectureMapDiagnostics.read([]);
        return {
          hasPolygons: diagnostics.renderedPolygonIds.length > 0,
          representativeCount: diagnostics.renderedRepresentativeRegionIds.length,
          tilesLoaded: diagnostics.tilesLoaded
        };
      }), { timeout: 10_000 }).toEqual({
        hasPolygons: true,
        representativeCount: 0,
        tilesLoaded: true
      });

      const diagnostics = await map.evaluate((element: any) => (
        element.__prefectureMapDiagnostics.read([])
      )) as Diagnostics;
      expect(diagnostics.renderedPolygonIds.length).toBeGreaterThan(0);
      expect(diagnostics.renderedRepresentativeRegionIds).toEqual([]);
      expect(diagnostics.renderedLabelIds).toEqual([]);
      expect(network.unexpected).toEqual([]);

      await writeOptionalEvidenceScreenshot(
        page,
        testInfo,
        `prefecture-choropleth-regression-${viewport.width}x${viewport.height}.png`
      );
    });
  }

  test("removes polygons at detailed zoom and keeps clicks from changing selection", async ({ page }) => {
    test.setTimeout(60_000);
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?theme=rice&layer=rice-harvest&selected=prefecture%3Atokyo");
    const map = page.locator('[data-testid="jp-operations-map-canvas"]:visible');
    await expect.poll(async () => map.evaluate((element: any) => Boolean(element.__prefectureMapDiagnostics))).toBe(true);
    await waitForOverviewReadiness(map);

    const initialUrl = page.url();
    const overview = await map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([])) as Diagnostics;
    expect(overview.zoom).toBeGreaterThan(3);
    expect(overview.zoom).toBeLessThanOrEqual(5.2);
    expect(overview.renderedLabelIds).toContain("prefecture:tokyo");
    expect(page.url()).toBe(initialUrl);

    await panLabelToMapCenter(page, map, "prefecture:tokyo");
    const zoomIn = page.locator('button[aria-label="地図を拡大"]:visible');
    const zoomSteps = Math.ceil(9 - overview.zoom);
    for (let index = 0; index < zoomSteps; index += 1) {
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
    expect(detailed.zoom).toBeCloseTo(overview.zoom + zoomSteps, 1);
    expect(detailed.zoom).toBeGreaterThanOrEqual(9);
    expect(detailed.renderedLabelIds).toEqual(["prefecture:tokyo"]);
    expect(detailed.renderedPolygonIds).toEqual([]);
    expect(detailed.tilesLoaded).toBe(true);
    await map.click();
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

    // Use an isolated, visible label; crowded names may legitimately be hidden.
    await map.evaluate((element: any) => element.__prefectureMapDiagnostics.setPrefectureValueNull("prefecture:hokkaido"));
    await expect.poll(async () => map.evaluate((element: any) => (
      element.__prefectureMapDiagnostics.read([])
    )) as Promise<Diagnostics>).toMatchObject({
      renderedFeatures: expect.arrayContaining([
        expect.objectContaining({
          entityId: "prefecture:hokkaido",
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
    expect(renderedFeatures.some((feature) => feature.entityId !== "prefecture:hokkaido"
      && feature.hasData
      && typeof feature.value === "number")).toBe(true);
    expect(network.unexpected).toEqual([]);

    const noticeClose = page.getByRole("button", { name: "お知らせを閉じる" });
    if (await noticeClose.count()) {
      await noticeClose.click();
      await expect(noticeClose).toHaveCount(0);
    }

    await page.screenshot({ path: testInfo.outputPath("prefecture-choropleth-missing-value.png") });
    await writeOptionalEvidenceScreenshot(page, testInfo, "prefecture-choropleth-missing-value.png");
  });

  test("shows the Natural Earth artifact version and processing date on the source license page", async ({ page }, testInfo) => {
    const network = await installLocalNetworkGuard(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sources-license");

    const sourceLink = page.getByRole("link", {
      name: "地図形状: Natural Earth Admin 1（一般化・加工）"
    });
    await sourceLink.scrollIntoViewIfNeeded();
    const sourceCard = sourceLink.locator("xpath=ancestor::article");
    await expect(sourceCard).toContainText("加工成果物版");
    await expect(sourceCard).toContainText("natural-earth-5.1.1-japan-prefectures-v2");
    await expect(sourceCard).toContainText("加工日");
    await expect(sourceCard).toContainText("2026-07-18");
    expect(network.unexpected).toEqual([]);

    await writeOptionalEvidenceScreenshot(
      page,
      testInfo,
      "prefecture-choropleth-sources-license.png"
    );
  });
});

async function waitForOverviewReadiness(map: Locator) {
  await expect.poll(async () => map.evaluate((element: any) => {
    const diagnostics = element.__prefectureMapDiagnostics.read([]);
    return {
      hasRenderedLabels: diagnostics.renderedLabelIds.length > 0,
      renderedPolygonCount: diagnostics.renderedPolygonIds.length,
      tilesLoaded: diagnostics.tilesLoaded
    };
  }), { timeout: 10_000 }).toEqual({
    hasRenderedLabels: true,
    renderedPolygonCount: 47,
    tilesLoaded: true
  });
}

async function panLabelToMapCenter(
  page: Page,
  map: Locator,
  entityId: string
) {
  const rect = await map.boundingBox();
  expect(rect).not.toBeNull();
  const diagnostics = await map.evaluate((element: any) => element.__prefectureMapDiagnostics.read([])) as Diagnostics;
  const label = diagnostics.collisionReport.boxes.find(box => box.entityId === entityId);
  expect(label).toBeDefined();
  const start = {
    x: (label!.left + label!.right) / 2,
    y: (label!.top + label!.bottom) / 2
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
