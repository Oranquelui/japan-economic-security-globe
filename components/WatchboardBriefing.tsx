import type { ThemePalette } from "../lib/presentation/palette";
import type { WatchboardBriefingViewModel } from "../lib/presentation/watchboard";

interface WatchboardBriefingProps {
  briefing: WatchboardBriefingViewModel | null;
  themePalette: ThemePalette;
}

export function WatchboardBriefing({ briefing, themePalette }: WatchboardBriefingProps) {
  if (!briefing) {
    return null;
  }

  return (
    <section
      data-testid="watchboard-briefing"
      className="rounded-2xl border p-4 shadow-lg backdrop-blur-xl"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
        今日の注視
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BriefingChip accent themePalette={themePalette}>
          {briefing.rankLabel}
        </BriefingChip>
        <BriefingChip themePalette={themePalette}>{briefing.themeLabel}</BriefingChip>
        <BriefingChip themePalette={themePalette}>{briefing.freshnessLabel}</BriefingChip>
        <BriefingChip themePalette={themePalette}>{briefing.confidenceLabel}</BriefingChip>
      </div>
      <h2 className="mt-3 text-base font-semibold text-white">{briefing.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{briefing.whyNow}</p>
      <p className="mt-3 text-[0.74rem] leading-5" style={{ color: themePalette.textMuted }}>
        {briefing.japanImpact}
      </p>
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
