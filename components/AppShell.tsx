"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { HomepageMode } from "../lib/config/homepage-mode";
import type { LiveLogisticsEvent } from "../types/logistics";
import type { MapPopupAnchor, ThemeView } from "../types/presentation";
import type { RankingSignal } from "../types/ranking";
import { THEME_IDS, type SemanticGraph, type ThemeId } from "../types/semantic";
import { buildRankingDecision } from "../lib/ranking/decision";
import { getDetailView } from "../lib/semantic/detail";
import { buildEvidenceGraph } from "../lib/semantic/view-models";
import { buildJapanMapCanvasModel } from "../lib/presentation/map-canvas";
import { buildLiveLogisticsDetail } from "../lib/presentation/live-logistics-detail";
import { buildLiveLogisticsView } from "../lib/presentation/live-logistics";
import { getThemeView } from "../lib/semantic/selectors";
import { buildOperationRows, filterOperationRows, type OperationMapMode } from "../lib/presentation/operations";
import { getStatusPalette, getThemePalette } from "../lib/presentation/palette";
import {
  applyRankingToOperationRows,
  buildHomepageLeadSelection,
  buildPresetRailThemeOrder,
  buildSelectedRankingExplanation
} from "../lib/presentation/ranking";
import { buildWatchboardBriefing } from "../lib/presentation/watchboard";
import { buildWatchOverlayItems } from "../lib/presentation/watch-overlays";
import {
  DEFAULT_OPERATIONS_URL_STATE,
  serializeOperationsUrlState,
  type OperationsUrlState
} from "../lib/presentation/url-state";
import { getThemeLabel, localizeAnyLabel, localizeKind } from "../lib/presentation/japanese";
import { getRouteStatus } from "../lib/presentation/route-status";
import {
  buildWorkspacePresentation,
  getDefaultLayerDefinition,
  getLayerDefinition,
  resolveLegacyPresentation
} from "../lib/presentation/workspace";
import { summarizeSourceStatus } from "../lib/official/source-freshness";
import { ActionBar } from "./ActionBar";
import { EvidencePanel } from "./EvidencePanel";
import { InitialNoticeModal } from "./InitialNoticeModal";
import { JapanMainMap } from "./JapanMainMap";
import { LogisticsImpactBoard } from "./LogisticsImpactBoard";
import { MapInboxPanel } from "./MapInboxPanel";
import { NavigationRail } from "./NavigationRail";
import { OperationsSignalTable } from "./OperationsSignalTable";
import { SourceStatusBar } from "./SourceStatusBar";
import { WatchboardBriefing } from "./WatchboardBriefing";

interface AppShellProps {
  graph: SemanticGraph;
  hasExplicitUrlState?: boolean;
  homepageMode?: HomepageMode;
  initialUrlState?: OperationsUrlState;
  locale?: string;
  liveLogisticsEvents?: LiveLogisticsEvent[];
  rankingSignals?: RankingSignal[];
}

export function AppShell({
  graph,
  hasExplicitUrlState = false,
  homepageMode = "default",
  initialUrlState = DEFAULT_OPERATIONS_URL_STATE,
  locale = "ja",
  liveLogisticsEvents = [],
  rankingSignals = []
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rankingNowRef = useRef(new Date().toISOString());
  const homepageDecision = rankingSignals.length
    ? buildRankingDecision({
        surfaceId: "homepage",
        signals: rankingSignals,
        now: rankingNowRef.current
      })
    : null;
  const homepageLead = !hasExplicitUrlState && homepageDecision
    ? buildHomepageLeadSelection(graph, rankingSignals, homepageDecision)
    : null;
  const homepageThemeChanged = Boolean(homepageLead && homepageLead.themeId !== initialUrlState.themeId);
  const resolvedInitialThemeId = homepageLead?.themeId ?? initialUrlState.themeId;
  const resolvedInitialSelectedId = initialUrlState.selectedId
    ?? (homepageThemeChanged ? homepageLead?.selectedId ?? null : null);
  const initialView = getThemeView(graph, resolvedInitialThemeId);
  const initialLiveLogistics = buildLiveLogisticsView(
    resolvedInitialThemeId,
    resolvedInitialSelectedId,
    liveLogisticsEvents,
    new Date(rankingNowRef.current)
  );
  const initialWorkspace = buildWorkspacePresentation(graph, initialView, initialLiveLogistics);
  const requestedInitialLayer = getLayerDefinition(
    resolvedInitialThemeId,
    initialUrlState.layerId,
    initialWorkspace
  );
  const initialPresentation = homepageThemeChanged
    ? {
        layer: getDefaultLayerDefinition(resolvedInitialThemeId, initialWorkspace),
        mapModeOverride: null
      }
    : initialUrlState.mapModeOverride
      ? resolveLegacyPresentation(
          resolvedInitialThemeId,
          initialUrlState.mapModeOverride,
          initialWorkspace
        )
      : {
          layer: requestedInitialLayer?.available
            ? requestedInitialLayer
            : getDefaultLayerDefinition(resolvedInitialThemeId, initialWorkspace),
          mapModeOverride: null
        };
  const resolvedInitialState: OperationsUrlState = {
    themeId: resolvedInitialThemeId,
    selectedId: resolvedInitialSelectedId,
    layerId: initialPresentation.layer.id,
    mapModeOverride: initialPresentation.mapModeOverride,
    workspaceView: homepageThemeChanged ? "map" : initialUrlState.workspaceView
  };
  const [themeId, setThemeId] = useState<ThemeId>(resolvedInitialState.themeId);
  const [selectedId, setSelectedId] = useState<string | null>(resolvedInitialState.selectedId);
  const [mapPopupAnchor, setMapPopupAnchor] = useState<MapPopupAnchor | null>(null);
  const [layerId, setLayerId] = useState(resolvedInitialState.layerId);
  const [mapModeOverride, setMapModeOverride] = useState<OperationMapMode | null>(
    resolvedInitialState.mapModeOverride
  );
  const [workspaceView, setWorkspaceView] = useState(resolvedInitialState.workspaceView);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInboxOpen, setInboxOpen] = useState(true);
  const [isCompareOpen, setCompareOpen] = useState(resolvedInitialState.workspaceView === "comparison");
  // Open evidence only when the URL explicitly pins a selection — not for homepage auto-lead.
  const [isEvidenceOpen, setEvidenceOpen] = useState(
    Boolean(hasExplicitUrlState && resolvedInitialState.selectedId)
  );
  const [, startTransition] = useTransition();
  const initialSerializedRef = useRef(
    serializeOperationsUrlState(homepageThemeChanged ? resolvedInitialState : initialUrlState)
  );
  const view = getThemeView(graph, themeId);
  const sourceStatusSummary = summarizeSourceStatus(view.sources, new Date(rankingNowRef.current));
  const inboxDecision = rankingSignals.length
    ? buildRankingDecision({
        surfaceId: "inbox",
        signals: rankingSignals,
        now: rankingNowRef.current
      })
    : null;
  const presetRailDecision = rankingSignals.length
    ? buildRankingDecision({
        surfaceId: "preset-rail",
        signals: rankingSignals,
        now: rankingNowRef.current
      })
    : null;
  const operationRows = inboxDecision
    ? applyRankingToOperationRows(buildOperationRows(view), rankingSignals, inboxDecision)
    : buildOperationRows(view);
  const orderedThemeIds = presetRailDecision
    ? buildPresetRailThemeOrder(THEME_IDS, graph, rankingSignals, presetRailDecision)
    : THEME_IDS;
  const filteredOperationRows = filterOperationRows(operationRows, searchQuery);
  const preliminaryLiveLogistics = buildLiveLogisticsView(
    themeId,
    selectedId,
    liveLogisticsEvents,
    new Date(rankingNowRef.current)
  );
  const validSelectedId = resolveSelectableId(view, preliminaryLiveLogistics, selectedId);
  const activeId = resolveActiveId(view, preliminaryLiveLogistics, validSelectedId);
  const rankingExplanation = inboxDecision
    ? buildSelectedRankingExplanation(activeId, rankingSignals, inboxDecision, rankingNowRef.current)
    : null;
  const watchboardBriefing = homepageDecision
    ? buildWatchboardBriefing(graph, rankingSignals, homepageDecision, rankingNowRef.current, themeId)
    : null;
  const watchOverlays = buildWatchOverlayItems(themeId, activeId, new Date(rankingNowRef.current));
  const liveLogistics = buildLiveLogisticsView(themeId, activeId, liveLogisticsEvents, new Date(rankingNowRef.current));
  const workspace = buildWorkspacePresentation(graph, view, liveLogistics);
  const requestedLayer = getLayerDefinition(themeId, layerId, workspace);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : getDefaultLayerDefinition(themeId, workspace);
  const effectiveMapModeOverride = mapModeOverride === "choropleth" && activeLayer.renderMode !== "choropleth"
    ? "point"
    : mapModeOverride;
  const desktopMapMode = effectiveMapModeOverride ?? activeLayer.renderMode;
  const mobileMapMode = effectiveMapModeOverride ?? "point";
  const liveLogisticsDetailItem = liveLogistics?.items.find((item) => item.id === activeId) ?? null;
  const focusTargetId = validSelectedId;
  const detail = liveLogisticsDetailItem
    ? buildLiveLogisticsDetail(graph, liveLogisticsDetailItem)
    : getDetailView(graph, activeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const routeStatus = getRouteStatus(detail);
  const mapModel = buildJapanMapCanvasModel(graph, view, activeId, liveLogistics);
  const mapDisclosure =
    themeId === "regional-security"
      ? {
          title: "代表軌道",
          body: "公開情報 / 履歴・集約 / ライブ追跡ではありません"
        }
      : null;
  const mapDetailPopup = validSelectedId
    ? {
        detail,
        anchor: mapPopupAnchor,
        rankingExplanation: liveLogisticsDetailItem ? null : rankingExplanation,
        routeStatusLabel: routeStatus?.chipLabel ?? null,
        themeTitle: view.title
      }
    : null;
  const themePalette = getThemePalette(themeId);
  const statusPalette = getStatusPalette();
  const themeLabel = getThemeLabel(themeId).label;
  const serializedState = serializeOperationsUrlState({
    themeId,
    selectedId: validSelectedId,
    layerId: activeLayer.id,
    mapModeOverride: effectiveMapModeOverride,
    workspaceView
  });
  const sharePath = serializedState ? `${pathname}?${serializedState}` : pathname;
  const shellStyle = {
    background: themePalette.surfaceCanvas,
    "--ops-accent": themePalette.accent,
    "--ops-accent-soft": themePalette.accentSoft,
    "--ops-accent-text": themePalette.accentText,
    "--ops-surface-panel": themePalette.surfacePanel,
    "--ops-surface-elevated": themePalette.surfacePanelElevated,
    "--ops-border-subtle": themePalette.borderSubtle,
    "--ops-border-strong": themePalette.borderStrong,
    "--ops-text-primary": themePalette.textPrimary,
    "--ops-text-muted": themePalette.textMuted
  } as CSSProperties;
  const railWidth = 72;
  const paneWidth = 376;
  const evidenceExpandedWidth = 360;
  const evidenceCollapsedWidth = 56;
  const visiblePaneWidth = isInboxOpen ? paneWidth : 0;
  const evidenceWidth = isEvidenceOpen ? evidenceExpandedWidth : evidenceCollapsedWidth;
  const compareExpandedHeight = 264;
  const compareCollapsedHeight = 76;
  const compareHeight = isCompareOpen ? compareExpandedHeight : compareCollapsedHeight;
  const mapOverlayInsets = {
    top: 16,
    left: railWidth + visiblePaneWidth + 16,
    right: evidenceWidth + 16,
    bottom: compareHeight + 16
  };

  useEffect(() => {
    if (layerId !== activeLayer.id) {
      setLayerId(activeLayer.id);
    }

    if (mapModeOverride !== effectiveMapModeOverride) {
      setMapModeOverride(effectiveMapModeOverride);
    }
  }, [activeLayer.id, effectiveMapModeOverride, layerId, mapModeOverride]);

  useEffect(() => {
    const serialized = serializeOperationsUrlState({
      themeId,
      selectedId: validSelectedId,
      layerId: activeLayer.id,
      mapModeOverride: effectiveMapModeOverride,
      workspaceView
    });

    if (serialized === initialSerializedRef.current) {
      return;
    }

    initialSerializedRef.current = serialized;
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  }, [activeLayer.id, effectiveMapModeOverride, layerId, mapModeOverride, pathname, router, themeId, validSelectedId, workspaceView]);

  function handleThemeChange(nextThemeId: ThemeId) {
    const nextView = getThemeView(graph, nextThemeId);
    const nextLiveLogistics = buildLiveLogisticsView(
      nextThemeId,
      null,
      liveLogisticsEvents,
      new Date(rankingNowRef.current)
    );
    const nextWorkspace = buildWorkspacePresentation(graph, nextView, nextLiveLogistics);
    const nextDefaultLayer = getDefaultLayerDefinition(nextThemeId, nextWorkspace);

    startTransition(() => {
      setThemeId(nextThemeId);
      setSelectedId(null);
      setLayerId(nextDefaultLayer.id);
      setMapModeOverride(null);
      setWorkspaceView("map");
      setMapPopupAnchor(null);
      setSearchQuery("");
      setEvidenceOpen(false);
      setCompareOpen(false);
    });
  }

  function handleMapModeChange(nextMapMode: OperationMapMode) {
    const resolved = resolveLegacyPresentation(themeId, nextMapMode, workspace);

    setLayerId(resolved.layer.id);
    setMapModeOverride(resolved.mapModeOverride);
  }

  function handleCompareToggle() {
    const nextIsOpen = !isCompareOpen;

    setCompareOpen(nextIsOpen);
    setWorkspaceView(nextIsOpen ? "comparison" : "map");
  }

  function handleSelect(nextSelectedId: string) {
    setSelectedId(nextSelectedId);
    setMapPopupAnchor(null);
    setEvidenceOpen(true);
  }

  function handleMapSelect(nextSelectedId: string, anchor?: MapPopupAnchor) {
    setSelectedId(nextSelectedId);
    setMapPopupAnchor(anchor ?? null);
    setEvidenceOpen(true);
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setMapPopupAnchor(null);
  }

  const evidencePanel = (
    <EvidencePanel
      collapsed={!isEvidenceOpen}
      detail={detail}
      evidenceGraph={evidenceGraph}
      onSelect={handleSelect}
      onToggleCollapsed={() => setEvidenceOpen((value) => !value)}
      rankingExplanation={liveLogisticsDetailItem ? null : rankingExplanation}
      selectedId={activeId}
      statusPalette={statusPalette}
      themePalette={themePalette}
      themeTitle={view.title}
    />
  );

  return (
    <main className="relative h-screen min-h-screen overflow-hidden text-slate-100 lg:grid lg:grid-rows-[56px,auto,minmax(0,1fr)]" style={shellStyle}>
      <InitialNoticeModal homepageMode={homepageMode} locale={locale} />

      <ActionBar
        onClearFilters={() => setSearchQuery("")}
        queryActive={searchQuery.length > 0}
        routeStatusLabel={routeStatus?.chipLabel ?? null}
        selectedKindLabel={localizeKind(detail.kind)}
        selectedLabel={localizeAnyLabel(detail.id, detail.label)}
        sharePath={sharePath}
        themeLabel={themeLabel}
        themePalette={themePalette}
      />

      <SourceStatusBar
        summary={sourceStatusSummary}
        themePalette={themePalette}
        variant={themeId === "regional-security" ? "public-history" : "default"}
      />

      <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <div className="relative hidden h-full min-h-0 lg:block">
          <section data-testid="layout-map-section" className="absolute inset-0 min-h-0">
            <JapanMainMap
              activeId={activeId}
              detailPopup={mapDetailPopup}
              focusTargetId={focusTargetId}
              mapDisclosure={mapDisclosure}
              mapMode={desktopMapMode}
              model={mapModel}
              onMapModeChange={handleMapModeChange}
              onOpenEvidence={() => setEvidenceOpen(true)}
              overlayInsets={mapOverlayInsets}
              onCloseDetail={handleCloseDetail}
              onSelect={handleMapSelect}
              statusPalette={statusPalette}
              themePalette={themePalette}
            />
          </section>

          <aside
            data-testid="layout-navigation-rail"
            className="absolute left-0 top-0 z-40"
            style={{
              width: railWidth,
              bottom: 0
            }}
          >
            <NavigationRail
              isInboxOpen={isInboxOpen}
              onCloseInbox={() => setInboxOpen(false)}
              onOpenInbox={() => setInboxOpen(true)}
              onThemeChange={handleThemeChange}
              themeId={themeId}
              themeIds={orderedThemeIds}
              themePalette={themePalette}
            />
          </aside>

          {isInboxOpen ? (
            <aside
              data-testid="layout-command-pane"
              aria-hidden="false"
              className="absolute top-0 z-20 min-h-0 overflow-hidden border-r"
              style={{
                left: railWidth,
                width: paneWidth,
                bottom: 0,
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanel
              }}
            >
              <MapInboxPanel
                activeId={activeId}
                briefing={watchboardBriefing}
                onQueryChange={setSearchQuery}
                onSelect={handleSelect}
                query={searchQuery}
                rows={filteredOperationRows}
                liveLogistics={liveLogistics}
                themeId={themeId}
                themeLabel={themeLabel}
                themePalette={themePalette}
                watchOverlays={watchOverlays}
              />
            </aside>
          ) : null}

          <aside
            data-testid="layout-evidence-drawer"
            className="absolute top-0 z-30 min-h-0 overflow-hidden"
            style={{
              right: 0,
              width: evidenceWidth,
              bottom: 0
            }}
          >
            {evidencePanel}
          </aside>

          <section
            data-testid="layout-compare-drawer"
            className="absolute bottom-0 z-30 min-h-0"
            style={{
              left: railWidth + visiblePaneWidth,
              right: evidenceWidth,
              height: compareHeight
            }}
          >
            <OperationsSignalTable
              activeId={activeId}
              collapsed={!isCompareOpen}
              onSelect={handleSelect}
              query={searchQuery}
              rows={filteredOperationRows}
              statusPalette={statusPalette}
              themeId={themeId}
              themePalette={themePalette}
              onToggleCollapsed={handleCompareToggle}
            />
          </section>
        </div>

        <div className="min-w-0 space-y-4 overflow-x-hidden pb-6 lg:hidden">
          {themeId === "logistics" && liveLogistics ? (
            <section className="pt-4">
              <LogisticsImpactBoard
                activeId={activeId}
                liveLogistics={liveLogistics}
                onSelect={handleSelect}
                themePalette={themePalette}
              />
            </section>
          ) : null}
          {themeId !== "logistics" && watchboardBriefing ? (
            <section className="px-4 pt-4">
              <WatchboardBriefing briefing={watchboardBriefing} themePalette={themePalette} />
            </section>
          ) : null}
          <section className="h-[50vh] min-h-[280px]">
            <JapanMainMap
              activeId={activeId}
              detailPopup={mapDetailPopup}
              focusTargetId={focusTargetId}
              mapDisclosure={mapDisclosure}
              mapMode={mobileMapMode}
              model={mapModel}
              onMapModeChange={handleMapModeChange}
              onOpenEvidence={() => setEvidenceOpen(true)}
              overlayInsets={{
                top: 16,
                left: 16,
                right: 16,
                bottom: 16
              }}
              onCloseDetail={handleCloseDetail}
              onSelect={handleMapSelect}
              statusPalette={statusPalette}
              themePalette={themePalette}
              watchOverlays={watchOverlays}
            />
          </section>
          <section className="flex gap-2 overflow-auto px-4">
            {THEME_IDS.map((id) => {
              const theme = getThemeLabel(id);
              const isActive = id === themeId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleThemeChange(id)}
                  className="rounded-full border px-3 py-2 text-xs whitespace-nowrap transition"
                  style={
                    isActive
                      ? {
                          borderColor: themePalette.accent,
                          background: themePalette.accentSoft,
                          color: themePalette.textPrimary
                        }
                      : {
                          borderColor: themePalette.borderSubtle,
                          background: themePalette.surfacePanelElevated,
                          color: themePalette.textMuted
                        }
                  }
                >
                  {theme.label}
                </button>
              );
            })}
          </section>
          <MapInboxPanel
            activeId={activeId}
            onQueryChange={setSearchQuery}
            onSelect={handleSelect}
            query={searchQuery}
            rows={filteredOperationRows}
            liveLogistics={liveLogistics}
            showLogisticsImpactBoard={false}
            themeId={themeId}
            themeLabel={themeLabel}
            themePalette={themePalette}
            watchOverlays={watchOverlays}
          />
          <section data-testid="layout-evidence-drawer-mobile" className="min-h-[24rem] px-0">
            <EvidencePanel
              collapsed={false}
              collapsible={false}
              detail={detail}
              evidenceGraph={evidenceGraph}
              onSelect={handleSelect}
              onToggleCollapsed={() => undefined}
              rankingExplanation={liveLogisticsDetailItem ? null : rankingExplanation}
              selectedId={activeId}
              statusPalette={statusPalette}
              themePalette={themePalette}
              themeTitle={view.title}
            />
          </section>
          <OperationsSignalTable
            activeId={activeId}
            collapsed={false}
            collapsible={false}
            onSelect={handleSelect}
            query={searchQuery}
            rows={filteredOperationRows}
            statusPalette={statusPalette}
            themeId={themeId}
            themePalette={themePalette}
            onToggleCollapsed={() => undefined}
          />
        </div>
      </div>
    </main>
  );
}

function resolveActiveId(
  view: ThemeView,
  liveLogistics: ReturnType<typeof buildLiveLogisticsView>,
  selectedId: string | null
): string {
  const candidateIds = getSelectableIds(view, liveLogistics);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  const defaultLiveLogisticsId = view.id === "logistics" ? liveLogistics?.items[0]?.id : undefined;

  return defaultLiveLogisticsId ?? view.flows[0]?.id ?? view.observations[0]?.id ?? view.entities[0]?.id ?? "country:japan";
}

function resolveSelectableId(
  view: ThemeView,
  liveLogistics: ReturnType<typeof buildLiveLogisticsView>,
  selectedId: string | null
) {
  const candidateIds = getSelectableIds(view, liveLogistics);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  return null;
}

function getSelectableIds(view: ThemeView, liveLogistics: ReturnType<typeof buildLiveLogisticsView>) {
  return new Set([
    ...view.flows.map((flow) => flow.id),
    ...view.observations.map((observation) => observation.id),
    ...view.entities.map((entity) => entity.id),
    ...(liveLogistics?.items.map((item) => item.id) ?? [])
  ]);
}
