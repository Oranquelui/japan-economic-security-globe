"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import { ShellMenu } from "./ShellMenu";

interface ActionBarProps {
  onClearFilters: () => void;
  queryActive: boolean;
  selectedKindLabel: string;
  selectedLabel: string;
  routeStatusLabel?: string | null;
  sharePath: string;
  themeLabel: string;
  themePalette: ThemePalette;
}

export function ActionBar({
  onClearFilters,
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
      data-testid="layout-action-bar"
      className="relative hidden items-center justify-between gap-4 border-b px-5 py-3 lg:flex"
      style={{
        borderColor: themePalette.borderSubtle,
        background: `linear-gradient(180deg, ${themePalette.surfacePanelElevated} 0%, ${themePalette.surfacePanel} 100%)`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset"
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${themePalette.accent}88, transparent)`
        }}
      />

      <div className="min-w-0 max-w-sm">
        <div className="ops-label" style={{ color: themePalette.textMuted }}>
          日本向け依存インテリジェンス
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <h1 className="ops-title text-[1.05rem] text-white">日本経済安全保障</h1>
          <span
            className="ops-chip"
            style={{
              borderColor: `${themePalette.accent}55`,
              background: themePalette.accentSoft,
              color: themePalette.accentText
            }}
          >
            {themeLabel}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <div
          className="min-w-0 max-w-[30rem] rounded-[14px] border px-3.5 py-2"
          style={{
            borderColor: themePalette.borderSubtle,
            background: "rgba(8, 12, 20, 0.55)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
          }}
        >
          <div className="relative">
            <div className="ops-label" style={{ color: themePalette.textMuted }}>
              選択中
            </div>
            <div
              data-testid="selected-scroll"
              tabIndex={0}
              role="region"
              aria-label="選択中の選択内容"
              className="mt-1.5 flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap pr-8"
            >
              <span
                className="ops-chip shrink-0"
                style={{
                  borderColor: themePalette.borderSubtle,
                  color: themePalette.textMuted,
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                {selectedKindLabel}
              </span>
              {routeStatusLabel ? (
                <span
                  className="ops-chip shrink-0"
                  style={{
                    borderColor: `${themePalette.accent}40`,
                    color: themePalette.accentText,
                    background: themePalette.accentSoft
                  }}
                >
                  {routeStatusLabel}
                </span>
              ) : null}
              <span className="shrink-0 whitespace-nowrap text-[0.82rem] font-medium tracking-[-0.01em] text-white">
                {selectedLabel}
              </span>
            </div>
            <div
              data-testid="selected-fade"
              className="pointer-events-none absolute right-0 top-0 h-full w-8"
              style={{
                background: "linear-gradient(to right, transparent, rgba(8, 12, 20, 0.92))"
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!queryActive}
          className="ops-control px-3 py-2 text-[0.72rem] disabled:cursor-default disabled:opacity-40"
          style={{
            borderColor: themePalette.borderSubtle,
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
