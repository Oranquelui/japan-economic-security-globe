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
  const [isInboxOpen, setInboxOpen] = useState(false);
  const [isEvidenceOpen, setEvidenceOpen] = useState(false);
  const [isGridOpen, setGridOpen] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const initialSerializedRef = useRef(serializeOperationsUrlState(initialUrlState));
  const view = getThemeView(graph, themeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const operationRows = buildOperationRows(view);
  const filteredOperationRows = filterOperationRows(operationRows, searchQuery);
  const validSelectedId = resolveSelectableId(view, selectedId);
  const activeId = resolveActiveId(view, validSelectedId);
  const detail = getDetailView(graph, activeId);
  const mapModel = buildJapanMapCanvasModel(graph, view, activeId);
  const themePalette = getThemePalette(themeId);
  const statusPalette = getStatusPalette();
  const metrics = buildOperationsMetrics(view, filteredOperationRows);
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
  const leftOffset = isInboxOpen ? 360 : 88;
  const rightOffset = isEvidenceOpen ? 380 : 88;

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
    <main className="relative h-screen overflow-hidden text-slate-100" style={shellStyle}>
      <JapanMainMap
        activeId={activeId}
        detail={detail}
        gridExpanded={isGridOpen}
        mapMode={mapMode}
        metrics={metrics}
        model={mapModel}
        leftOffset={leftOffset}
        metricsExpanded={metricsExpanded}
        onMapModeChange={setMapMode}
        onToggleMetrics={() => setMetricsExpanded((value) => !value)}
        onSelect={setSelectedId}
        resultCount={filteredOperationRows.length}
        rightOffset={rightOffset}
        statusPalette={statusPalette}
        themePalette={themePalette}
        themeId={themeId}
      />

      <div className="absolute inset-y-4 left-4 z-30 hidden lg:block" style={{ width: isInboxOpen ? 320 : 48 }}>
        <MapInboxPanel
          activeId={activeId}
          collapsed={!isInboxOpen}
          query={searchQuery}
          rows={filteredOperationRows}
          statusPalette={statusPalette}
          themePalette={themePalette}
          themeId={themeId}
          view={view}
          onQueryChange={setSearchQuery}
          onSelect={setSelectedId}
        onToggleCollapsed={() => setInboxOpen((value) => !value)}
        onThemeChange={handleThemeChange}
      />
      </div>

      <div className="absolute inset-y-4 right-4 z-30 hidden lg:block" style={{ width: isEvidenceOpen ? 360 : 48 }}>
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

      <div className="absolute bottom-4 z-30 hidden lg:block" style={{ left: leftOffset, right: rightOffset }}>
        <OperationsSignalTable
          activeId={activeId}
          collapsed={!isGridOpen}
          onSelect={setSelectedId}
          rows={filteredOperationRows}
          statusPalette={statusPalette}
          themePalette={themePalette}
          onToggleCollapsed={() => setGridOpen((value) => !value)}
        />
      </div>

      <div className="absolute left-4 right-4 top-20 z-30 space-y-4 lg:hidden">
        <MapInboxPanel
          activeId={activeId}
          collapsed={false}
          query={searchQuery}
          rows={filteredOperationRows}
          statusPalette={statusPalette}
          themePalette={themePalette}
          themeId={themeId}
          view={view}
          onQueryChange={setSearchQuery}
          onSelect={setSelectedId}
          onToggleCollapsed={() => undefined}
          onThemeChange={handleThemeChange}
        />
        <OperationsSignalTable
          activeId={activeId}
          collapsed={false}
          onSelect={setSelectedId}
          rows={filteredOperationRows}
          statusPalette={statusPalette}
          themePalette={themePalette}
          onToggleCollapsed={() => undefined}
        />
        <EvidencePanel
          collapsed={false}
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
