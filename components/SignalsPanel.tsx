"use client";

import { useEffect, useRef } from "react";

import type { OperationRow } from "../lib/presentation/operations";
import type { ThemePalette } from "../lib/presentation/palette";
import type { ThemeId } from "../types/semantic";

interface SignalsPanelProps {
  activeId: string;
  onBackToMap: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  query: string;
  rows: OperationRow[];
  themeId: ThemeId;
  themeLabel: string;
  themePalette: ThemePalette;
}

export function SignalsPanel({
  activeId,
  onBackToMap,
  onQueryChange,
  onSelect,
  query,
  rows,
  themeId,
  themeLabel,
  themePalette
}: SignalsPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section data-testid="signals-panel" data-theme={themeId} className="flex h-full flex-col overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ops-label" style={{ color: themePalette.accentText }}>公式シグナル</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 text-lg font-semibold outline-none"
            style={{ color: themePalette.textPrimary }}
          >
            {themeLabel}のシグナル
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToMap}
          className="rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: themePalette.borderStrong, color: themePalette.textPrimary }}
        >
          地図に戻る
        </button>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">シグナルを検索</span>
        <input
          aria-label="シグナルを検索"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="対象・状態・期間を検索"
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated,
            color: themePalette.textPrimary
          }}
        />
      </label>

      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            aria-pressed={activeId === row.id}
            onClick={() => onSelect(row.id)}
            className="w-full rounded-xl border p-3 text-left transition"
            style={{
              borderColor: activeId === row.id ? themePalette.accent : themePalette.borderSubtle,
              background: activeId === row.id ? themePalette.accentSoft : themePalette.surfacePanelElevated,
              color: themePalette.textPrimary
            }}
          >
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{row.label}</span>
                <span className="mt-1 block text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                  {row.type} / {row.subject} / {row.period}
                </span>
              </span>
              {row.ranking ? (
                <span className="rounded-full border px-2 py-1 text-[0.68rem]" style={{ borderColor: themePalette.accent }}>
                  #{row.ranking.rank}
                </span>
              ) : null}
            </span>
            <span className="mt-2 flex flex-wrap gap-1.5 text-[0.65rem]" style={{ color: themePalette.textMuted }}>
              <span>{row.urgency}</span>
              <span>{row.status}</span>
              {row.ranking?.freshnessLabel ? <span>{row.ranking.freshnessLabel}</span> : null}
              {row.ranking?.confidenceLabel ? <span>{row.ranking.confidenceLabel}</span> : null}
              {row.ranking?.sourceTrustLabel ? <span>{row.ranking.sourceTrustLabel}</span> : null}
            </span>
            {row.ranking?.whyRanked ? (
              <span className="mt-2 block text-[0.7rem] leading-5" style={{ color: themePalette.textMuted }}>
                {row.ranking.whyRanked}
              </span>
            ) : null}
          </button>
        ))}
        {rows.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm" style={{ borderColor: themePalette.borderSubtle, color: themePalette.textMuted }}>
            条件に一致するシグナルはありません。
          </p>
        ) : null}
      </div>
    </section>
  );
}
