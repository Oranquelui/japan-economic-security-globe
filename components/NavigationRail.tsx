"use client";

import type { ThemeId } from "../types/semantic";
import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel } from "../lib/presentation/japanese";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface NavigationRailProps {
  isInboxOpen: boolean;
  onThemeChange: (themeId: ThemeId) => void;
  onToggleInbox: () => void;
  themeId: ThemeId;
  themePalette: ThemePalette;
}

export function NavigationRail({
  isInboxOpen,
  onThemeChange,
  onToggleInbox,
  themeId,
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
      <button
        type="button"
        onClick={onToggleInbox}
        className="grid h-10 w-10 place-items-center rounded-md border text-lg transition"
        style={{
          borderColor: isInboxOpen ? themePalette.accent : themePalette.borderSubtle,
          background: isInboxOpen ? themePalette.accentSoft : themePalette.surfacePanelElevated,
          color: isInboxOpen ? themePalette.textPrimary : themePalette.textMuted
        }}
        aria-label={isInboxOpen ? "監視インボックスを閉じる" : "監視インボックスを開く"}
      >
        ≡
      </button>

      <div className="mt-4 flex flex-col items-center gap-2">
        {THEME_ORDER.map((id) => {
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
