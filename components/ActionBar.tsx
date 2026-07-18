"use client";

import type { ThemePalette } from "../lib/presentation/palette";
import { ShellMenu } from "./ShellMenu";

interface ActionBarProps {
  currentViewLabel: string;
  sharePath: string;
  themePalette: ThemePalette;
}

export function ActionBar({
  currentViewLabel,
  sharePath,
  themePalette
}: ActionBarProps) {
  return (
    <header
      data-testid="layout-action-bar"
      className="relative hidden items-center justify-between gap-4 border-b px-5 xl:flex"
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

      <div className="flex min-w-0 items-center gap-4">
        <h1 className="ops-title shrink-0 text-[1.05rem] text-white">日本レジリエンス地図</h1>
        <span aria-hidden="true" className="h-5 w-px" style={{ background: themePalette.borderStrong }} />
        <p className="truncate text-[0.78rem] font-medium" style={{ color: themePalette.textMuted }}>
          {currentViewLabel}
        </p>
      </div>

      <ShellMenu sharePath={sharePath} themePalette={themePalette} />
    </header>
  );
}
