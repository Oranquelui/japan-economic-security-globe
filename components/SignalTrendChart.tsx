"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import type { SignalTrendViewModel } from "../lib/presentation/trends";

interface SignalTrendChartProps {
  themePalette: ThemePalette;
  trend: SignalTrendViewModel;
}

const WIDTH = 260;
const HEIGHT = 84;

export function SignalTrendChart({ themePalette, trend }: SignalTrendChartProps) {
  const values = trend.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const lastValue = values[values.length - 1];
  const polylinePoints = trend.points
    .map((point, index) => {
      const x = (index / Math.max(trend.points.length - 1, 1)) * WIDTH;
      const normalized = max === min ? 0.5 : (point.value - min) / (max - min);
      const y = HEIGHT - normalized * (HEIGHT - 12) - 6;

      return `${toStableNumber(x)},${toStableNumber(y)}`;
    })
    .join(" ");

  return (
    <div data-testid="signal-trend-chart">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
            Trend
          </div>
          <div className="mt-2 text-sm font-semibold text-white">{trend.title}</div>
          <div className="mt-1 text-[0.72rem]" style={{ color: themePalette.textMuted }}>
            {trend.updatedLabel}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{lastValue}</div>
          <div className="mt-1 text-[0.72rem]" style={{ color: themePalette.textMuted }}>
            {trend.changeLabel}
          </div>
        </div>
      </div>

      <svg
        aria-label={`Trend chart for ${trend.signalId}`}
        className="mt-4 h-24 w-full overflow-visible"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        <polyline
          fill="none"
          points={polylinePoints}
          stroke={themePalette.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {trend.points.map((point, index) => {
          const x = (index / Math.max(trend.points.length - 1, 1)) * WIDTH;
          const normalized = max === min ? 0.5 : (point.value - min) / (max - min);
          const y = HEIGHT - normalized * (HEIGHT - 12) - 6;
          const isLast = index === trend.points.length - 1;

          return (
            <circle
              key={`${point.label}-${point.value}`}
              cx={toStableNumber(x)}
              cy={toStableNumber(y)}
              fill={isLast ? themePalette.textPrimary : themePalette.accent}
              r={isLast ? 4.6 : 3.2}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[0.68rem]" style={{ color: themePalette.textMuted }}>
        <span>{trend.points[0]?.label}</span>
        <span>{trend.unitLabel}</span>
        <span>{trend.points[trend.points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function toStableNumber(value: number) {
  return Number(value.toFixed(2));
}
