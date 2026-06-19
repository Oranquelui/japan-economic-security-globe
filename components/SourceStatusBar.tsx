import type { ReactNode } from "react";

import type { SourceStatusSummary, SourceFreshnessTone } from "../lib/official/source-freshness";
import type { ThemePalette } from "../lib/presentation/palette";

interface SourceStatusBarProps {
  summary: SourceStatusSummary;
  themePalette: ThemePalette;
  variant?: "default" | "public-history";
}

export function SourceStatusBar({ summary, themePalette, variant = "default" }: SourceStatusBarProps) {
  const publicHistory = variant === "public-history";

  return (
    <section
      role="status"
      aria-label="出典状態"
      className="overflow-x-auto border-b px-4 py-2"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex min-h-8 flex-nowrap items-center gap-2 whitespace-nowrap text-[0.72rem]">
        <div className="mr-1 flex shrink-0 items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.24em]" style={{ color: themePalette.textMuted }}>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: getToneColor(summary.overallTone, themePalette) }}
            aria-hidden="true"
          />
          出典状態
        </div>
        <StatusChip borderColor={themePalette.accent} textColor={themePalette.textPrimary}>
          公式 {summary.officialSources}/{summary.totalSources}
        </StatusChip>
        {publicHistory ? (
          <>
            <StatusChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
              公開資料 {summary.documentSources}
            </StatusChip>
            <StatusChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
              履歴資料
            </StatusChip>
          </>
        ) : (
          <>
            <StatusChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
              API {summary.apiLikeSources}
            </StatusChip>
            <StatusChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
              文書 {summary.documentSources}
            </StatusChip>
            <StatusChip borderColor={getStaleBorderColor(summary, themePalette)} textColor={getStaleTextColor(summary, themePalette)}>
              古い出典 {summary.staleSources}
            </StatusChip>
          </>
        )}
        <StatusChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
          {summary.freshestAccessed ? `最終確認 ${summary.freshestAccessed}` : "確認日なし"}
        </StatusChip>
      </div>
    </section>
  );
}

function StatusChip({
  borderColor,
  children,
  textColor
}: {
  borderColor: string;
  children: ReactNode;
  textColor: string;
}) {
  return (
    <span
      className="shrink-0 rounded-full border px-2.5 py-1"
      style={{
        borderColor,
        color: textColor,
        background: "rgba(24, 28, 33, 0.68)"
      }}
    >
      {children}
    </span>
  );
}

function getToneColor(tone: SourceFreshnessTone, themePalette: ThemePalette) {
  switch (tone) {
    case "fresh":
      return themePalette.accent;
    case "recent":
      return themePalette.borderStrong;
    case "stale":
      return themePalette.textMuted;
  }
}

function getStaleBorderColor(summary: SourceStatusSummary, themePalette: ThemePalette) {
  return summary.staleSources > 0 ? themePalette.borderStrong : themePalette.borderSubtle;
}

function getStaleTextColor(summary: SourceStatusSummary, themePalette: ThemePalette) {
  return summary.staleSources > 0 ? themePalette.textPrimary : themePalette.textMuted;
}
