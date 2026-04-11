"use client";

import type { ThemeView } from "../types/presentation";
import type { ThemeId } from "../types/semantic";
import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel, getThemeQuestion } from "../lib/presentation/japanese";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface MapInboxPanelProps {
  collapsed: boolean;
  themePalette: ThemePalette;
  themeId: ThemeId;
  view: ThemeView;
  onToggleCollapsed: () => void;
  onThemeChange: (themeId: ThemeId) => void;
}

export function MapInboxPanel({
  collapsed,
  themePalette,
  themeId,
  view,
  onToggleCollapsed,
  onThemeChange
}: MapInboxPanelProps) {
  const question = getThemeQuestion(themeId);

  if (collapsed) {
    return (
      <aside
        className="flex h-full flex-col items-center rounded-2xl border py-3 shadow-2xl shadow-black/45"
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
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/25"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="pb-4" style={{ borderBottom: `1px solid ${themePalette.borderSubtle}` }}>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: themePalette.textMuted }}>
            文脈
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">{getThemeLabel(themeId).label}</h2>
              <p className="mt-1 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                {getThemeLabel(themeId).sublabel}
              </p>
            </div>
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
          <p className="mt-3 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>
            {question}
          </p>
        </div>

        <div className="mt-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            プリセット
          </p>
          <div
            className="mt-2 overflow-hidden rounded-xl border"
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
                  <div className="mt-0.5 text-[0.68rem]" style={{ color: isActive ? themePalette.accentText : themePalette.textMuted }}>
                    {theme.sublabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: `${themePalette.accent}33`,
              background: themePalette.accentSoft
            }}
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em]" style={{ color: themePalette.accentText }}>
              現在の問い
            </p>
            <p className="mt-2 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
              Phase 0 は日本向け。物流はチョークポイント、港湾、LNG受入基地、製油所まで。
            </p>
            <p className="mt-2 text-[0.68rem]" style={{ color: themePalette.accentText }}>
              比較や絞り込みは下部の比較表で行う。
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
