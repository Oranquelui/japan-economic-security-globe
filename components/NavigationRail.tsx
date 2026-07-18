"use client";

import type { Ref } from "react";

import { THEME_IDS, type ThemeId } from "../types/semantic";
import type { ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel } from "../lib/presentation/japanese";

interface NavigationRailProps {
  inboxToggleRef?: Ref<HTMLButtonElement>;
  isInboxOpen: boolean;
  onCloseInbox: () => void;
  onOpenInbox: () => void;
  onThemeChange: (themeId: ThemeId) => void;
  themeId: ThemeId;
  themeIds?: readonly ThemeId[];
  themePalette: ThemePalette;
}

const RAIL_LABELS: Record<ThemeId, string> = {
  defense: "防衛",
  energy: "エネ",
  logistics: "物流",
  "regional-security": "安保",
  rice: "コメ",
  semiconductors: "半導",
  water: "水"
};

export function NavigationRail({
  inboxToggleRef,
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
      className="ops-accent-rail flex h-full flex-col items-center border-r py-3.5"
      style={{
        borderColor: themePalette.borderSubtle,
        background: `linear-gradient(180deg, ${themePalette.surfacePanelElevated} 0%, ${themePalette.surfacePanel} 100%)`
      }}
    >
      {isInboxOpen ? (
        <button
          ref={inboxToggleRef}
          key="close-inbox"
          type="button"
          onClick={onCloseInbox}
          className="grid h-11 w-12 place-items-center rounded-[12px] border text-base transition"
          style={{
            borderColor: `${themePalette.accent}88`,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary,
            boxShadow: `0 0 0 1px ${themePalette.accent}22, 0 8px 24px rgba(0,0,0,0.25)`
          }}
          aria-label="監視インボックスを閉じる"
        >
          ≡
        </button>
      ) : (
        <button
          ref={inboxToggleRef}
          key="open-inbox"
          type="button"
          onClick={onOpenInbox}
          className="ops-control grid h-11 w-12 place-items-center text-base"
          style={{
            borderColor: themePalette.borderSubtle,
            color: themePalette.textMuted
          }}
          aria-label="監視インボックスを開く"
        >
          ≡
        </button>
      )}

      <div className="mt-5 flex flex-col items-center gap-2">
        {themeIds.map((id, index) => {
          const theme = getThemeLabel(id);
          const isActive = id === themeId;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onThemeChange(id)}
              className="relative grid h-12 w-12 place-items-center rounded-[12px] border text-[0.68rem] font-semibold tracking-tight transition"
              style={
                isActive
                  ? {
                      borderColor: `${themePalette.accent}99`,
                      background: themePalette.accentSoft,
                      color: themePalette.textPrimary,
                      boxShadow: `0 0 0 1px ${themePalette.accent}18, 0 10px 28px rgba(0,0,0,0.28)`
                    }
                  : {
                      borderColor: themePalette.borderSubtle,
                      background: "rgba(255,255,255,0.02)",
                      color: themePalette.textMuted
                    }
              }
              title={theme.label}
              aria-label={theme.label}
            >
              <span
                className="absolute left-1.5 top-1.5 font-mono text-[0.44rem] leading-none tracking-wider"
                style={{ color: isActive ? themePalette.accentText : themePalette.textMuted }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1.5">{RAIL_LABELS[id]}</span>
              {isActive ? (
                <span
                  className="absolute -left-px top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                  style={{ background: themePalette.accent, boxShadow: `0 0 12px ${themePalette.accent}` }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
