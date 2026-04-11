"use client";

import { useState } from "react";

import type { ThemePalette } from "../lib/presentation/palette";

interface ActionBarProps {
  sharePath: string;
  themePalette: ThemePalette;
}

export function ActionBar({
  sharePath,
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
      className="absolute left-4 right-4 top-4 z-40 hidden rounded-lg border shadow-lg shadow-black/10 backdrop-blur-md lg:block"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex items-center justify-between gap-6 px-5 py-3">
        <div className="min-w-0 flex items-center gap-6">
          <div className="min-w-0">
            <div className="font-mono text-[0.58rem] uppercase tracking-[0.32em]" style={{ color: themePalette.textMuted }}>
              Japan Civic Dependency Service
            </div>
            <h1 className="mt-1 text-base font-semibold text-white">日本経済安全保障</h1>
          </div>
          <div className="h-7 w-px" style={{ background: themePalette.borderSubtle }} />
          <div className="text-sm font-medium" style={{ color: themePalette.textPrimary }}>
            運用地図
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-md border px-3 py-2 text-xs transition"
            style={{
              borderColor: copied ? themePalette.accent : themePalette.borderSubtle,
              background: copied ? themePalette.accentSoft : "transparent",
              color: copied ? themePalette.textPrimary : themePalette.textMuted
            }}
          >
            {copied ? "URL をコピー済み" : "共有ビュー"}
          </button>
        </div>
      </div>
    </header>
  );
}
