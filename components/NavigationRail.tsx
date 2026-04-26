"use client";

import { THEME_IDS, type ThemeId } from "../types/semantic";
import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel } from "../lib/presentation/japanese";

interface NavigationRailProps {
  isInboxOpen: boolean;
  onCloseInbox: () => void;
  onOpenInbox: () => void;
  onThemeChange: (themeId: ThemeId) => void;
  themeId: ThemeId;
  themeIds?: readonly ThemeId[];
  themePalette: ThemePalette;
}

export function NavigationRail({
  isInboxOpen,
  onCloseInbox,
  onOpenInbox,
  onThemeChange,
  themeId,
  themeIds = THEME_IDS,
  themePalette
}: NavigationRailProps) {
  return (
    <aside
      className="flex h-full flex-col items-center border-r py-3"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      {isInboxOpen ? (
        <button
          key="close-inbox"
          type="button"
          onClick={onCloseInbox}
          className="grid h-10 w-10 place-items-center rounded-md border text-lg transition"
          style={{
            borderColor: themePalette.accent,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary
          }}
          aria-label="監視インボックスを閉じる"
        >
          ≡
        </button>
      ) : (
        <button
          key="open-inbox"
          type="button"
          onClick={onOpenInbox}
          className="grid h-10 w-10 place-items-center rounded-md border text-lg transition"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated,
            color: themePalette.textMuted
          }}
          aria-label="監視インボックスを開く"
        >
          ≡
        </button>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        {themeIds.map((id) => {
          const theme = getThemeLabel(id);
          const isActive = id === themeId;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onThemeChange(id)}
              className="grid h-10 w-10 place-items-center rounded-md border text-[0.62rem] font-bold transition"
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
              aria-label={theme.label}
            >
              {theme.label.slice(0, 1)}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
