"use client";

import { useEffect, useState, type CSSProperties } from "react";

import type { JapanMapCanvasModel } from "../lib/presentation/map-canvas";
import type { OperationMapMode } from "../lib/presentation/operations";
import { getOperationModeLabel } from "../lib/presentation/operations";
import type { RankingExplanationViewModel } from "../lib/ranking/explain";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import type { DetailViewModel, MapHoverViewModel, MapPopupAnchor } from "../types/presentation";
import type { WatchOverlayItemViewModel } from "../lib/presentation/watch-overlays";
import { JapanOperationsMapCanvas } from "./JapanOperationsMapCanvas";
import { MapDetailPopup } from "./MapDetailPopup";
import { MapHoverCard } from "./MapHoverCard";

interface JapanMainMapProps {
  activeId: string;
  detailPopup?: {
    anchor?: MapPopupAnchor | null;
    detail: DetailViewModel;
    rankingExplanation?: RankingExplanationViewModel | null;
    routeStatusLabel?: string | null;
    themeTitle: string;
  } | null;
  focusTargetId: string | null;
  mapDisclosure?: {
    body: string;
    title: string;
  } | null;
  mapMode: OperationMapMode;
  model: JapanMapCanvasModel;
  onMapModeChange?: (mode: OperationMapMode) => void;
  onOpenEvidence?: () => void;
  overlayInsets?: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  onCloseDetail?: () => void;
  onSelect: (id: string, anchor?: MapPopupAnchor) => void;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  watchOverlays?: WatchOverlayItemViewModel[];
}

const MAP_MODES: OperationMapMode[] = ["point", "cluster", "choropleth", "route", "static"];

export function JapanMainMap({
  activeId,
  detailPopup = null,
  focusTargetId,
  mapDisclosure = null,
  mapMode,
  model,
  onMapModeChange,
  onOpenEvidence,
  overlayInsets = {
    top: 16,
    right: 16,
    bottom: 16,
    left: 16
  },
  onCloseDetail,
  onSelect,
  statusPalette,
  themePalette,
  watchOverlays = []
}: JapanMainMapProps) {
  const [command, setCommand] = useState<{ nonce: number; type: "recenter" | "zoomIn" | "zoomOut" }>();
  const [hover, setHover] = useState<MapHoverViewModel | null>(null);

  useEffect(() => {
    setHover(null);
  }, [mapMode, model]);

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden"
      style={{
        background: themePalette.surfaceCanvas,
        "--map-overlay-bottom": `${overlayInsets.bottom}px`,
        "--map-overlay-left": `${overlayInsets.left}px`
      } as CSSProperties}
    >
      <JapanOperationsMapCanvas
        activeId={activeId}
        command={command}
        fitInsets={overlayInsets}
        focusTargetId={focusTargetId}
        mapMode={mapMode}
        model={model}
        onHover={setHover}
        onSelect={onSelect}
        statusPalette={statusPalette}
        themePalette={themePalette}
      />
      {hover ? <MapHoverCard hover={hover} themePalette={themePalette} /> : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
        }}
      />
      <div
        className="absolute z-20 flex flex-col gap-2"
        style={{
          left: overlayInsets.left,
          top: overlayInsets.top
        }}
      >
        <MapControlButton label="+" ariaLabel="地図を拡大" onClick={() => setCommand({ nonce: Date.now(), type: "zoomIn" })} />
        <MapControlButton label="-" ariaLabel="地図を縮小" onClick={() => setCommand({ nonce: Date.now(), type: "zoomOut" })} />
        <MapControlButton label="⌖" ariaLabel="日本中心に戻す" onClick={() => setCommand({ nonce: Date.now(), type: "recenter" })} />
      </div>
      {onMapModeChange ? (
        <div
          data-testid="map-layer-controls"
          className="absolute z-20 flex max-w-[min(36rem,calc(100%-2rem))] flex-wrap items-center gap-1 rounded-[14px] border px-2 py-1.5 shadow-xl backdrop-blur-xl"
          style={{
            left: overlayInsets.left + 56,
            top: overlayInsets.top,
            borderColor: themePalette.borderSubtle,
            background: "rgba(8, 12, 20, 0.82)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)"
          }}
        >
          <span className="ops-label px-1.5" style={{ color: themePalette.textMuted }}>
            表示レイヤー
          </span>
          {MAP_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onMapModeChange(mode)}
              className="rounded-[10px] border px-2.5 py-1 text-[0.68rem] transition"
              style={
                mode === mapMode
                  ? {
                      borderColor: `${themePalette.accent}99`,
                      background: themePalette.accentSoft,
                      color: themePalette.textPrimary,
                      boxShadow: `0 0 0 1px ${themePalette.accent}22`
                    }
                  : {
                      borderColor: "transparent",
                      background: "rgba(255,255,255,0.03)",
                      color: themePalette.textMuted
                    }
              }
            >
              {getOperationModeLabel(mode)}
            </button>
          ))}
        </div>
      ) : null}
      {watchOverlays.length ? (
        <aside
          data-testid="map-watch-overlays"
          className="absolute z-20 max-w-sm rounded-2xl border p-4 shadow-xl backdrop-blur-xl"
          style={{
            left: overlayInsets.left + 56,
            bottom: overlayInsets.bottom,
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanel
          }}
        >
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
            近接監視
          </div>
          <div className="mt-3 space-y-3">
            {watchOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="rounded-xl border p-3"
                style={{
                  borderColor: themePalette.borderSubtle,
                  background: themePalette.surfacePanelElevated
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <MapOverlayChip themePalette={themePalette}>{overlay.freshnessLabel}</MapOverlayChip>
                  <MapOverlayChip themePalette={themePalette}>{overlay.trustLabel}</MapOverlayChip>
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{overlay.title}</div>
                <p className="mt-1 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>
                  {overlay.summary}
                </p>
                <div className="mt-2 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                  {overlay.disclosureLabel}
                </div>
              </div>
            ))}
          </div>
        </aside>
      ) : null}
      {mapDisclosure ? (
        <aside
          data-testid="map-disclosure"
          className="pointer-events-none absolute z-20 max-w-xs rounded-xl border px-3 py-2 shadow-lg backdrop-blur-xl"
          style={{
            left: overlayInsets.left + 56,
            top: overlayInsets.top,
            borderColor: themePalette.borderSubtle,
            background: "color-mix(in srgb, var(--ops-surface-panel) 92%, rgba(9,13,18,0.88) 8%)"
          }}
        >
          <div className="font-mono text-[0.56rem] uppercase tracking-[0.26em]" style={{ color: themePalette.textMuted }}>
            {mapDisclosure.title}
          </div>
          <div className="mt-1 text-[0.68rem] leading-5 text-slate-100">{mapDisclosure.body}</div>
        </aside>
      ) : null}
      {detailPopup ? (
        <div
          className="fixed inset-x-0 z-50 px-3 xl:hidden"
          style={{
            bottom: overlayInsets.bottom
          }}
        >
          <MapDetailPopup
            detail={detailPopup.detail}
            onClose={onCloseDetail ?? (() => undefined)}
            onOpenEvidence={onOpenEvidence}
            onSelect={onSelect}
            rankingExplanation={detailPopup.rankingExplanation}
            routeStatusLabel={detailPopup.routeStatusLabel}
            statusPalette={statusPalette}
            themePalette={themePalette}
            themeTitle={detailPopup.themeTitle}
          />
        </div>
      ) : null}
    </section>
  );
}

function MapControlButton({ ariaLabel, label, onClick }: { ariaLabel: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="ops-control grid h-10 w-10 place-items-center text-base shadow-lg backdrop-blur-xl"
      style={{
        borderColor: "var(--ops-border-subtle)",
        background: "rgba(8, 12, 20, 0.82)",
        color: "var(--ops-text-primary)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)"
      }}
    >
      {label}
    </button>
  );
}

function MapOverlayChip({
  children,
  themePalette
}: {
  children: string;
  themePalette: ThemePalette;
}) {
  return (
    <span
      className="rounded-full border px-2 py-1 text-[0.62rem]"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel,
        color: themePalette.textMuted
      }}
    >
      {children}
    </span>
  );
}
