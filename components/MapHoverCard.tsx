import { useLayoutEffect, useRef, useState } from "react";

import type { ThemePalette } from "../lib/presentation/palette";
import type { MapHoverViewModel } from "../types/presentation";

interface MapHoverCardProps {
  hover: MapHoverViewModel;
  themePalette: ThemePalette;
}

export function MapHoverCard({ hover, themePalette }: MapHoverCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(() => ({ left: hover.x + 14, top: hover.y + 14 }));

  useLayoutEffect(() => {
    const card = cardRef.current;
    const bounds = card?.parentElement;

    if (!card || !bounds) {
      return;
    }

    const boundsRect = bounds.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const width = cardRect.width || card.offsetWidth || 224;
    const height = cardRect.height || card.offsetHeight || 96;
    const boundsWidth = boundsRect.width || bounds.clientWidth;
    const boundsHeight = boundsRect.height || bounds.clientHeight;
    const margin = 12;
    const gap = 14;

    if (!boundsWidth || !boundsHeight) {
      setPosition({ left: hover.x + gap, top: hover.y + gap });
      return;
    }

    const preferredLeft = hover.x + gap + width + margin <= boundsWidth
      ? hover.x + gap
      : hover.x - width - gap;
    const preferredTop = hover.y + gap + height + margin <= boundsHeight
      ? hover.y + gap
      : hover.y - height - gap;

    setPosition({
      left: Math.min(Math.max(margin, preferredLeft), Math.max(margin, boundsWidth - width - margin)),
      top: Math.min(Math.max(margin, preferredTop), Math.max(margin, boundsHeight - height - margin))
    });
  }, [hover]);

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="pointer-events-none absolute z-30 w-56 rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur-xl"
      style={{
        left: position.left,
        top: position.top,
        borderColor: themePalette.borderStrong,
        background: themePalette.surfacePanel,
        boxShadow: "0 14px 36px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.04)",
        color: themePalette.textPrimary
      }}
    >
      <div className="text-xs font-semibold">{hover.label}</div>
      {hover.valueLabel ? (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-semibold tabular-nums">{hover.valueLabel}</span>
          {hover.unitLabel ? (
            <span className="text-[0.68rem]" style={{ color: themePalette.textMuted }}>
              {hover.unitLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {hover.periodLabel ? (
        <div className="mt-0.5 text-[0.62rem]" style={{ color: themePalette.textMuted }}>
          {hover.periodLabel}
        </div>
      ) : null}
    </div>
  );
}
