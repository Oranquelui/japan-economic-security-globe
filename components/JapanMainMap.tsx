"use client";

import { useState, type ReactNode } from "react";

import type { DetailViewModel } from "../types/presentation";
import type { OperationMetric } from "../lib/presentation/metrics";
import type { JapanMapCanvasModel } from "../lib/presentation/map-canvas";
import type { OperationMapMode } from "../lib/presentation/operations";
import { getOperationModeLabel } from "../lib/presentation/operations";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { localizeAnyLabel, localizeKind, localizeSummary } from "../lib/presentation/japanese";
import { resolveToneColor } from "../lib/presentation/palette";
import { JapanOperationsMapCanvas } from "./JapanOperationsMapCanvas";

interface JapanMainMapProps {
  activeId: string;
  detail: DetailViewModel;
  focusTargetId: string | null;
  mapMode: OperationMapMode;
  metricsExpanded: boolean;
  metrics: OperationMetric[];
  model: JapanMapCanvasModel;
  onMapModeChange: (mode: OperationMapMode) => void;
  onToggleMetrics: () => void;
  onSelect: (id: string) => void;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

export function JapanMainMap({
  activeId,
  detail,
  focusTargetId,
  mapMode,
  metricsExpanded,
  metrics,
  model,
  onMapModeChange,
  onToggleMetrics,
  onSelect,
  statusPalette,
  themePalette
}: JapanMainMapProps) {
  const [command, setCommand] = useState<{ nonce: number; type: "recenter" | "zoomIn" | "zoomOut" }>();

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden rounded-2xl border shadow-2xl shadow-black/15"
      style={{
        background: themePalette.surfaceCanvas,
        borderColor: themePalette.borderSubtle
      }}
    >
      <JapanOperationsMapCanvas
        activeId={activeId}
        command={command}
        focusTargetId={focusTargetId}
        mapMode={mapMode}
        model={model}
        onSelect={onSelect}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
        }}
      />

      {metrics.length ? (
        <div className="absolute left-4 right-[280px] top-4 z-20">
          {metricsExpanded ? (
            <div className="grid gap-2 md:grid-cols-4">
              {metrics.slice(0, 4).map((metric) => {
                const metricColor = resolveToneColor(metric.tone, themePalette, statusPalette);

                return (
                  <div
                    key={metric.id}
                    className="rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-md"
                    style={{
                      background: themePalette.surfacePanel,
                      borderColor: themePalette.borderSubtle
                    }}
                  >
                    <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
                      {metric.label}
                    </div>
                    <div className="mt-1.5 text-[1.15rem] font-semibold leading-none" style={{ color: metricColor }}>
                      {metric.value}
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-[0.64rem] leading-4" style={{ color: themePalette.textMuted }}>
                      {metric.description}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 shadow-2xl backdrop-blur-md"
              style={{
                background: themePalette.surfacePanel,
                borderColor: themePalette.borderSubtle
              }}
            >
              {metrics.slice(0, 4).map((metric) => {
                const metricColor = resolveToneColor(metric.tone, themePalette, statusPalette);

                return (
                  <span
                    key={metric.id}
                    className="rounded-full border px-2.5 py-1 text-[0.66rem]"
                    style={{
                      borderColor: `${metricColor}44`,
                      background: `${metricColor}14`,
                      color: metricColor
                    }}
                  >
                    {metric.label} {metric.value}
                  </span>
                );
              })}
              <button
                type="button"
                onClick={onToggleMetrics}
                className="rounded-full border px-2.5 py-1 text-[0.66rem] transition"
                style={{
                  borderColor: themePalette.borderSubtle,
                  background: themePalette.surfacePanelElevated,
                  color: themePalette.textMuted
                }}
              >
                詳細
              </button>
            </div>
          )}
        </div>
      ) : null}

      {metricsExpanded && metrics.length ? (
        <button
          type="button"
          onClick={onToggleMetrics}
          className="absolute right-4 top-4 z-20 rounded-xl border px-3 py-2 text-xs transition"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanel,
            color: themePalette.textMuted
          }}
        >
          要約
        </button>
      ) : null}

      <div className="absolute right-4 top-4 z-20">
        <div
          className="rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-md"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanel
          }}
        >
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            表示レイヤー
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["point", "cluster", "choropleth", "route", "static"] as OperationMapMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onMapModeChange(mode)}
                className="rounded-lg border px-3 py-2 text-xs transition"
                style={
                  mode === mapMode
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
                {getOperationModeLabel(mode)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-4 top-16 z-20 flex flex-col gap-2">
        <MapControlButton label="+" ariaLabel="地図を拡大" onClick={() => setCommand({ nonce: Date.now(), type: "zoomIn" })} />
        <MapControlButton label="-" ariaLabel="地図を縮小" onClick={() => setCommand({ nonce: Date.now(), type: "zoomOut" })} />
        <MapControlButton label="⌖" ariaLabel="日本中心に戻す" onClick={() => setCommand({ nonce: Date.now(), type: "recenter" })} />
      </div>

      <div className="absolute bottom-4 left-4 z-20 max-w-[360px]">
        <div
          className="rounded-xl border px-3.5 py-2.5 shadow-xl backdrop-blur-md"
          style={{
            background: themePalette.surfacePanel,
            borderColor: themePalette.borderSubtle
          }}
        >
          <div className="min-w-0">
            <div className="font-mono text-[0.58rem] uppercase tracking-[0.24em]" style={{ color: themePalette.textMuted }}>
              選択
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="truncate text-[0.9rem] font-semibold text-white">{localizeAnyLabel(detail.id, detail.label)}</div>
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                {localizeKind(detail.kind)}
              </InfoChip>
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                {detail.sources.length} 出典
              </InfoChip>
            </div>
            <div className="mt-1 truncate text-[0.64rem] leading-4" style={{ color: themePalette.textMuted }}>
              {localizeSummary(detail.id, detail.summary)}
            </div>
          </div>
          {model.foreignWindow ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textPrimary}>
                対外関係 {model.foreignWindow.entities.length}
              </InfoChip>
              {model.foreignWindow.entities.slice(0, 2).map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => onSelect(entity.id)}
                  className="rounded-full border px-2.5 py-1 text-[0.68rem] transition hover:text-white"
                  style={{
                    borderColor: themePalette.borderSubtle,
                    background: themePalette.surfacePanelElevated,
                    color: themePalette.textPrimary
                  }}
                >
                    {entity.flagEmoji ? `${entity.flagEmoji} ` : ""}
                    {entity.label}
                  </button>
              ))}
              {model.foreignWindow.entities.length > 2 ? (
                <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                  +{model.foreignWindow.entities.length - 2}
                </InfoChip>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MapControlButton({ ariaLabel, label, onClick }: { ariaLabel: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid h-12 w-12 place-items-center rounded-lg border text-xl text-slate-200 shadow-lg backdrop-blur-md transition hover:text-white"
      style={{ borderColor: "var(--ops-border-subtle)", background: "var(--ops-surface-panel)" }}
    >
      {label}
    </button>
  );
}

function InfoChip({
  borderColor,
  children,
  fill,
  textColor
}: {
  borderColor: string;
  children: ReactNode;
  fill: string;
  textColor: string;
}) {
  return (
    <span className="rounded-full border px-2.5 py-1 text-[0.68rem]" style={{ borderColor, background: fill, color: textColor }}>
      {children}
    </span>
  );
}
