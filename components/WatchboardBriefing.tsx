import type { ThemePalette } from "../lib/presentation/palette";
import type { WatchboardBriefingViewModel } from "../lib/presentation/watchboard";

interface WatchboardBriefingProps {
  briefing: WatchboardBriefingViewModel | null;
  themePalette: ThemePalette;
  variant?: "floating" | "pane";
}

export function WatchboardBriefing({ briefing, themePalette, variant = "floating" }: WatchboardBriefingProps) {
  if (!briefing) {
    return null;
  }

  const pane = variant === "pane";

  return (
    <section
      data-testid="watchboard-briefing"
      className={
        pane
          ? "overflow-hidden rounded-xl border"
          : "overflow-hidden rounded-2xl border shadow-2xl shadow-black/35 backdrop-blur-xl"
      }
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className={pane ? "border-b px-3 py-3" : "border-b px-5 py-4"} style={{ borderColor: themePalette.borderSubtle }}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.32em]" style={{ color: themePalette.textMuted }}>
            JAPAN WATCHBOARD
          </div>
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.24em]" style={{ color: themePalette.textMuted }}>
            Source proof
          </div>
        </div>
        <h2 className={pane ? "mt-3 text-base font-semibold leading-6 text-white" : "mt-3 max-w-[34rem] text-xl font-semibold leading-7 text-white"}>
          {briefing.strategicQuestion}
        </h2>
      </div>

      <div className={pane ? "grid gap-3 p-3" : "grid gap-4 p-5"}>
        <div>
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            Now watching
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <BriefingChip accent themePalette={themePalette}>
              {briefing.rankLabel}
            </BriefingChip>
            <BriefingChip themePalette={themePalette}>{briefing.themeLabel}</BriefingChip>
            <BriefingChip themePalette={themePalette}>{briefing.freshnessLabel}</BriefingChip>
            <BriefingChip themePalette={themePalette}>{briefing.confidenceLabel}</BriefingChip>
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">{briefing.title}</h3>
          <p className={pane ? "mt-2 text-[0.78rem] leading-5 text-slate-300" : "mt-2 text-sm leading-6 text-slate-300"}>{briefing.whyNow}</p>
          <p className="mt-3 text-[0.74rem] leading-5" style={{ color: themePalette.textMuted }}>
            {briefing.japanImpact}
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-3"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated
          }}
        >
          <div className="text-[0.72rem] font-semibold text-white">{briefing.sourceProofLabel}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {briefing.proofSourceLabels.map((label) => (
              <BriefingChip key={label} themePalette={themePalette}>
                {label}
              </BriefingChip>
            ))}
          </div>
          <div className="mt-2 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
            {briefing.safetyLabel}
          </div>
        </div>
      </div>
    </section>
  );
}

function BriefingChip({
  accent = false,
  children,
  themePalette
}: {
  accent?: boolean;
  children: string;
  themePalette: ThemePalette;
}) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[0.68rem]"
      style={
        accent
          ? {
              borderColor: themePalette.accent,
              background: themePalette.accentSoft,
              color: themePalette.textPrimary
            }
          : {
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated,
              color: themePalette.textMuted
            }
      }
    >
      {children}
    </span>
  );
}
