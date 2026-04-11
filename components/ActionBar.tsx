"use client";

import { useState } from "react";

import type { OperationMetric } from "../lib/presentation/metrics";
import type { ThemePalette } from "../lib/presentation/palette";

interface ActionBarProps {
  metrics: OperationMetric[];
  onClearFilters: () => void;
  queryActive: boolean;
  sharePath: string;
  themeLabel: string;
  themePalette: ThemePalette;
}

export function ActionBar({
  metrics,
  onClearFilters,
  queryActive,
  sharePath,
  themeLabel,
  themePalette
}: ActionBarProps) {
  const [copied, setCopied] = useState(false);

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

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden">
        {metrics.slice(0, 4).map((metric) => (
          <span
            key={metric.id}
            className="truncate rounded-full border px-2.5 py-1 text-[0.68rem]"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated,
              color: themePalette.textMuted
            }}
          >
            {metric.label} {metric.value}
          </span>
        ))}
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
        <button
          type="button"
          onClick={handleCopyLink}
          className="rounded-lg border px-3 py-2 text-[0.72rem] transition"
          style={{
            borderColor: copied ? themePalette.accent : themePalette.borderSubtle,
            background: copied ? themePalette.accentSoft : themePalette.surfacePanelElevated,
            color: copied ? themePalette.textPrimary : themePalette.textMuted
          }}
        >
          {copied ? "URL コピー済み" : "共有"}
        </button>
      </div>
    </header>
  );
}
