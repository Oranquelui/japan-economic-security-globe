"use client";

import { useState } from "react";

import type { JapanMapCanvasModel } from "../lib/presentation/map-canvas";
import type { OperationMapMode } from "../lib/presentation/operations";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { JapanOperationsMapCanvas } from "./JapanOperationsMapCanvas";

interface JapanMainMapProps {
  activeId: string;
  focusTargetId: string | null;
  mapMode: OperationMapMode;
  model: JapanMapCanvasModel;
  overlayInsets?: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  onSelect: (id: string) => void;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
}

export function JapanMainMap({
  activeId,
  focusTargetId,
  mapMode,
  model,
  overlayInsets = {
    top: 16,
    right: 16,
    bottom: 16,
    left: 16
  },
  onSelect,
  statusPalette,
  themePalette
}: JapanMainMapProps) {
  const [command, setCommand] = useState<{ nonce: number; type: "recenter" | "zoomIn" | "zoomOut" }>();

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden"
      style={{
        background: themePalette.surfaceCanvas
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
    </section>
  );
}

function MapControlButton({ ariaLabel, label, onClick }: { ariaLabel: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid h-10 w-10 place-items-center rounded-md border text-lg text-slate-200 shadow-md backdrop-blur-md transition hover:text-white"
      style={{ borderColor: "var(--ops-border-subtle)", background: "var(--ops-surface-panel)" }}
    >
      {label}
    </button>
  );
}
