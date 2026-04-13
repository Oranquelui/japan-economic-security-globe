"use client";

import type { OperationMapMode } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";
import { getOperationModeLabel } from "../lib/presentation/operations";
import { ShellMenu } from "./ShellMenu";

interface ActionBarProps {
  mapMode: OperationMapMode;
  onClearFilters: () => void;
  onMapModeChange: (mode: OperationMapMode) => void;
  queryActive: boolean;
  selectedKindLabel: string;
  selectedLabel: string;
  routeStatusLabel?: string | null;
  sharePath: string;
  themeLabel: string;
  themePalette: ThemePalette;
}

export function ActionBar({
  mapMode,
  onClearFilters,
  onMapModeChange,
  queryActive,
  selectedKindLabel,
  selectedLabel,
  routeStatusLabel,
  sharePath,
  themeLabel,
  themePalette
}: ActionBarProps) {
  return (
    <header
      className="hidden items-center justify-between gap-4 border-b px-4 py-3 lg:flex"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="min-w-0 max-w-sm">
        <div className="font-mono text-[0.55rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
          日本向け依存インテリジェンス
        </div>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-[0.95rem] font-semibold text-white">日本経済安全保障</h1>
          <span
            className="rounded-full border px-2 py-0.5 text-[0.62rem]"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated,
              color: themePalette.textMuted
            }}
          >
            {themeLabel}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: themePalette.borderSubtle }}>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em]" style={{ color: themePalette.textMuted }}>
            表示レイヤー
          </span>
          <div className="flex items-center gap-1">
            {(["point", "cluster", "choropleth", "route", "static"] as OperationMapMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onMapModeChange(mode)}
                className="rounded-lg border px-2.5 py-1.5 text-[0.68rem] transition"
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

        <div
          className="min-w-0 max-w-[24rem] rounded-xl border px-3 py-2"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated
          }}
        >
          <div className="font-mono text-[0.55rem] uppercase tracking-[0.22em]" style={{ color: themePalette.textMuted }}>
            選択中
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span
              className="rounded-full border px-2 py-0.5 text-[0.6rem]"
              style={{
                borderColor: themePalette.borderSubtle,
                color: themePalette.textMuted
              }}
            >
              {selectedKindLabel}
            </span>
            {routeStatusLabel ? (
              <span
                className="rounded-full border px-2 py-0.5 text-[0.6rem]"
                style={{
                  borderColor: themePalette.borderSubtle,
                  color: themePalette.textMuted
                }}
              >
                {routeStatusLabel}
              </span>
            ) : null}
            <span className="truncate text-[0.78rem] font-medium text-white">{selectedLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!queryActive}
          className="rounded-lg border px-3 py-2 text-[0.72rem] transition disabled:cursor-default disabled:opacity-50"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated,
            color: themePalette.textMuted
          }}
        >
          フィルター解除
        </button>
        <ShellMenu sharePath={sharePath} themePalette={themePalette} />
      </div>
    </header>
  );
}
