"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ThemeView } from "../types/presentation";
import type { SemanticGraph, ThemeId } from "../types/semantic";
import { getDetailView } from "../lib/semantic/detail";
import { buildJapanMapCanvasModel } from "../lib/presentation/map-canvas";
import { buildOperationsMetrics } from "../lib/presentation/metrics";
import { getThemeView } from "../lib/semantic/selectors";
import { buildEvidenceGraph } from "../lib/semantic/view-models";
import { buildOperationRows, filterOperationRows, type OperationMapMode } from "../lib/presentation/operations";
import { getStatusPalette, getThemePalette } from "../lib/presentation/palette";
import {
  DEFAULT_OPERATIONS_URL_STATE,
  serializeOperationsUrlState,
  type OperationsUrlState
} from "../lib/presentation/url-state";
import { ActionBar } from "./ActionBar";
import { EvidencePanel } from "./EvidencePanel";
import { JapanMainMap } from "./JapanMainMap";
import { MapInboxPanel } from "./MapInboxPanel";
import { OperationsSignalTable } from "./OperationsSignalTable";

interface AppShellProps {
  graph: SemanticGraph;
  initialUrlState?: OperationsUrlState;
}

export function AppShell({ graph, initialUrlState = DEFAULT_OPERATIONS_URL_STATE }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [themeId, setThemeId] = useState<ThemeId>(initialUrlState.themeId);
  const [selectedId, setSelectedId] = useState<string | null>(initialUrlState.selectedId);
  const [mapMode, setMapMode] = useState<OperationMapMode>(initialUrlState.mapMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInboxOpen, setInboxOpen] = useState(true);
  const [isEvidenceOpen, setEvidenceOpen] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
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
  const mapModel = buildJapanMapCanvasModel(graph, view, activeId);
  const themePalette = getThemePalette(themeId);
  const statusPalette = getStatusPalette();
  const metrics = buildOperationsMetrics(view, filteredOperationRows);
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
  const leftWidth = isInboxOpen ? 264 : 56;
  const compareHeight = 248;

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
    <main className="grid h-screen min-h-screen grid-rows-[56px,minmax(0,1fr)] overflow-hidden text-slate-100" style={shellStyle}>
      <ActionBar
        metrics={metrics}
        onClearFilters={() => setSearchQuery("")}
        queryActive={searchQuery.length > 0}
        sharePath={sharePath}
        themePalette={themePalette}
      />

      <div className="min-h-0 p-4">
        <div
          className="hidden h-full min-h-0 gap-4 lg:grid"
          style={{
            gridTemplateColumns: `${leftWidth}px minmax(0, 1fr)`,
            gridTemplateRows: `minmax(0, 1fr) ${compareHeight}px`
          }}
        >
          <aside data-testid="layout-left-nav" className="row-span-2 min-h-0">
            <MapInboxPanel
              collapsed={!isInboxOpen}
              query={searchQuery}
              themePalette={themePalette}
              themeId={themeId}
              onQueryChange={setSearchQuery}
              onToggleCollapsed={() => setInboxOpen((value) => !value)}
              onThemeChange={handleThemeChange}
            />
          </aside>

          <section data-testid="layout-map-section" className="relative min-h-0">
            <JapanMainMap
              activeId={activeId}
              detail={detail}
              focusTargetId={focusTargetId}
              mapMode={mapMode}
              metrics={[]}
              model={mapModel}
              metricsExpanded={metricsExpanded}
              onMapModeChange={setMapMode}
              onToggleMetrics={() => setMetricsExpanded((value) => !value)}
              onSelect={setSelectedId}
              statusPalette={statusPalette}
              themePalette={themePalette}
            />

            <div
              data-testid="layout-evidence-overlay"
              className="pointer-events-none absolute bottom-4 right-4 top-4 z-30 flex justify-end"
            >
              <div
                className="pointer-events-auto h-full transition-[width] duration-200 ease-out"
                style={{ width: isEvidenceOpen ? 320 : 56 }}
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
          </section>

          <section data-testid="layout-compare-section" className="min-h-0">
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
          <MapInboxPanel
            collapsed={false}
            query={searchQuery}
            themePalette={themePalette}
            themeId={themeId}
            onQueryChange={setSearchQuery}
            onToggleCollapsed={() => undefined}
            onThemeChange={handleThemeChange}
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
