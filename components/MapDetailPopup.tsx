"use client";

import type { ReactNode } from "react";

import type { RankingExplanationViewModel } from "../lib/ranking/explain";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import type { DetailViewModel } from "../types/presentation";
import {
  localizeAnyLabel,
  localizeKind,
  localizePublisher,
  localizeSourceLabel,
  localizeSummary,
  localizeWhyItMatters
} from "../lib/presentation/japanese";

interface MapDetailPopupProps {
  detail: DetailViewModel;
  onClose: () => void;
  onOpenEvidence?: () => void;
  onSelect: (id: string) => void;
  rankingExplanation?: RankingExplanationViewModel | null;
  routeStatusLabel?: string | null;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  themeTitle: string;
}

export function MapDetailPopup({
  detail,
  onClose,
  onOpenEvidence,
  onSelect,
  rankingExplanation,
  routeStatusLabel,
  statusPalette,
  themePalette,
  themeTitle
}: MapDetailPopupProps) {
  const relatedEntities = detail.relatedEntities.slice(0, 4);
  const linkedFlows = detail.linkedFlows.filter((flow) => flow.id !== detail.id).slice(0, 4);
  const sources = detail.sources.slice(0, 2);
  const isRegionalSecurityDetail = themeTitle === "地域安全保障";

  return (
    <aside
      data-testid="map-detail-popup"
      className="pointer-events-auto max-h-[min(34rem,calc(100vh-6rem))] overflow-y-auto rounded-[18px] border p-4 shadow-2xl backdrop-blur-2xl"
      style={{
        borderColor: themePalette.borderStrong,
        background: "linear-gradient(165deg, rgba(16,24,36,0.96), rgba(8,12,20,0.94))",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="ops-label" style={{ color: themePalette.textMuted }}>
            MAP DETAIL
          </div>
          <h2 className="ops-title mt-2 text-lg leading-6 text-white [overflow-wrap:anywhere]">
            {localizeAnyLabel(detail.id, detail.label)}
          </h2>
          <p className="mt-1 text-[0.7rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            {themeTitle}
          </p>
        </div>
        <button
          aria-label="地図詳細を閉じる"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm transition hover:bg-white/5"
          onClick={onClose}
          style={{
            borderColor: themePalette.borderSubtle,
            color: themePalette.textMuted
          }}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rankingExplanation?.rankLabel ? (
          <PopupChip borderColor={themePalette.accent} textColor={themePalette.textPrimary}>
            {rankingExplanation.rankLabel}
          </PopupChip>
        ) : null}
        {routeStatusLabel ? (
          <PopupChip borderColor={statusPalette.selected} textColor={themePalette.textPrimary}>
            {routeStatusLabel}
          </PopupChip>
        ) : null}
        <PopupChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
          {localizeKind(detail.kind)}
        </PopupChip>
        <PopupChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
          {detail.signal.category}
        </PopupChip>
        <PopupChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
          {detail.sources.length} 出典
        </PopupChip>
        <PopupChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
          {detail.relatedEntities.length} 関連
        </PopupChip>
      </div>

      <p className="mt-3 text-[0.82rem] leading-6 text-slate-100 [overflow-wrap:anywhere]">
        {localizeSummary(detail.id, detail.summary)}
      </p>
      <p className="mt-2 text-[0.72rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
        {localizeWhyItMatters(detail.id, detail.whyItMatters)}
      </p>

      {isRegionalSecurityDetail ? (
        <p className="mt-2 rounded-md border px-2.5 py-2 text-[0.68rem] leading-5" style={{ borderColor: themePalette.borderSubtle, color: themePalette.textMuted }}>
          公開情報 / 履歴・集約 / ライブ追跡ではありません
        </p>
      ) : null}

      {onOpenEvidence ? (
        <button
          type="button"
          onClick={onOpenEvidence}
          data-testid="map-detail-open-evidence"
          className="mt-3 w-full rounded-xl border px-3 py-2 text-[0.74rem] font-medium transition hover:bg-white/5"
          style={{
            borderColor: themePalette.accent,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary
          }}
        >
          根拠パネルを開く
        </button>
      ) : null}

      {rankingExplanation ? (
        <section className="mt-4 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="font-mono text-[0.56rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            WHY RANKED
          </div>
          <p className="mt-2 text-[0.74rem] leading-5 text-slate-100 [overflow-wrap:anywhere]">
            {rankingExplanation.summary}
          </p>
          <p className="mt-1 text-[0.68rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
            {rankingExplanation.sourceTrust.detail}
          </p>
        </section>
      ) : null}

      {sources.length ? (
        <section className="mt-4 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="font-mono text-[0.56rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            SOURCE PROOF
          </div>
          <div className="mt-2 space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="text-[0.7rem] leading-5 [overflow-wrap:anywhere]" style={{ color: themePalette.textMuted }}>
                <span className="font-semibold text-slate-100">{localizeSourceLabel(source.id, source.label)}</span>
                <span> / {localizePublisher(source.publisher)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {linkedFlows.length ? (
        <section className="mt-4 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="font-mono text-[0.56rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            NEXT FLOWS
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {linkedFlows.map((flow) => (
              <button
                key={flow.id}
                aria-label={`関連フロー: ${localizeAnyLabel(flow.id, flow.label)}`}
                className="rounded-full border px-2.5 py-1.5 text-[0.66rem] transition hover:bg-white/5"
                onClick={() => onSelect(flow.id)}
                style={{
                  borderColor: themePalette.borderSubtle,
                  color: themePalette.textMuted
                }}
                type="button"
              >
                {localizeAnyLabel(flow.id, flow.label)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {relatedEntities.length ? (
        <section className="mt-4 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="font-mono text-[0.56rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            RELATED POINTS
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedEntities.map((entity) => (
              <button
                key={entity.id}
                aria-label={`関連: ${localizeAnyLabel(entity.id, entity.label)}`}
                className="rounded-full border px-2.5 py-1.5 text-[0.66rem] transition hover:bg-white/5"
                onClick={() => onSelect(entity.id)}
                style={{
                  borderColor: themePalette.borderSubtle,
                  color: themePalette.textMuted
                }}
                type="button"
              >
                {localizeAnyLabel(entity.id, entity.label)}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function PopupChip({
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
      className="rounded-full border px-2 py-1 text-[0.62rem]"
      style={{
        borderColor,
        background: "rgba(9, 13, 18, 0.2)",
        color: textColor
      }}
    >
      {children}
    </span>
  );
}
