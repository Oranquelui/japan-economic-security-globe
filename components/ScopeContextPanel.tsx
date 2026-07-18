"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import type { SemanticLayerId, WorkspacePresentation } from "../types/presentation";
import type { SourceDocument } from "../types/semantic";
import { MapLegend } from "./MapLegend";
import { SemanticLayerDeck } from "./SemanticLayerDeck";

interface ScopeContextPanelProps {
  activeLayerId: SemanticLayerId;
  comparisonAvailable: boolean;
  onLayerChange: (id: SemanticLayerId) => void;
  onOpenComparison: () => void;
  onOpenSignals: () => void;
  sources: SourceDocument[];
  themePalette: ThemePalette;
  workspace: WorkspacePresentation;
}

export function ScopeContextPanel({
  activeLayerId,
  comparisonAvailable,
  onLayerChange,
  onOpenComparison,
  onOpenSignals,
  themePalette,
  workspace
}: ScopeContextPanelProps) {
  const requestedLayer = workspace.layers.find((layer) => layer.id === activeLayerId);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : workspace.layers.find((layer) => layer.available);
  const resolvedActiveLayerId = activeLayer?.id;

  return (
    <div data-testid="scope-context-panel" className="h-full overflow-y-auto px-3 py-3">
      <div>
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: themePalette.accentText }}>
          テーマ / 対象範囲
        </div>
        <h2 className="mt-1 text-base font-semibold" style={{ color: themePalette.textPrimary }}>{workspace.scope.title}</h2>
        <p className="mt-1 text-[0.68rem] leading-4" style={{ color: themePalette.textMuted }}>{workspace.scope.description}</p>
      </div>

      <section aria-label="対象範囲の要約" className="mt-3 grid grid-cols-2 gap-2">
        <SummaryCard label={workspace.scope.coverage.label} value={workspace.scope.coverage.value} themePalette={themePalette} />
        <SummaryCard label="対象期間" value={workspace.scope.periodLabel} themePalette={themePalette} />
        {workspace.scope.metrics.slice(0, 2).map((metric) => (
          <SummaryCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            detail={[metric.unit, metric.periodLabel].filter(Boolean).join(" / ")}
            themePalette={themePalette}
          />
        ))}
      </section>

      <div className="mt-3 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
        <SemanticLayerDeck
          activeLayerId={resolvedActiveLayerId}
          layers={workspace.layers}
          onLayerChange={onLayerChange}
          themePalette={themePalette}
        />
      </div>

      {activeLayer ? (
        <div className="mt-3">
          <MapLegend
            legend={activeLayer.legend}
            mapEncodingDescription={activeLayer.mapEncodingDescription}
            themePalette={themePalette}
          />
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SecondaryAction actionId="signals" label="シグナルを見る" onClick={onOpenSignals} themePalette={themePalette} />
        <SecondaryAction
          actionId="comparison"
          disabled={!comparisonAvailable}
          label={comparisonAvailable ? "比較する" : "比較可能な系列なし"}
          onClick={onOpenComparison}
          themePalette={themePalette}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  detail,
  label,
  themePalette,
  value
}: {
  detail?: string;
  label: string;
  themePalette: ThemePalette;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-2" style={{ borderColor: themePalette.borderSubtle, background: themePalette.surfacePanelElevated }}>
      <div className="text-[0.6rem]" style={{ color: themePalette.textMuted }}>{label}</div>
      <div className="mt-0.5 text-xs font-semibold" style={{ color: themePalette.textPrimary }}>{value}</div>
      {detail ? <div className="mt-0.5 text-[0.56rem]" style={{ color: themePalette.textMuted }}>{detail}</div> : null}
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
