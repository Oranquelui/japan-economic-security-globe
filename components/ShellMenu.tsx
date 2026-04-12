"use client";

import { useState } from "react";

import type { ThemePalette } from "../lib/presentation/palette";

interface ShellMenuProps {
  sharePath: string;
  themePalette: ThemePalette;
}

export function ShellMenu({ sharePath, themePalette }: ShellMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    const url = typeof window === "undefined" ? sharePath : new URL(sharePath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
      setIsOpen(false);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="メニュー"
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-lg border px-3 py-2 text-[0.72rem] transition"
        style={{
          borderColor: isOpen ? themePalette.accent : themePalette.borderSubtle,
          background: isOpen ? themePalette.accentSoft : themePalette.surfacePanelElevated,
          color: isOpen ? themePalette.textPrimary : themePalette.textMuted
        }}
      >
        {copied ? "コピー済み" : "メニュー"}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-xl border p-2 shadow-2xl"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanel
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            className="flex w-full rounded-lg px-3 py-2 text-left text-[0.72rem] transition"
            style={{
              color: themePalette.textPrimary
            }}
          >
            共有
          </button>
          <a
            role="menuitem"
            href="/sources-license"
            className="flex rounded-lg px-3 py-2 text-[0.72rem] transition"
            style={{
              color: themePalette.textPrimary
            }}
          >
            Sources/License
          </a>
          <a
            role="menuitem"
            href="/contact"
            className="flex rounded-lg px-3 py-2 text-[0.72rem] transition"
            style={{
              color: themePalette.textPrimary
            }}
          >
            問い合わせ
          </a>
        </div>
      ) : null}
    </div>
  );
}
