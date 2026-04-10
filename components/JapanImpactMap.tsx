"use client";

import type { Observation, SemanticEntity, ThemeId } from "../types/semantic";
import {
  getThemeLabel,
  localizeEntityLabel,
  localizeKind,
  localizeObservationLabel,
  localizeSummary
} from "../lib/presentation/japanese";

interface JapanImpactMapProps {
  accent: string;
  impacts: SemanticEntity[];
  observations: Observation[];
  onSelect: (id: string) => void;
  selectedId: string;
  themeId: ThemeId;
}

export function JapanImpactMap({
  accent,
  impacts,
  observations,
  onSelect,
  selectedId,
  themeId
}: JapanImpactMapProps) {
  const theme = getThemeLabel(themeId);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/50 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.36em] text-slate-500">
            国内影響マップ
          </p>
          <h2 className="mt-3 font-display text-3xl text-white">依存リスクが国内で着地する場所</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-400">
          {theme.label}
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_0.95fr]">
          <svg viewBox="0 0 320 460" role="img" aria-label="日本国内の依存影響マップ" className="h-[360px] w-full">
          <defs>
            <filter id="mapGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M210 42 C232 66 236 102 224 134 C214 162 216 192 236 214 C258 238 252 274 226 292 C202 310 196 338 212 372 C222 394 210 424 184 432 C164 438 142 420 146 392 C151 352 134 326 112 308 C86 286 88 252 112 232 C136 212 130 186 112 160 C92 130 102 96 132 84 C158 72 172 52 180 32 C186 18 200 24 210 42 Z"
            fill="rgba(255,255,255,0.055)"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.2"
          />
          <path
            d="M88 302 C62 312 44 330 38 356 C32 382 50 404 78 402 C102 400 114 380 110 354 C106 326 116 314 88 302 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.2)"
          />
          <path
            d="M244 328 C260 350 254 382 232 398 C216 410 194 404 190 384 C186 364 196 342 216 330 C228 324 238 322 244 328 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.2)"
          />
          <path
            d="M84 92 C62 102 48 128 54 152 C60 174 84 182 100 166 C116 150 112 122 98 102 C94 96 90 92 84 92 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.2)"
          />
          {impacts
            .filter((impact) => impact.coordinates)
            .map((impact) => {
              const point = projectJapanPoint(impact.coordinates!.lat, impact.coordinates!.lon);
              const isSelected = selectedId === impact.id;

              return (
                <g key={impact.id} role="button" tabIndex={0} onClick={() => onSelect(impact.id)}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 12 : 8}
                    fill={accent}
                    filter="url(#mapGlow)"
                    opacity={isSelected ? 0.95 : 0.58}
                  />
                  <circle cx={point.x} cy={point.y} r={isSelected ? 28 : 20} fill="none" stroke={accent} opacity="0.22" />
                  <text x={point.x + 14} y={point.y + 4} fill="#eaf6ff" fontSize="12" fontFamily="monospace">
                    {localizeEntityLabel(impact.id, impact.label)}
                  </text>
                </g>
              );
            })}
        </svg>

        <div className="space-y-3">
          {impacts.slice(0, 5).map((impact) => (
            <button
              key={impact.id}
              type="button"
              onClick={() => onSelect(impact.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === impact.id
                  ? "border-white/30 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{localizeKind(impact.kind)}</div>
              <div className="mt-2 font-semibold text-white">{localizeEntityLabel(impact.id, impact.label)}</div>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                {localizeSummary(impact.id, impact.summary)}
              </p>
            </button>
          ))}
          {observations.slice(0, 2).map((observation) => (
            <button
              key={observation.id}
              type="button"
              onClick={() => onSelect(observation.id)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25"
            >
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">観測指標</div>
              <div className="mt-2 font-semibold text-white">
                {localizeObservationLabel(observation.id, observation.label)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function projectJapanPoint(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon - 128) / 18) * 320,
    y: ((46 - lat) / 16) * 460
  };
}
