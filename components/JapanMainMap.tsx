"use client";

import { useState, type ReactNode } from "react";

import type { DetailViewModel } from "../types/presentation";
import type { OperationMetric } from "../lib/presentation/metrics";
import type { JapanMapCanvasModel } from "../lib/presentation/map-canvas";
import type { OperationMapMode } from "../lib/presentation/operations";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { localizeAnyLabel, localizeKind, localizeSummary } from "../lib/presentation/japanese";
import { resolveToneColor } from "../lib/presentation/palette";
import { JapanOperationsMapCanvas } from "./JapanOperationsMapCanvas";

interface JapanMainMapProps {
  activeId: string;
  detail: DetailViewModel;
  focusTargetId: string | null;
  gridExpanded: boolean;
  leftOffset: number;
  mapMode: OperationMapMode;
  metricsExpanded: boolean;
  metrics: OperationMetric[];
  model: JapanMapCanvasModel;
  onToggleMetrics: () => void;
  onSelect: (id: string) => void;
  rightOffset: number;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

export function JapanMainMap({
  activeId,
  detail,
  focusTargetId,
  gridExpanded,
  leftOffset,
  mapMode,
  metricsExpanded,
  metrics,
  model,
  onToggleMetrics,
  onSelect,
  rightOffset,
  statusPalette,
  themePalette
}: JapanMainMapProps) {
  const [command, setCommand] = useState<{ nonce: number; type: "recenter" | "zoomIn" | "zoomOut" }>();

  return (
    <section className="absolute inset-0 overflow-hidden" style={{ background: themePalette.surfaceCanvas }}>
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
          background:
            "radial-gradient(circle at 50% 8%, rgba(255,255,255,0.22), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(148,163,184,0.12))"
        }}
      />

      <div className="absolute top-[108px] z-20" style={{ left: leftOffset + 12, right: rightOffset }}>
        {metricsExpanded ? (
          <div className="grid gap-3 md:grid-cols-5">
            {metrics.map((metric) => {
              const metricColor = resolveToneColor(metric.tone, themePalette, statusPalette);

              return (
                <div
                  key={metric.id}
                  className="rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md"
                  style={{
                    background: themePalette.surfacePanel,
                    borderColor: themePalette.borderSubtle
                  }}
                >
                  <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
                    {metric.label}
                  </div>
                  <div className="mt-2 text-[1.6rem] font-semibold leading-none" style={{ color: metricColor }}>
                    {metric.value}
                  </div>
                  <div className="mt-2 line-clamp-2 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
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
            {metrics.map((metric) => {
              const metricColor = resolveToneColor(metric.tone, themePalette, statusPalette);

              return (
                <span
                  key={metric.id}
                  className="rounded-full border px-2.5 py-1 text-[0.7rem]"
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
              className="rounded-full border px-2.5 py-1 text-[0.7rem] transition"
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

      {metricsExpanded ? (
        <button
          type="button"
          onClick={onToggleMetrics}
          className="absolute right-4 top-[108px] z-20 rounded-xl border px-3 py-2 text-xs transition"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanel,
            color: themePalette.textMuted
          }}
        >
          要約
        </button>
      ) : null}

      <div className="absolute left-4 top-[166px] z-20 flex flex-col gap-2" style={{ left: leftOffset }}>
        <MapControlButton label="+" ariaLabel="地図を拡大" onClick={() => setCommand({ nonce: Date.now(), type: "zoomIn" })} />
        <MapControlButton label="-" ariaLabel="地図を縮小" onClick={() => setCommand({ nonce: Date.now(), type: "zoomOut" })} />
        <MapControlButton label="⌖" ariaLabel="日本中心に戻す" onClick={() => setCommand({ nonce: Date.now(), type: "recenter" })} />
      </div>

      <div className="absolute z-20" style={{ left: leftOffset, right: rightOffset, bottom: gridExpanded ? 312 : 88 }}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md"
          style={{
            background: themePalette.surfacePanel,
            borderColor: themePalette.borderSubtle
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
              選択中
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="truncate text-base font-semibold text-white">{localizeAnyLabel(detail.id, detail.label)}</div>
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                {localizeKind(detail.kind)}
              </InfoChip>
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                {detail.sources.length} 出典
              </InfoChip>
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textMuted}>
                {detail.relatedEntities.length} 関連
              </InfoChip>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {model.foreignWindow ? (
              <InfoChip borderColor={themePalette.borderSubtle} fill={themePalette.surfacePanelElevated} textColor={themePalette.textPrimary}>
                対外関係 {model.foreignWindow.entities.length}
              </InfoChip>
            ) : null}
            <div className="max-w-[340px] text-right text-xs leading-5" style={{ color: themePalette.textMuted }}>
              {localizeSummary(detail.id, detail.summary)}
            </div>
          </div>
          {model.foreignWindow ? (
            <div className="mt-1 flex w-full flex-wrap gap-2">
              {model.foreignWindow.entities.map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => onSelect(entity.id)}
                  className="rounded-full border px-3 py-1.5 text-xs transition hover:text-white"
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
