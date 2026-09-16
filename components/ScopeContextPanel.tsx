"use client";

import type { ReactNode } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel } from "../lib/presentation/japanese";
import type {
  ActiveLayerSummary,
  SemanticLayerId,
  WorkspacePresentation
} from "../types/presentation";
import type { ThemeId } from "../types/semantic";
import { ActiveLayerSummaryPanel } from "./ActiveLayerSummaryPanel";
import { SemanticLayerDeck } from "./SemanticLayerDeck";

interface ScopeContextPanelProps {
  activeLayerId: SemanticLayerId;
  activeSummary: ActiveLayerSummary;
  comparisonAvailable: boolean;
  logisticsRouteOverview?: ReactNode;
  readingOverview?: ReactNode;
  onLayerChange: (id: SemanticLayerId) => void;
  onOpenComparison: () => void;
  onOpenSignals: () => void;
  onThemeChange: (id: ThemeId) => void;
  themeId: ThemeId;
  themeIds: readonly ThemeId[];
  themePalette: ThemePalette;
  workspace: WorkspacePresentation;
}

export function ScopeContextPanel({
  activeLayerId,
  activeSummary,
  comparisonAvailable,
  logisticsRouteOverview,
  readingOverview,
  onLayerChange,
  onOpenComparison,
  onOpenSignals,
  onThemeChange,
  themeId,
  themeIds,
  themePalette,
  workspace
}: ScopeContextPanelProps) {
  const requestedLayer = workspace.layers.find((layer) => layer.id === activeLayerId);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : workspace.layers.find((layer) => layer.available);
  const resolvedActiveLayerId = activeLayer?.id;
  const resolvedComparisonAvailable = Boolean(activeLayer) && comparisonAvailable;

  return (
    <div data-testid="scope-context-panel" className="h-full min-w-0 overflow-y-auto px-5 py-5 break-words">
      <label className="block">
        <span
          className="font-mono text-[0.6rem] uppercase tracking-[0.28em]"
          style={{ color: themePalette.accentText }}
        >
          テーマ
        </span>
        <select
          aria-label="テーマ"
          value={themeId}
          onChange={(event) => {
            const nextThemeId = event.target.value as ThemeId;
            if (nextThemeId !== themeId) {
              onThemeChange(nextThemeId);
            }
          }}
          className="mt-1.5 w-full rounded-lg border px-2.5 py-2 text-sm font-semibold"
          style={{
            borderColor: themePalette.borderStrong,
            background: themePalette.surfacePanelElevated,
            color: themePalette.textPrimary
          }}
        >
          {themeIds.map((id) => (
            <option key={id} value={id}>{getThemeLabel(id).label}</option>
          ))}
        </select>
      </label>

      <div className="mt-3 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
        <SemanticLayerDeck
          activeLayerId={resolvedActiveLayerId}
          layers={workspace.layers}
          onLayerChange={onLayerChange}
          themePalette={themePalette}
        />
      </div>

      {readingOverview}

      {logisticsRouteOverview ? (
        <div data-testid="scope-logistics-route-overview" className="mt-3">
          {logisticsRouteOverview}
        </div>
      ) : null}

      {activeLayer ? (
        <details className="mt-4" open={!readingOverview}>
          <summary className="cursor-pointer py-2 text-xs text-slate-300">凡例・数値の定義・出典</summary>
        <div className="mt-3">
          <ActiveLayerSummaryPanel
            legend={activeLayer.legend}
            summary={activeSummary}
            themePalette={themePalette}
          />
        </div>
        </details>
      ) : null}


      <div className="mt-3 grid grid-cols-2 gap-2">
        <SecondaryAction actionId="signals" label="シグナルを見る" onClick={onOpenSignals} themePalette={themePalette} />
        <SecondaryAction
          actionId="comparison"
          disabled={!resolvedComparisonAvailable}
          label={resolvedComparisonAvailable ? "比較する" : "比較可能な系列なし"}
          onClick={onOpenComparison}
          themePalette={themePalette}
        />
      </div>
    </div>
  );
}

function SecondaryAction({
  actionId,
  disabled = false,
  label,
  onClick,
  themePalette
}: {
  actionId: "comparison" | "signals";
  disabled?: boolean;
  label: string;
  onClick: () => void;
  themePalette: ThemePalette;
}) {
  return (
    <button
      type="button"
      data-secondary-action={actionId}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55"
      style={{
        borderColor: themePalette.borderStrong,
        background: themePalette.surfacePanelElevated,
        color: themePalette.textPrimary
      }}
    >
      {label}
    </button>
  );
}
