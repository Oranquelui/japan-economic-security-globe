"use client";

import type { ThemeId } from "../types/semantic";
import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel } from "../lib/presentation/japanese";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface MapInboxPanelProps {
  collapsed: boolean;
  themePalette: ThemePalette;
  themeId: ThemeId;
  onToggleCollapsed: () => void;
  onThemeChange: (themeId: ThemeId) => void;
}

export function MapInboxPanel({
  collapsed,
  themePalette,
  themeId,
  onToggleCollapsed,
  onThemeChange
}: MapInboxPanelProps) {
  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center rounded-2xl border py-3 shadow-2xl shadow-black/45"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanel
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid h-10 w-10 place-items-center rounded-xl border text-lg transition"
          style={{
            borderColor: themePalette.accent,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary
          }}
          aria-label="左パネルを開く"
        >
          ≡
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          {THEME_ORDER.map((id) => {
            const theme = getThemeLabel(id);
            const isActive = id === themeId;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onThemeChange(id)}
                className="grid h-10 w-10 place-items-center rounded-xl border text-[0.62rem] font-bold transition"
                style={
                  isActive
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
                title={theme.label}
              >
                {theme.label.slice(0, 1)}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/25"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${themePalette.borderSubtle}` }}>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            テーマ
          </p>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="grid h-8 w-8 place-items-center rounded-lg border text-sm transition"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated,
              color: themePalette.textMuted
            }}
            aria-label="左パネルを閉じる"
          >
            ←
          </button>
        </div>
        <div className="mt-3">
          <div
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            {THEME_ORDER.map((id) => {
              const theme = getThemeLabel(id);
              const isActive = id === themeId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onThemeChange(id)}
                  className="w-full border-b px-3 py-3 text-left transition last:border-b-0"
                  style={
                    isActive
                      ? {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: `2px solid ${themePalette.accent}`,
                          background: "rgba(255,255,255,0.03)",
                          color: themePalette.textPrimary
                        }
                      : {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: "2px solid transparent",
                          background: "transparent",
                          color: themePalette.textMuted
                        }
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{theme.label}</div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full" style={{ background: themePalette.accent }} />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
