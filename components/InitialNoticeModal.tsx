"use client";

import { useEffect, useState } from "react";

import type { HomepageMode } from "../lib/config/homepage-mode";

export const HOMEPAGE_NOTICE_STORAGE_KEY = "jp-sdg:homepage-notice:v2";

interface InitialNoticeModalProps {
  homepageMode: HomepageMode;
  locale?: string;
}

export function InitialNoticeModal({ homepageMode, locale }: InitialNoticeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    if (homepageMode !== "app") {
      setIsOpen(false);
      return;
    }

    try {
      setIsOpen(window.localStorage.getItem(HOMEPAGE_NOTICE_STORAGE_KEY) !== "dismissed");
    } catch {
      setIsOpen(false);
    }
  }, [homepageMode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismissNotice();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function dismissNotice() {
    try {
      window.localStorage.setItem(HOMEPAGE_NOTICE_STORAGE_KEY, "dismissed");
    } catch {
      // Ignore storage errors so the app remains usable.
    }

    setIsOpen(false);
  }

  if (!hasMounted || !isOpen) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-5 lg:bottom-6"
      data-locale={locale ?? "ja"}
    >
      <div
        aria-labelledby="homepage-notice-title"
        className="pointer-events-auto flex w-[min(560px,calc(100vw-2rem))] items-start gap-3 rounded-xl border px-4 py-3 text-left shadow-2xl"
        role="region"
        style={{
          background: "color-mix(in srgb, var(--ops-surface-panel, #121923) 92%, #0c1017 8%)",
          borderColor: "var(--ops-border-strong, #3a4250)",
          color: "var(--ops-text-primary, #e2e8f0)",
          boxShadow: "0 16px 36px rgba(2, 6, 12, 0.5)"
        }}
      >
        <img
          alt="Homepage notice seal"
          className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover"
          height={40}
          src="/brand/homepage-notice-seal.webp"
          width={40}
        />
        <div className="min-w-0 flex-1 space-y-1 text-sm leading-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold" id="homepage-notice-title">
              MVP/テスト運用中
            </p>
            <p className="rounded-full border px-2 py-0.5 text-[0.68rem]" style={{ borderColor: "var(--ops-border-subtle, #3a4250)", color: "var(--ops-text-muted, #cbd5e1)" }}>
              無料公開中
            </p>
          </div>
          <p>更新: 日本向けタンカー監視と地形地図を追加しました</p>
          <p style={{ color: "var(--ops-text-muted, #cbd5e1)" }}>仕様は予告なく変更される場合があります</p>
        </div>
        <button
          aria-label="お知らせを閉じる"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition hover:bg-white/5"
          onClick={dismissNotice}
          style={{
            borderColor: "var(--ops-border-strong, #4a5364)",
            color: "var(--ops-text-muted, #cbd5e1)"
          }}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
