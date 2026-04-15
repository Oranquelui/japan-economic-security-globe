"use client";

import { useEffect, useRef, useState } from "react";

import type { HomepageMode } from "../lib/config/homepage-mode";

export const HOMEPAGE_NOTICE_STORAGE_KEY = "jp-sdg:homepage-notice:v1";

interface InitialNoticeModalProps {
  homepageMode: HomepageMode;
  locale?: string;
}

export function InitialNoticeModal({ homepageMode, locale }: InitialNoticeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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

    closeButtonRef.current?.focus();

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
      className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(6,9,14,0.68)] px-4"
      data-locale={locale ?? "ja"}
    >
      <div
        aria-labelledby="homepage-notice-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border px-6 py-5 text-center shadow-2xl"
        role="dialog"
        style={{
          background: "color-mix(in srgb, var(--ops-surface-panel, #121923) 90%, #0c1017 10%)",
          borderColor: "var(--ops-border-strong, #3a4250)",
          color: "var(--ops-text-primary, #e2e8f0)",
          boxShadow: "0 18px 40px rgba(2, 6, 12, 0.65)"
        }}
      >
        <button
          ref={closeButtonRef}
          aria-label="お知らせを閉じる"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border text-sm transition hover:bg-white/5"
          onClick={dismissNotice}
          style={{
            borderColor: "var(--ops-border-strong, #4a5364)",
            color: "var(--ops-text-muted, #cbd5e1)"
          }}
          type="button"
        >
          ×
        </button>
        <img
          alt="Homepage notice seal"
          className="mx-auto mt-1 h-12 w-12 rounded-full object-cover"
          height={48}
          src="/brand/homepage-notice-seal.webp"
          width={48}
        />
        <div className="mt-4 space-y-1 text-sm leading-6">
          <p id="homepage-notice-title">MVP/テスト運用中</p>
          <p>無料公開中</p>
          <p>仕様は予告なく変更される場合があります</p>
        </div>
      </div>
    </div>
  );
}
