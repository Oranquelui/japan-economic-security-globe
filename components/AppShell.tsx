"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { HomepageMode } from "../lib/config/homepage-mode";
import type { LiveLogisticsEvent } from "../types/logistics";
import type { MapPopupAnchor, SemanticLayerId, ThemeView } from "../types/presentation";
import type { RankingSignal } from "../types/ranking";
import type { RoadOperationsDataset, RoadOperationsViewModel } from "../types/road-operations";
import { THEME_IDS, type SemanticGraph, type ThemeId } from "../types/semantic";
import { buildRankingDecision } from "../lib/ranking/decision";
import { getDetailView } from "../lib/semantic/detail";
import { buildEvidenceGraph } from "../lib/semantic/view-models";
import { buildJapanMapCanvasModel } from "../lib/presentation/map-canvas";
import { buildLiveLogisticsDetail } from "../lib/presentation/live-logistics-detail";
import { buildLiveLogisticsView } from "../lib/presentation/live-logistics";
import { buildRoadOperationsView } from "../lib/presentation/road-operations";
import { validateMetricSeries } from "../lib/presentation/metric-series";
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
import { getThemeLabel } from "../lib/presentation/japanese";
import { getRouteStatus } from "../lib/presentation/route-status";
import {
  buildSelectionInspector,
  buildActiveLayerSummary,
  buildMetricSeries,
  buildWorkspacePresentation,
  getDefaultLayerDefinition,
  getLayerDefinition,
  resolveLegacyPresentation
} from "../lib/presentation/workspace";
import { summarizeSourceStatus } from "../lib/official/source-freshness";
import { ActionBar } from "./ActionBar";
import { ComparisonPanel } from "./ComparisonPanel";
import { ContextInspector } from "./ContextInspector";
import { EvidencePanel } from "./EvidencePanel";
import { InitialNoticeModal } from "./InitialNoticeModal";
import { JapanMainMap } from "./JapanMainMap";
import { LogisticsImpactBoard } from "./LogisticsImpactBoard";
import { LogisticsRouteOverviewPanel } from "./LogisticsRouteOverviewPanel";
import { MapInboxPanel } from "./MapInboxPanel";
import { OperationsSignalTable } from "./OperationsSignalTable";
import { SourceStatusBar } from "./SourceStatusBar";
import { ScopeContextPanel } from "./ScopeContextPanel";
import { isRoadOperationsSelection, RoadConditionInspector } from "./RoadConditionInspector";
import { SignalsPanel } from "./SignalsPanel";
import { WatchboardBriefing } from "./WatchboardBriefing";

interface AppShellProps {
  graph: SemanticGraph;
  hasExplicitUrlState?: boolean;
  homepageMode?: HomepageMode;
  initialUrlState?: OperationsUrlState;
  locale?: string;
  liveLogisticsEvents?: LiveLogisticsEvent[];
  rankingSignals?: RankingSignal[];
  roadOperationsDataset?: RoadOperationsDataset | null;
}

const DESKTOP_WORKSPACE_GEOMETRY = {
  comparisonHeight: 264,
  contextPaneWidth: 320,
  inspectorWidth: 360
} as const;
const DESKTOP_WORKSPACE_MEDIA_QUERY = "(min-width: 1280px)";
const FOCUSABLE_CONTROL_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

type InspectorOrigin = "comparison" | "signals";

export function AppShell({
  graph,
  hasExplicitUrlState = false,
  homepageMode = "default",
  initialUrlState = DEFAULT_OPERATIONS_URL_STATE,
  locale = "ja",
  liveLogisticsEvents = [],
  rankingSignals = [],
  roadOperationsDataset = null
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectorReturnFocusRef = useRef<HTMLElement | null>(null);
  const inspectorOriginRef = useRef<InspectorOrigin | null>(null);
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
  const initialMetricSeries = buildMetricSeries(
    graph,
    resolvedInitialThemeId,
    initialPresentation.layer.id
  );
  const resolvedInitialWorkspaceView = initialUrlState.workspaceView === "comparison"
    && !validateMetricSeries(initialMetricSeries, initialView.sources).comparable
      ? "map"
      : homepageThemeChanged ? "map" : initialUrlState.workspaceView;
  const resolvedInitialState: OperationsUrlState = {
    themeId: resolvedInitialThemeId,
    selectedId: resolvedInitialSelectedId,
    layerId: initialPresentation.layer.id,
    mapModeOverride: initialPresentation.mapModeOverride,
    workspaceView: resolvedInitialWorkspaceView
  };
  const [themeId, setThemeId] = useState<ThemeId>(resolvedInitialState.themeId);
  const [selectedId, setSelectedId] = useState<string | null>(resolvedInitialState.selectedId);
  const [mapPopupAnchor, setMapPopupAnchor] = useState<MapPopupAnchor | null>(null);
  const [layerId, setLayerId] = useState(resolvedInitialState.layerId);
  const [mapModeOverride, setMapModeOverride] = useState<OperationMapMode | null>(
    resolvedInitialState.mapModeOverride
  );
  const [workspaceView, setWorkspaceView] = useState<OperationsUrlState["workspaceView"]>(resolvedInitialState.workspaceView);
  const [searchQuery, setSearchQuery] = useState("");
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
  const roadOperations = themeId === "logistics"
    ? buildRoadOperationsView(roadOperationsDataset, new Date(rankingNowRef.current))
    : null;
  const validSelectedId = resolveSelectableId(view, preliminaryLiveLogistics, roadOperations, selectedId);
  const explicitSelectionId = validSelectedId ?? "";
  const roadSelectionActive = isRoadOperationsSelection(roadOperations, validSelectedId);
  const activeId = resolveActiveId(
    view,
    preliminaryLiveLogistics,
    roadSelectionActive ? null : validSelectedId
  );
  const mapSelectionId = themeId === "logistics" ? explicitSelectionId : activeId;
  const rankingExplanation = inboxDecision
    ? buildSelectedRankingExplanation(activeId, rankingSignals, inboxDecision, rankingNowRef.current)
    : null;
  const watchboardBriefing = homepageDecision
    ? buildWatchboardBriefing(graph, rankingSignals, homepageDecision, rankingNowRef.current, themeId)
    : null;
  const watchOverlays = buildWatchOverlayItems(themeId, activeId, new Date(rankingNowRef.current));
  const liveLogistics = buildLiveLogisticsView(
    themeId,
    validSelectedId,
    liveLogisticsEvents,
    new Date(rankingNowRef.current)
  );
  const workspace = buildWorkspacePresentation(graph, view, liveLogistics);
  const requestedLayer = getLayerDefinition(themeId, layerId, workspace);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : getDefaultLayerDefinition(themeId, workspace);
  const activeLayerSummary = buildActiveLayerSummary(
    graph,
    view,
    activeLayer,
    workspace.scope,
    liveLogistics,
    roadOperations
  );
  const metricSeries = buildMetricSeries(graph, themeId, activeLayer.id);
  const comparisonValidation = validateMetricSeries(metricSeries, view.sources);
  const usesSemanticPrefectureBoundaries = activeLayer.renderMode === "choropleth"
    && activeLayer.content.kind === "regional-metric"
    && activeLayer.content.entityKind === "Prefecture";
  const desktopMapMode = mapModeOverride ?? activeLayer.renderMode;
  const mobileMapMode = mapModeOverride
    ?? (usesSemanticPrefectureBoundaries ? activeLayer.renderMode : "point");
  const liveLogisticsDetailItem = liveLogistics?.items.find((item) => item.id === activeId) ?? null;
  const focusTargetId = validSelectedId;
  const detail = liveLogisticsDetailItem
    ? buildLiveLogisticsDetail(graph, liveLogisticsDetailItem)
    : getDetailView(graph, activeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const selectionInspector = buildSelectionInspector(graph, activeId, detail, activeLayer);
  const routeStatus = getRouteStatus(detail);
  const legacyMapModel = buildJapanMapCanvasModel(
    graph,
    view,
    mapSelectionId,
    null,
    liveLogistics,
    roadOperations
  );
  const semanticDesktopMapModel = buildJapanMapCanvasModel(
    graph,
    view,
    mapSelectionId,
    activeLayer,
    liveLogistics,
    roadOperations
  );
  const desktopMapModel = mapModeOverride && !usesSemanticPrefectureBoundaries
    ? legacyMapModel
    : semanticDesktopMapModel;
  const mobileMapModel = usesSemanticPrefectureBoundaries
    ? semanticDesktopMapModel
    : legacyMapModel;
  const mapDisclosure =
    themeId === "regional-security"
      ? {
          title: "代表軌道",
          body: "公開情報 / 履歴・集約 / ライブ追跡ではありません"
        }
      : null;
  const mapDetailPopup = validSelectedId && !roadSelectionActive
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
  const currentViewLabel = [themeLabel, activeLayer.label, activeLayer.periodLabel].join(" / ");
  const serializedState = serializeOperationsUrlState({
    themeId,
    selectedId: validSelectedId,
    layerId: activeLayer.id,
    mapModeOverride,
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
  const paneWidth = DESKTOP_WORKSPACE_GEOMETRY.contextPaneWidth;
  const inspectorExpandedWidth = DESKTOP_WORKSPACE_GEOMETRY.inspectorWidth;
  const inspectorWidth = isEvidenceOpen ? inspectorExpandedWidth : 0;
  const compareHeight = workspaceView === "comparison" ? DESKTOP_WORKSPACE_GEOMETRY.comparisonHeight : 0;
  const mapOverlayInsets = {
    top: 16,
    left: paneWidth + 16,
    right: inspectorWidth + 16,
    bottom: compareHeight + 16
  };

  useEffect(() => {
    return () => {
      if (focusTimerRef.current !== null) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (layerId !== activeLayer.id) {
      setLayerId(activeLayer.id);
    }
  }, [activeLayer.id, layerId]);

  useEffect(() => {
    if (!selectedId || validSelectedId || !isRoadDatasetSelectionId(roadOperationsDataset, selectedId)) {
      return;
    }
    setSelectedId(null);
    setMapPopupAnchor(null);
    setEvidenceOpen(false);
  }, [roadOperationsDataset, selectedId, validSelectedId]);

  useEffect(() => {
    const serialized = serializeOperationsUrlState({
      themeId,
      selectedId: validSelectedId,
      layerId: activeLayer.id,
      mapModeOverride,
      workspaceView
    });

    if (serialized === initialSerializedRef.current) {
      return;
    }

    initialSerializedRef.current = serialized;
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  }, [activeLayer.id, layerId, mapModeOverride, pathname, router, themeId, validSelectedId, workspaceView]);

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

    inspectorReturnFocusRef.current = null;
    inspectorOriginRef.current = null;

    startTransition(() => {
      setThemeId(nextThemeId);
      setSelectedId(null);
      setLayerId(nextDefaultLayer.id);
      setMapModeOverride(null);
      setWorkspaceView("map");
      setMapPopupAnchor(null);
      setSearchQuery("");
      setEvidenceOpen(false);
    });
  }

  function handleMapModeChange(nextMapMode: OperationMapMode) {
    const resolved = resolveLegacyPresentation(themeId, nextMapMode, workspace);

    setLayerId(resolved.layer.id);
    setMapModeOverride(resolved.mapModeOverride);
  }

  function handleLayerChange(nextLayerId: SemanticLayerId) {
    const nextLayer = getLayerDefinition(themeId, nextLayerId, workspace);

    if (!nextLayer?.available) {
      return;
    }

    setLayerId(nextLayer.id);
    setMapModeOverride(null);
    if (workspaceView === "comparison") {
      const nextSeries = buildMetricSeries(graph, themeId, nextLayer.id);
      if (!validateMetricSeries(nextSeries, view.sources).comparable) {
        setWorkspaceView("map");
      }
    }
  }

  function handleOpenSignals() {
    setWorkspaceView("signals");
  }

  function handleOpenComparison() {
    if (!comparisonValidation.comparable) {
      return;
    }
    setWorkspaceView("comparison");
  }

  function handleCloseSecondary(origin: "comparison" | "signals") {
    setWorkspaceView("map");
    scheduleFocus(() => (
      document.querySelector<HTMLButtonElement>(
        `[data-testid="layout-desktop-workspace"] [data-secondary-action="${origin}"]`
      )
    ));
  }

  function scheduleFocus(resolveTarget: () => HTMLElement | null) {
    if (focusTimerRef.current !== null) {
      clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = setTimeout(() => {
      focusTimerRef.current = null;
      resolveTarget()?.focus();
    }, 0);
  }

  function captureInspectorReturnFocus(origin: InspectorOrigin | null = null) {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || activeElement === document.body) {
      return;
    }
    if (activeElement.closest('[data-testid="layout-context-inspector"]')) {
      return;
    }

    inspectorReturnFocusRef.current = activeElement;
    inspectorOriginRef.current = origin;
  }

  function handleSelect(nextSelectedId: string) {
    captureInspectorReturnFocus();
    setSelectedId(nextSelectedId);
    setMapPopupAnchor(null);
    setEvidenceOpen(true);
  }

  function handleSecondarySelect(nextSelectedId: string, origin: InspectorOrigin) {
    captureInspectorReturnFocus(origin);
    setWorkspaceView("map");
    setSelectedId(nextSelectedId);
    setMapPopupAnchor(null);
    setEvidenceOpen(true);
    scheduleFocus(() => (
      document.querySelector<HTMLElement>(
        '[data-testid="layout-desktop-workspace"] [data-testid="context-inspector"] h2'
      )
    ));
  }

  function handleMapSelect(nextSelectedId: string, anchor?: MapPopupAnchor) {
    captureInspectorReturnFocus();
    setSelectedId(nextSelectedId);
    setMapPopupAnchor(anchor ?? null);
    setEvidenceOpen(true);
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setMapPopupAnchor(null);
  }

  function handleCloseInspector() {
    const returnTarget = inspectorReturnFocusRef.current;
    const origin = inspectorOriginRef.current;

    inspectorReturnFocusRef.current = null;
    inspectorOriginRef.current = null;
    setEvidenceOpen(false);
    scheduleFocus(() => {
      const desktopWorkspace = document.querySelector<HTMLElement>('[data-testid="layout-desktop-workspace"]');
      const stackedWorkspace = document.querySelector<HTMLElement>('[data-testid="layout-stacked-workspace"]');
      const desktopActive = typeof window.matchMedia !== "function"
        || window.matchMedia(DESKTOP_WORKSPACE_MEDIA_QUERY).matches;
      const targetInDesktop = Boolean(returnTarget && desktopWorkspace?.contains(returnTarget));
      const targetInStacked = Boolean(returnTarget && stackedWorkspace?.contains(returnTarget));
      const returnTargetMatchesLayout = desktopActive ? !targetInStacked : !targetInDesktop;

      if (returnTarget?.isConnected && returnTargetMatchesLayout) {
        return returnTarget;
      }
      if (!desktopActive) {
        return findMatchingWorkspaceControl(stackedWorkspace, returnTarget);
      }
      if (origin) {
        const originTrigger = desktopWorkspace?.querySelector<HTMLElement>(
          `[data-secondary-action="${origin}"]`
        ) ?? null;
        if (originTrigger) {
          return originTrigger;
        }
      }
      return desktopWorkspace?.querySelector<HTMLElement>(
        '[data-testid="scope-context-panel"] [aria-pressed="true"]'
      ) ?? null;
    });
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (workspaceView === "signals" || workspaceView === "comparison") {
        event.preventDefault();
        handleCloseSecondary(workspaceView);
        return;
      }

      if (isEvidenceOpen) {
        event.preventDefault();
        handleCloseInspector();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isEvidenceOpen, workspaceView]);

  return (
    <main className="relative h-screen min-h-screen overflow-hidden text-slate-100 xl:grid xl:grid-rows-[56px,minmax(0,1fr)]" style={shellStyle}>
      <InitialNoticeModal homepageMode={homepageMode} locale={locale} />

      <ActionBar
        currentViewLabel={currentViewLabel}
        sharePath={sharePath}
        themePalette={themePalette}
      />

      <div data-testid="layout-source-status-mobile" className="xl:hidden">
        <SourceStatusBar
          summary={sourceStatusSummary}
          themePalette={themePalette}
          variant={themeId === "regional-security" ? "public-history" : "default"}
        />
      </div>

      <div data-testid="layout-workspace-scroll" className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto xl:overflow-hidden">
        <div data-testid="layout-desktop-workspace" className="relative hidden h-full min-h-0 xl:block">
          <section data-testid="layout-map-section" className="absolute inset-0 min-h-0">
            <JapanMainMap
              activeId={mapSelectionId}
              focusTargetId={focusTargetId}
              mapDisclosure={mapDisclosure}
              mapMode={desktopMapMode}
              model={desktopMapModel}
              overlayInsets={mapOverlayInsets}
              onCloseDetail={handleCloseDetail}
              onSelect={handleMapSelect}
              statusPalette={statusPalette}
              themePalette={themePalette}
            />
          </section>

          <aside
            data-testid="layout-command-pane"
            aria-hidden="false"
            className="absolute left-0 top-0 z-20 min-h-0 overflow-hidden border-r"
            style={{
              left: 0,
              width: paneWidth,
              bottom: 0,
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanel
            }}
          >
            {workspaceView === "signals" ? (
              <SignalsPanel
                activeId={activeId}
                onBackToMap={() => handleCloseSecondary("signals")}
                onQueryChange={setSearchQuery}
                onSelect={(nextSelectedId) => handleSecondarySelect(nextSelectedId, "signals")}
                query={searchQuery}
                rows={filteredOperationRows}
                themeId={themeId}
                themeLabel={themeLabel}
                themePalette={themePalette}
              />
            ) : (
              <ScopeContextPanel
                activeLayerId={activeLayer.id}
                activeSummary={activeLayerSummary}
                comparisonAvailable={comparisonValidation.comparable}
                logisticsRouteOverview={themeId === "logistics" && liveLogistics ? (
                  <LogisticsRouteOverviewPanel
                    activeId={explicitSelectionId}
                    liveLogistics={liveLogistics}
                    roadOperations={roadOperations}
                    onSelect={handleSelect}
                    themePalette={themePalette}
                  />
                ) : null}
                onLayerChange={handleLayerChange}
                onOpenComparison={handleOpenComparison}
                onOpenSignals={handleOpenSignals}
                onThemeChange={handleThemeChange}
                themeId={themeId}
                themeIds={orderedThemeIds}
                themePalette={themePalette}
                workspace={workspace}
              />
            )}
          </aside>

          {isEvidenceOpen ? (
            <aside
              data-testid="layout-context-inspector"
              className="absolute top-0 z-30 min-h-0 overflow-hidden"
              style={{
                right: 0,
                width: inspectorWidth,
                bottom: 0
              }}
            >
              {roadSelectionActive && roadOperations ? (
                <RoadConditionInspector
                  graph={graph}
                  idPrefix="road-condition-desktop"
                  onClose={handleCloseInspector}
                  roadOperations={roadOperations}
                  selectedId={explicitSelectionId}
                  themePalette={themePalette}
                />
              ) : (
                <ContextInspector
                  evidenceGraph={evidenceGraph}
                  inspector={selectionInspector}
                  onClose={handleCloseInspector}
                  onSelect={handleSelect}
                  rankingExplanation={liveLogisticsDetailItem ? null : rankingExplanation}
                  selectedId={activeId}
                  statusPalette={statusPalette}
                  themePalette={themePalette}
                  themeTitle={view.title}
                />
              )}
            </aside>
          ) : null}

          {workspaceView === "comparison" && comparisonValidation.comparable ? (
            <section
              data-testid="layout-compare-drawer"
              className="absolute bottom-0 z-30 min-h-0"
              style={{
                left: paneWidth,
                right: inspectorWidth,
                height: compareHeight
              }}
            >
              <ComparisonPanel
                activeId={activeId}
                layer={activeLayer}
                onClose={() => handleCloseSecondary("comparison")}
                onSelect={(nextSelectedId) => handleSecondarySelect(nextSelectedId, "comparison")}
                series={metricSeries}
                sources={view.sources}
                themePalette={themePalette}
              />
            </section>
          ) : null}
        </div>

        <div data-testid="layout-stacked-workspace" className="min-w-0 space-y-4 overflow-x-hidden pb-6 xl:hidden">
          {themeId === "logistics" && liveLogistics ? (
            <section className="pt-4">
              <LogisticsImpactBoard
                activeId={explicitSelectionId}
                liveLogistics={liveLogistics}
                roadOperations={roadOperations}
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
              activeId={mapSelectionId}
              detailPopup={mapDetailPopup}
              focusTargetId={focusTargetId}
              mapDisclosure={mapDisclosure}
              mapMode={mobileMapMode}
              model={mobileMapModel}
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
            activeId={explicitSelectionId}
            onQueryChange={setSearchQuery}
            onSelect={handleSelect}
            query={searchQuery}
            rows={filteredOperationRows}
            liveLogistics={liveLogistics}
            roadOperations={roadOperations}
            showLogisticsImpactBoard={false}
            themeId={themeId}
            themeLabel={themeLabel}
            themePalette={themePalette}
            watchOverlays={watchOverlays}
          />
          <section data-testid="layout-evidence-drawer-mobile" className="min-h-[24rem] px-0">
            {roadSelectionActive && roadOperations ? (
              isEvidenceOpen ? (
                <RoadConditionInspector
                  graph={graph}
                  idPrefix="road-condition-stacked"
                  onClose={handleCloseInspector}
                  roadOperations={roadOperations}
                  selectedId={explicitSelectionId}
                  themePalette={themePalette}
                />
              ) : (
                <div
                  role="status"
                  data-testid="road-condition-inspector-closed"
                  className="border-y px-4 py-5 text-xs leading-5"
                  style={{
                    borderColor: themePalette.borderSubtle,
                    background: themePalette.surfacePanel,
                    color: themePalette.textMuted
                  }}
                >
                  道路状況の詳細は閉じています。経路または道路状態を選択すると再表示します。
                </div>
              )
            ) : (
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
            )}
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
  roadOperations: RoadOperationsViewModel | null,
  selectedId: string | null
) {
  const candidateIds = getSelectableIds(view, liveLogistics, roadOperations);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  return null;
}

function getSelectableIds(
  view: ThemeView,
  liveLogistics: ReturnType<typeof buildLiveLogisticsView>,
  roadOperations: RoadOperationsViewModel | null = null
) {
  return new Set([
    ...view.flows.map((flow) => flow.id),
    ...view.observations.map((observation) => observation.id),
    ...view.entities.map((entity) => entity.id),
    ...(liveLogistics?.items
      .filter((item) => view.id === "logistics" || item.laneId !== "road")
      .map((item) => item.id) ?? []),
    ...(view.id === "logistics" && roadOperations
      ? [
          ...roadOperations.routes.map((route) => route.id),
          ...roadOperations.conditions.map((condition) => condition.id),
          ...roadOperations.restrictions.map((restriction) => restriction.id)
        ]
      : [])
  ]);
}

function isRoadDatasetSelectionId(dataset: RoadOperationsDataset | null, selectedId: string) {
  if (/^road-(?:condition|restriction|segment|junction):/.test(selectedId)) return true;
  if (!dataset) return false;
  return [
    ...dataset.routes,
    ...(dataset.segments ?? []),
    ...(dataset.junctions ?? []),
    ...(dataset.conditionObservations ?? []),
    ...(dataset.restrictionEvents ?? [])
  ].some((item) => item.id === selectedId);
}

function findMatchingWorkspaceControl(
  workspace: HTMLElement | null,
  returnTarget: HTMLElement | null
) {
  if (!workspace) {
    return null;
  }

  const controls = Array.from(workspace.querySelectorAll<HTMLElement>(FOCUSABLE_CONTROL_SELECTOR));
  const returnLabel = getControlLabel(returnTarget);
  if (returnLabel) {
    const matchingControl = controls.find((control) => getControlLabel(control) === returnLabel);
    if (matchingControl) {
      return matchingControl;
    }
  }

  return controls[0] ?? null;
}

function getControlLabel(control: HTMLElement | null) {
  return control?.getAttribute("aria-label")?.trim()
    || control?.textContent?.replace(/\s+/g, " ").trim()
    || null;
}
