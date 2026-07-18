"use client";

import { useEffect, useRef, useState } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import type { LayerDefinition, SemanticLayerId } from "../types/presentation";

interface SemanticLayerDeckProps {
  activeLayerId?: SemanticLayerId;
  layers: LayerDefinition[];
  onLayerChange: (id: SemanticLayerId) => void;
  themePalette: ThemePalette;
}

export function SemanticLayerDeck({
  activeLayerId,
  layers,
  onLayerChange,
  themePalette
}: SemanticLayerDeckProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const availableLayers = layers.filter((layer) => layer.available);
  const defaultRovingLayerId = availableLayers.some((layer) => layer.id === activeLayerId)
    ? activeLayerId
    : availableLayers[0]?.id;
  const [rovingLayerId, setRovingLayerId] = useState<SemanticLayerId | undefined>(defaultRovingLayerId);

  useEffect(() => {
    setRovingLayerId(defaultRovingLayerId);
  }, [defaultRovingLayerId]);

  function moveFocus(fromIndex: number, direction: 1 | -1) {
    if (!availableLayers.length) {
      return;
    }

    let nextIndex = fromIndex;
    do {
      nextIndex = (nextIndex + direction + layers.length) % layers.length;
    } while (!layers[nextIndex]?.available && nextIndex !== fromIndex);

    const nextLayer = layers[nextIndex];
    if (!nextLayer?.available) {
      return;
    }

    setRovingLayerId(nextLayer.id);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <section aria-labelledby="semantic-layer-heading">
      <div
        id="semantic-layer-heading"
        className="font-mono text-[0.6rem] uppercase tracking-[0.24em]"
        style={{ color: themePalette.textMuted }}
      >
        表示レイヤー
      </div>
      <div role="group" aria-label="表示レイヤー" className="mt-3 space-y-2">
        {layers.map((layer, index) => {
          const active = layer.available && layer.id === activeLayerId;

          return (
            <button
              key={layer.id}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              aria-label={layer.label}
              aria-pressed={active}
              disabled={!layer.available}
              tabIndex={layer.available && layer.id === rovingLayerId ? 0 : -1}
              onFocus={() => {
                if (layer.available) {
                  setRovingLayerId(layer.id);
                }
              }}
              onClick={() => onLayerChange(layer.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  moveFocus(index, 1);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveFocus(index, -1);
                } else if ((event.key === "Enter" || event.key === " ") && layer.available) {
                  event.preventDefault();
                  onLayerChange(layer.id);
                }
              }}
              className="w-full rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55"
              style={
                active
                  ? {
                      borderColor: themePalette.accent,
                      background: themePalette.accentSoft,
                      color: themePalette.textPrimary
                    }
                  : {
                      borderColor: themePalette.borderSubtle,
                      background: themePalette.surfacePanelElevated,
                      color: themePalette.textPrimary
                    }
              }
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{layer.label}</span>
                {!layer.available ? (
                  <span className="rounded-full border px-2 py-0.5 text-[0.62rem]" style={{ borderColor: themePalette.borderSubtle, color: themePalette.textMuted }}>
                    データなし
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-[0.7rem] leading-5" style={{ color: themePalette.textMuted }}>
                {layer.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
