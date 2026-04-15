"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { HomepageMode } from "../lib/config/homepage-mode";
import type { ThemeView } from "../types/presentation";
import type { SemanticGraph, ThemeId } from "../types/semantic";
import { getDetailView } from "../lib/semantic/detail";
import { buildJapanMapCanvasModel } from "../lib/presentation/map-canvas";
import { getThemeView } from "../lib/semantic/selectors";
import { buildEvidenceGraph } from "../lib/semantic/view-models";
import { buildOperationRows, filterOperationRows, type OperationMapMode } from "../lib/presentation/operations";
import { getStatusPalette, getThemePalette } from "../lib/presentation/palette";
import {
  DEFAULT_OPERATIONS_URL_STATE,
  serializeOperationsUrlState,
  type OperationsUrlState
} from "../lib/presentation/url-state";
import { getThemeLabel, localizeAnyLabel, localizeKind } from "../lib/presentation/japanese";
import { getRouteStatus } from "../lib/presentation/route-status";
import { ActionBar } from "./ActionBar";
import { EvidencePanel } from "./EvidencePanel";
import { InitialNoticeModal } from "./InitialNoticeModal";
import { JapanMainMap } from "./JapanMainMap";
import { MapInboxPanel } from "./MapInboxPanel";
import { NavigationRail } from "./NavigationRail";
import { OperationsSignalTable } from "./OperationsSignalTable";

interface AppShellProps {
  graph: SemanticGraph;
  homepageMode?: HomepageMode;
  initialUrlState?: OperationsUrlState;
  locale?: string;
}

export function AppShell({
  graph,
  homepageMode = "default",
  initialUrlState = DEFAULT_OPERATIONS_URL_STATE,
  locale = "ja"
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [themeId, setThemeId] = useState<ThemeId>(initialUrlState.themeId);
  const [selectedId, setSelectedId] = useState<string | null>(initialUrlState.selectedId);
  const [mapMode, setMapMode] = useState<OperationMapMode>(initialUrlState.mapMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInboxOpen, setInboxOpen] = useState(true);
  const [isEvidenceOpen, setEvidenceOpen] = useState(true);
  const [, startTransition] = useTransition();
  const initialSerializedRef = useRef(serializeOperationsUrlState(initialUrlState));
  const view = getThemeView(graph, themeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const operationRows = buildOperationRows(view);
  const filteredOperationRows = filterOperationRows(operationRows, searchQuery);
  const validSelectedId = resolveSelectableId(view, selectedId);
  const activeId = resolveActiveId(view, validSelectedId);
  const focusTargetId = validSelectedId;
  const detail = getDetailView(graph, activeId);
  const routeStatus = getRouteStatus(detail);
  const mapModel = buildJapanMapCanvasModel(graph, view, activeId);
  const themePalette = getThemePalette(themeId);
  const statusPalette = getStatusPalette();
  const themeLabel = getThemeLabel(themeId).label;
  const serializedState = serializeOperationsUrlState({
    themeId,
    mapMode,
    selectedId: validSelectedId
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
  const railWidth = 56;
  const paneWidth = 320;
  const visiblePaneWidth = isInboxOpen ? paneWidth : 0;
  const compareHeight = 264;
  const evidenceWidth = isEvidenceOpen ? 360 : 52;
  const mapOverlayInsets = {
    top: 16,
    left: railWidth + visiblePaneWidth + 16,
    right: evidenceWidth + 16,
    bottom: compareHeight + 16
  };

  useEffect(() => {
    const serialized = serializeOperationsUrlState({
      themeId,
      mapMode,
      selectedId: validSelectedId
    });

    if (serialized === initialSerializedRef.current) {
      return;
    }

    initialSerializedRef.current = serialized;
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  }, [mapMode, pathname, router, themeId, validSelectedId]);

  function handleThemeChange(nextThemeId: ThemeId) {
    startTransition(() => {
      setThemeId(nextThemeId);
      setSelectedId(null);
      setSearchQuery("");
    });
  }

  return (
    <main className="relative grid h-screen min-h-screen grid-rows-[56px,minmax(0,1fr)] overflow-hidden text-slate-100" style={shellStyle}>
      <InitialNoticeModal homepageMode={homepageMode} locale={locale} />

      <ActionBar
        mapMode={mapMode}
        onClearFilters={() => setSearchQuery("")}
        onMapModeChange={setMapMode}
        queryActive={searchQuery.length > 0}
        routeStatusLabel={routeStatus?.chipLabel ?? null}
        selectedKindLabel={localizeKind(detail.kind)}
        selectedLabel={localizeAnyLabel(detail.id, detail.label)}
        sharePath={sharePath}
        themeLabel={themeLabel}
        themePalette={themePalette}
      />

      <div className="min-h-0">
        <div className="relative hidden h-full min-h-0 lg:block">
          <section data-testid="layout-map-section" className="absolute inset-0 min-h-0">
            <JapanMainMap
              activeId={activeId}
              focusTargetId={focusTargetId}
              mapMode={mapMode}
              model={mapModel}
              overlayInsets={mapOverlayInsets}
              onSelect={setSelectedId}
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
              onThemeChange={handleThemeChange}
              onToggleInbox={() => setInboxOpen((value) => !value)}
              themeId={themeId}
              themePalette={themePalette}
            />
          </aside>

          <aside
            data-testid="layout-left-nav"
            aria-hidden={isInboxOpen ? "false" : "true"}
            className="absolute left-14 top-0 z-20 min-h-0 overflow-hidden border-r transition-[transform,opacity,visibility] duration-200 ease-out"
            style={{
              width: paneWidth,
              opacity: isInboxOpen ? 1 : 0,
              transform: isInboxOpen ? "translateX(0)" : "translateX(calc(-100% - 12px))",
              visibility: isInboxOpen ? "visible" : "hidden",
              pointerEvents: isInboxOpen ? "auto" : "none",
              bottom: 0,
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanel
            }}
          >
            <MapInboxPanel
              activeId={activeId}
              onQueryChange={setSearchQuery}
              onSelect={setSelectedId}
              query={searchQuery}
              rows={filteredOperationRows}
              themeId={themeId}
              themeLabel={themeLabel}
              themePalette={themePalette}
            />
          </aside>

          <div
            data-testid="layout-evidence-overlay"
            className="pointer-events-none absolute right-0 top-0 z-40 flex justify-end"
            style={{
              bottom: 0
            }}
          >
            <div
              className="pointer-events-auto h-full transition-[width] duration-200 ease-out"
              style={{ width: evidenceWidth }}
            >
              <EvidencePanel
                collapsed={!isEvidenceOpen}
                detail={detail}
                evidenceGraph={evidenceGraph}
              onSelect={setSelectedId}
              selectedId={activeId}
              statusPalette={statusPalette}
              themePalette={themePalette}
              themeTitle={view.title}
                onToggleCollapsed={() => setEvidenceOpen((value) => !value)}
              />
            </div>
          </div>

          <section
            data-testid="layout-compare-overlay"
            className="absolute bottom-0 right-0 z-30 min-h-0"
            style={{
              left: railWidth + visiblePaneWidth,
              right: evidenceWidth,
              height: compareHeight
            }}
          >
            <OperationsSignalTable
              activeId={activeId}
              collapsed={false}
              collapsible={false}
              onSelect={setSelectedId}
              query={searchQuery}
              rows={filteredOperationRows}
              statusPalette={statusPalette}
              themePalette={themePalette}
              onToggleCollapsed={() => undefined}
            />
          </section>
        </div>

        <div className="space-y-4 lg:hidden">
          <section className="h-[50vh] min-h-[280px]">
            <JapanMainMap
              activeId={activeId}
              focusTargetId={focusTargetId}
              mapMode={mapMode}
              model={mapModel}
              overlayInsets={{
                top: 16,
                left: 16,
                right: 16,
                bottom: 16
              }}
              onSelect={setSelectedId}
              statusPalette={statusPalette}
              themePalette={themePalette}
            />
          </section>
          <section className="flex gap-2 overflow-auto px-4">
            {(["energy", "rice", "water", "defense", "semiconductors"] as ThemeId[]).map((id) => {
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
            onSelect={setSelectedId}
            query={searchQuery}
            rows={filteredOperationRows}
            themeId={themeId}
            themeLabel={themeLabel}
            themePalette={themePalette}
          />
          <OperationsSignalTable
            activeId={activeId}
            collapsed={false}
            collapsible={false}
            onSelect={setSelectedId}
            query={searchQuery}
            rows={filteredOperationRows}
            statusPalette={statusPalette}
            themePalette={themePalette}
            onToggleCollapsed={() => undefined}
          />
          <EvidencePanel
            collapsed={false}
            collapsible={false}
            detail={detail}
            evidenceGraph={evidenceGraph}
            onSelect={setSelectedId}
            selectedId={activeId}
            statusPalette={statusPalette}
            themePalette={themePalette}
            themeTitle={view.title}
            onToggleCollapsed={() => undefined}
          />
        </div>
      </div>
    </main>
  );
}

function resolveActiveId(view: ThemeView, selectedId: string | null): string {
  const candidateIds = new Set([
    ...view.flows.map((flow) => flow.id),
    ...view.observations.map((observation) => observation.id),
    ...view.entities.map((entity) => entity.id)
  ]);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  return view.flows[0]?.id ?? view.observations[0]?.id ?? view.entities[0]?.id ?? "country:japan";
}

function resolveSelectableId(view: ThemeView, selectedId: string | null) {
  const candidateIds = new Set([
    ...view.flows.map((flow) => flow.id),
    ...view.observations.map((observation) => observation.id),
    ...view.entities.map((entity) => entity.id)
  ]);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  return null;
}
