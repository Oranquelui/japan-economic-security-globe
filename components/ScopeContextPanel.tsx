"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import type { SemanticLayerId, WorkspacePresentation } from "../types/presentation";
import type { SourceDocument } from "../types/semantic";
import { MapLegend } from "./MapLegend";
import { SemanticLayerDeck } from "./SemanticLayerDeck";

interface ScopeContextPanelProps {
  activeLayerId: SemanticLayerId;
  onLayerChange: (id: SemanticLayerId) => void;
  onOpenComparison: () => void;
  onOpenSignals: () => void;
  sources: SourceDocument[];
  themePalette: ThemePalette;
  workspace: WorkspacePresentation;
}

export function ScopeContextPanel({
  activeLayerId,
  onLayerChange,
  onOpenComparison,
  onOpenSignals,
  sources,
  themePalette,
  workspace
}: ScopeContextPanelProps) {
  const requestedLayer = workspace.layers.find((layer) => layer.id === activeLayerId);
  const activeLayer = requestedLayer?.available
    ? requestedLayer
    : workspace.layers.find((layer) => layer.available);
  const resolvedActiveLayerId = activeLayer?.id;

  return (
    <div data-testid="scope-context-panel" className="h-full overflow-y-auto px-4 py-5">
      <div>
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: themePalette.accentText }}>
          テーマ / 対象範囲
        </div>
        <h2 className="mt-2 text-lg font-semibold" style={{ color: themePalette.textPrimary }}>{workspace.scope.title}</h2>
        <p className="mt-2 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>{workspace.scope.description}</p>
      </div>

      <section aria-label="対象範囲の要約" className="mt-5 grid grid-cols-2 gap-2">
        <SummaryCard label={workspace.scope.coverage.label} value={workspace.scope.coverage.value} themePalette={themePalette} />
        <SummaryCard label="対象期間" value={workspace.scope.periodLabel} themePalette={themePalette} />
        {workspace.scope.metrics.slice(0, 4).map((metric) => (
          <SummaryCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            detail={[metric.unit, metric.periodLabel].filter(Boolean).join(" / ")}
            themePalette={themePalette}
          />
        ))}
      </section>

      <div className="mt-6 border-t pt-5" style={{ borderColor: themePalette.borderSubtle }}>
        <SemanticLayerDeck
          activeLayerId={resolvedActiveLayerId}
          layers={workspace.layers}
          onLayerChange={onLayerChange}
          themePalette={themePalette}
        />
      </div>

      {activeLayer ? (
        <div className="mt-5">
          <MapLegend
            legend={activeLayer.legend}
            periodLabel={activeLayer.periodLabel}
            sourceIds={activeLayer.sourceIds}
            sources={sources}
            themePalette={themePalette}
          />
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <SecondaryAction label="シグナルを見る" onClick={onOpenSignals} themePalette={themePalette} />
        <SecondaryAction label="比較する" onClick={onOpenComparison} themePalette={themePalette} />
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
    <div className="rounded-xl border p-3" style={{ borderColor: themePalette.borderSubtle, background: themePalette.surfacePanelElevated }}>
      <div className="text-[0.6rem]" style={{ color: themePalette.textMuted }}>{label}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color: themePalette.textPrimary }}>{value}</div>
      {detail ? <div className="mt-1 text-[0.6rem]" style={{ color: themePalette.textMuted }}>{detail}</div> : null}
    </div>
  );
}

function SecondaryAction({
  label,
  onClick,
  themePalette
}: {
  label: string;
  onClick: () => void;
  themePalette: ThemePalette;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border px-3 py-2.5 text-xs font-semibold transition"
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
