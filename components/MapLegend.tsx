import { getStatusPalette, type ThemePalette } from "../lib/presentation/palette";
import type { LayerLegend } from "../types/presentation";
import type { SourceDocument } from "../types/semantic";

interface MapLegendProps {
  legend: LayerLegend;
  periodLabel: string;
  sourceIds: string[];
  sources: SourceDocument[];
  themePalette: ThemePalette;
}

export function MapLegend({
  legend,
  periodLabel,
  sourceIds,
  sources,
  themePalette
}: MapLegendProps) {
  const sourceIdSet = new Set(sourceIds);
  const officialSources = sources.filter((source) => sourceIdSet.has(source.id) && source.official && source.url);
  const categoricalItems = legend.items ?? [{ colorToken: "accent", label: legend.title }];

  return (
    <section
      role="region"
      aria-label={`${legend.title}の凡例`}
      className="rounded-xl border p-3"
      style={{ borderColor: themePalette.borderSubtle, background: themePalette.surfacePanelElevated }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold" style={{ color: themePalette.textPrimary }}>{legend.title}</h3>
        <span className="text-[0.66rem]" style={{ color: themePalette.textMuted }}>{periodLabel}</span>
      </div>

      {legend.kind === "continuous" ? (
        <div className="mt-3">
          <div
            aria-hidden="true"
            className="h-2 rounded-full border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: `linear-gradient(90deg, ${themePalette.surfacePanel}, ${themePalette.accent})`
            }}
          />
          <div className="mt-1 flex items-center justify-between text-[0.66rem]" style={{ color: themePalette.textMuted }}>
            <span>{legend.minLabel ?? "低"}</span>
            {legend.unit ? <span>{legend.unit}</span> : null}
            <span>{legend.maxLabel ?? "高"}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border"
              style={{ borderColor: themePalette.borderStrong, background: themePalette.surfacePanel }}
            />
            <span>{legend.missingLabel}</span>
          </div>
        </div>
      ) : (
        <ul role="list" aria-label={legend.title} className="mt-3 space-y-2">
          {categoricalItems.map((item) => (
            <li key={`${item.colorToken}:${item.label}`} className="flex items-center gap-2 text-[0.7rem]" style={{ color: themePalette.textMuted }}>
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border"
                style={{ borderColor: themePalette.borderStrong, background: resolveSwatchColor(item.colorToken, themePalette) }}
              />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {officialSources.length ? (
        <div className="mt-3 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
          <div className="text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: themePalette.textMuted }}>公式出典</div>
          <ul className="mt-2 space-y-1">
            {officialSources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.68rem] underline decoration-dotted underline-offset-4"
                  style={{ color: themePalette.accentText }}
                >
                  公式出典: {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function resolveSwatchColor(token: string, themePalette: ThemePalette) {
  const statusPalette = getStatusPalette();
  const paletteTokens: Record<string, string> = {
    accent: themePalette.accent,
    neutral: themePalette.textMuted,
    normal: statusPalette.normal,
    watch: statusPalette.watch,
    monitoring: statusPalette.monitoring
  };

  return paletteTokens[token] ?? token;
}
