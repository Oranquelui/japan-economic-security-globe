"use client";

import { useState, type ReactNode } from "react";

import type { ThemeId } from "../types/semantic";
import type { OperationMapMode } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";
import { getOperationModeLabel } from "../lib/presentation/operations";
import { getThemeLabel, getThemeQuestion } from "../lib/presentation/japanese";

const OPERATION_MODES: OperationMapMode[] = ["point", "cluster", "choropleth", "route", "static"];

interface ActionBarProps {
  evidenceOpen: boolean;
  gridOpen: boolean;
  inboxOpen: boolean;
  mapMode: OperationMapMode;
  onMapModeChange: (mode: OperationMapMode) => void;
  onOpenEvidence: () => void;
  onOpenGrid: () => void;
  onOpenInbox: () => void;
  resultCount: number;
  selectedLabel: string;
  sharePath: string;
  themeId: ThemeId;
  themePalette: ThemePalette;
}

export function ActionBar({
  evidenceOpen,
  gridOpen,
  inboxOpen,
  mapMode,
  onMapModeChange,
  onOpenEvidence,
  onOpenGrid,
  onOpenInbox,
  resultCount,
  selectedLabel,
  sharePath,
  themeId,
  themePalette
}: ActionBarProps) {
  const [copied, setCopied] = useState(false);
  const theme = getThemeLabel(themeId);
  const question = getThemeQuestion(themeId);

  async function handleCopyLink() {
    const url = typeof window === "undefined" ? sharePath : new URL(sharePath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <header
      className="absolute left-4 right-4 top-4 z-40 hidden rounded-2xl border shadow-2xl shadow-black/45 backdrop-blur-md lg:block"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.32em]" style={{ color: themePalette.textMuted }}>
            Japan Civic Dependency Service
          </div>
          <h1 className="mt-2 text-lg font-semibold text-white">日本経済安全保障</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BarChip themePalette={themePalette}>{theme.label}</BarChip>
            <BarChip themePalette={themePalette}>{getOperationModeLabel(mapMode)}</BarChip>
            <BarChip themePalette={themePalette}>{resultCount} 件</BarChip>
          </div>
          <p className="mt-2 text-sm leading-6" style={{ color: themePalette.textPrimary }}>
            {question}
          </p>
          <p className="mt-1 text-xs leading-5" style={{ color: themePalette.textMuted }}>
            選択中: {selectedLabel}
          </p>
        </div>

        <div className="flex min-w-[420px] flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {OPERATION_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onMapModeChange(mode)}
                className="rounded-lg border px-3 py-2 text-xs transition"
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <DockButton active={inboxOpen} label="受信トレイ" onClick={onOpenInbox} themePalette={themePalette} />
            <DockButton active={gridOpen} label="比較表" onClick={onOpenGrid} themePalette={themePalette} />
            <DockButton active={evidenceOpen} label="根拠" onClick={onOpenEvidence} themePalette={themePalette} />
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border px-3 py-2 text-xs transition"
              style={{
                borderColor: copied ? themePalette.accent : themePalette.borderSubtle,
                background: copied ? themePalette.accentSoft : themePalette.surfacePanelElevated,
                color: copied ? themePalette.textPrimary : themePalette.textMuted
              }}
            >
              {copied ? "URL をコピー済み" : "共有リンク"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function BarChip({ children, themePalette }: { children: ReactNode; themePalette: ThemePalette }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[0.68rem]"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanelElevated,
        color: themePalette.textMuted
      }}
    >
      {children}
    </span>
  );
}

function DockButton({
  active,
  label,
  onClick,
  themePalette
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  themePalette: ThemePalette;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-xs transition"
      style={
        active
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
      {label}
    </button>
  );
}
