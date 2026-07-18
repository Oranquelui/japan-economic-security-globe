"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { validateMetricSeries } from "../lib/presentation/metric-series";
import type { ThemePalette } from "../lib/presentation/palette";
import type { LayerDefinition, MetricSeriesPoint } from "../types/presentation";
import type { SourceDocument } from "../types/semantic";

interface ComparisonPanelProps {
  activeId: string;
  layer: LayerDefinition;
  onClose: () => void;
  onSelect: (id: string) => void;
  series: MetricSeriesPoint[];
  sources: SourceDocument[];
  themePalette: ThemePalette;
}

type SortKey = "label" | "value";

const numberFormatter = new Intl.NumberFormat("ja-JP");

export function ComparisonPanel({
  activeId,
  layer,
  onClose,
  onSelect,
  series,
  sources,
  themePalette
}: ComparisonPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending">("descending");
  const validation = validateMetricSeries(series);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const sortedSeries = useMemo(() => {
    return [...series].sort((left, right) => {
      const comparison = sortKey === "label"
        ? left.label.localeCompare(right.label, "ja")
        : left.value - right.value;
      return sortDirection === "ascending" ? comparison : -comparison;
    });
  }, [series, sortDirection, sortKey]);

  const sourceIds = new Set(series.flatMap((point) => point.sourceIds));
  const officialSources = sources.filter((source) => source.official && sourceIds.has(source.id));

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((direction) => direction === "ascending" ? "descending" : "ascending");
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "label" ? "ascending" : "descending");
  }

  return (
    <section className="flex h-full flex-col overflow-hidden border-t" style={{ borderColor: themePalette.borderSubtle, background: themePalette.surfacePanel }}>
      <div className="flex items-start justify-between gap-4 border-b px-4 py-3" style={{ borderColor: themePalette.borderSubtle }}>
        <div>
          <p className="ops-label" style={{ color: themePalette.textMuted }}>公式系列</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-base font-semibold outline-none"
            style={{ color: themePalette.textPrimary }}
          >
            {layer.label}を比較
          </h2>
          {validation.comparable ? (
            <p className="mt-1 text-xs" style={{ color: themePalette.textMuted }}>
              {validation.unit} / {validation.period}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="比較を閉じる"
          onClick={onClose}
          className="rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: themePalette.borderStrong, color: themePalette.textPrimary }}
        >
          地図に戻る
        </button>
      </div>

      {!validation.comparable ? (
        <div role="alert" className="m-4 rounded-xl border p-4 text-sm" style={{ borderColor: themePalette.borderStrong, color: themePalette.textPrimary }}>
          比較できません。{validation.message}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="sticky top-0" style={{ background: themePalette.surfacePanelElevated, color: themePalette.textMuted }}>
              <tr>
                <th aria-sort={sortKey === "label" ? sortDirection : "none"} className="px-4 py-2 font-medium">
                  <button type="button" onClick={() => toggleSort("label")}>地域名で並べ替え</button>
                </th>
                <th aria-sort={sortKey === "value" ? sortDirection : "none"} className="px-4 py-2 text-right font-medium">
                  <button type="button" onClick={() => toggleSort("value")}>値で並べ替え</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSeries.map((point) => (
                <tr key={point.id} style={{ borderTop: `1px solid ${themePalette.borderSubtle}` }}>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      aria-pressed={activeId === point.id}
                      onClick={() => onSelect(point.id)}
                      className="font-semibold"
                      style={{ color: activeId === point.id ? themePalette.accentText : themePalette.textPrimary }}
                    >
                      {point.label} {numberFormatter.format(point.value)}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right font-mono" style={{ color: themePalette.textPrimary }}>
                    {numberFormatter.format(point.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {officialSources.length > 0 ? (
        <div className="border-t px-4 py-2 text-[0.68rem]" style={{ borderColor: themePalette.borderSubtle, color: themePalette.textMuted }}>
          公式出典: {officialSources.map((source, index) => (
            <span key={source.id}>
              {index > 0 ? " / " : null}
              <a href={source.url} target="_blank" rel="noreferrer" className="underline">{source.label}</a>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
