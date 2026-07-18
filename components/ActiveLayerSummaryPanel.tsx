import { getSourceFreshness } from "../lib/official/source-freshness";
import type { ThemePalette } from "../lib/presentation/palette";
import type { ActiveLayerSummary, LayerLegend } from "../types/presentation";
import type { SourceDocument } from "../types/semantic";
import { MapLegend } from "./MapLegend";

interface ActiveLayerSummaryPanelProps {
  legend: LayerLegend;
  summary: ActiveLayerSummary;
  themePalette: ThemePalette;
}

export function ActiveLayerSummaryPanel({
  legend,
  summary,
  themePalette
}: ActiveLayerSummaryPanelProps) {
  return (
    <section
      role="region"
      aria-label="いま表示中"
      className="rounded-lg border p-3"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanelElevated
      }}
    >
      <div
        className="font-mono text-[0.58rem] uppercase tracking-[0.22em]"
        style={{ color: themePalette.accentText }}
      >
        いま表示中
      </div>
      <h2 className="mt-1 text-sm font-semibold" style={{ color: themePalette.textPrimary }}>
        {summary.title}
      </h2>
      <p className="mt-1 text-[0.68rem] leading-4" style={{ color: themePalette.textMuted }}>
        {summary.description}
      </p>

      {summary.primaryMetric ? (
        <div className="mt-3">
          <div className="text-[0.6rem]" style={{ color: themePalette.textMuted }}>
            {summary.primaryMetric.label}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tabular-nums" style={{ color: themePalette.textPrimary }}>
              {summary.primaryMetric.value}
            </span>
            {summary.primaryMetric.unit ? (
              <span className="text-[0.68rem]" style={{ color: themePalette.textMuted }}>
                {summary.primaryMetric.unit}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <SummaryFact
          label={summary.coverage.label}
          value={summary.coverage.value}
          themePalette={themePalette}
        />
        <SummaryFact label="対象期間" value={summary.periodLabel} themePalette={themePalette} />
      </dl>

      <div className="mt-3 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
        <MapLegend
          legend={legend}
          mapEncodingDescription={summary.mapEncodingDescription}
          themePalette={themePalette}
        />
      </div>

      <div className="mt-3 border-t pt-3" style={{ borderColor: themePalette.borderSubtle }}>
        <h3 className="text-[0.6rem] font-semibold" style={{ color: themePalette.textMuted }}>
          出典
        </h3>
        {summary.sources.length > 0 ? (
          <ul aria-label="出典" className="mt-1.5 space-y-2">
            {summary.sources.map((source) => (
              <ActiveSource key={source.id} source={source} themePalette={themePalette} />
            ))}
          </ul>
        ) : summary.sourceFallbackLabel ? (
          <p className="mt-1 text-[0.66rem]" style={{ color: themePalette.textMuted }}>
            {summary.sourceFallbackLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SummaryFact({
  label,
  themePalette,
  value
}: {
  label: string;
  themePalette: ThemePalette;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[0.58rem]" style={{ color: themePalette.textMuted }}>
        {label}
      </dt>
      <dd className="mt-0.5 text-xs font-semibold" style={{ color: themePalette.textPrimary }}>
        {value}
      </dd>
    </div>
  );
}

function ActiveSource({
  source,
  themePalette
}: {
  source: SourceDocument;
  themePalette: ThemePalette;
}) {
  const freshness = getSourceFreshness(source);
  const sourceUrl = source.url.trim();
  const sourceLabel = sourceUrl ? (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-dotted underline-offset-4"
      style={{ color: themePalette.accentText }}
    >
      {source.label}
    </a>
  ) : (
    <span style={{ color: themePalette.textPrimary }}>{source.label}</span>
  );

  return (
    <li data-testid="active-layer-source" className="text-[0.64rem] leading-4">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">{sourceLabel}</div>
        {source.official === true ? (
          <span
            className="shrink-0 rounded-full border px-1.5 py-px text-[0.54rem] font-semibold"
            style={{
              borderColor: themePalette.borderStrong,
              background: themePalette.accentSoft,
              color: themePalette.accentText
            }}
          >
            公式
          </span>
        ) : null}
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-2" style={{ color: themePalette.textMuted }}>
        <span>{freshness.label}</span>
        <span>{freshness.accessedLabel}</span>
      </div>
    </li>
  );
}
