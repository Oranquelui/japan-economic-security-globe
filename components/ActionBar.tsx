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
      className="hidden items-center justify-between border-b px-4 py-3 lg:flex"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div
        className="max-w-sm"
      >
        <div className="font-mono text-[0.55rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
          日本向け依存インテリジェンス
        </div>
        <h1 className="mt-1 text-[0.95rem] font-semibold text-white">日本経済安全保障</h1>
      </div>

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
    </header>
  );
}
