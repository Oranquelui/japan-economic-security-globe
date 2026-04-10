"use client";

import type { GlobeFlowViewModel } from "../types/presentation";
import type { Observation, SemanticEntity, ThemeId } from "../types/semantic";
import {
  getThemeLabel,
  localizeEntityLabel,
  localizeFlowLabel,
  localizeKind,
  localizeObservationLabel,
  localizeSummary
} from "../lib/presentation/japanese";

interface JapanMainMapProps {
  accent: string;
  activeId: string;
  flows: GlobeFlowViewModel[];
  impacts: SemanticEntity[];
  observations: Observation[];
  onSelect: (id: string) => void;
  themeId: ThemeId;
}

export function JapanMainMap({
  accent,
  activeId,
  flows,
  impacts,
  observations,
  onSelect,
  themeId
}: JapanMainMapProps) {
  const theme = getThemeLabel(themeId);
  const visibleImpacts = impacts.filter((impact) => impact.coordinates);
  const selectedFlow = flows.find((flow) => flow.id === activeId) ?? flows[0];

  return (
    <section className="relative min-h-[640px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#162231] shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_42%,rgba(255,255,255,0.1),transparent_22%),radial-gradient(circle_at_28%_74%,rgba(255,159,47,0.14),transparent_24%),linear-gradient(180deg,rgba(6,12,20,0.08),rgba(2,6,12,0.52))]" />

      <div className="relative grid min-h-[640px] grid-cols-1 lg:grid-cols-[1fr_310px]">
        <div className="relative min-h-[520px]">
          <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-[#09111d]/75 px-4 py-3 shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-slate-400">メインレイヤー</p>
            <p className="mt-1 text-lg font-semibold text-white">{theme.label}</p>
            <p className="mt-1 text-xs text-slate-400">{theme.sublabel}</p>
          </div>

          <svg viewBox="0 0 920 640" role="img" aria-label="日本中心の依存インテリジェンス地図" className="h-full min-h-[640px] w-full">
            <defs>
              <filter id="nervGlow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="seaLane" x1="0%" x2="100%">
                <stop offset="0%" stopColor={accent} stopOpacity="0" />
                <stop offset="52%" stopColor={accent} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e8fbff" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {Array.from({ length: 7 }).map((_, index) => (
              <path
                key={`contour-${index}`}
                d={`M${64 + index * 44} ${520 - index * 52} C${210 + index * 22} ${420 - index * 44}, ${
                  350 + index * 32
                } ${610 - index * 62}, ${760 - index * 14} ${182 + index * 54}`}
                fill="none"
                stroke="rgba(226,238,255,0.08)"
                strokeWidth="1"
              />
            ))}

            {flows.slice(0, 7).map((flow, index) => {
              const source = projectGlobalSource(flow.origin.coordinates?.lat ?? 0, flow.origin.coordinates?.lon ?? 0, index);
              const targetImpact = pickLandingImpact(flow, visibleImpacts);
              const target = targetImpact?.coordinates
                ? projectJapanPoint(targetImpact.coordinates.lat, targetImpact.coordinates.lon)
                : { x: 612, y: 360 };
              const isActive = flow.id === activeId;

              return (
                <g key={flow.id} onClick={() => onSelect(flow.id)} className="cursor-pointer">
                  <path
                    d={`M ${source.x} ${source.y} C ${source.x + 140} ${source.y - 70}, ${target.x - 170} ${
                      target.y + 88
                    }, ${target.x} ${target.y}`}
                    fill="none"
                    stroke="url(#seaLane)"
                    strokeDasharray={isActive ? "0" : "10 14"}
                    strokeLinecap="round"
                    strokeWidth={isActive ? 3.6 : 2}
                    opacity={isActive ? 0.95 : 0.44}
                    filter={isActive ? "url(#nervGlow)" : undefined}
                  />
                  <circle cx={source.x} cy={source.y} r={isActive ? 6 : 4} fill={accent} opacity={isActive ? 0.95 : 0.5} />
                  <text x={source.x + 12} y={source.y - 8} fill="#d6e9f9" fontSize="12" fontFamily="monospace" opacity="0.8">
                    {localizeEntityLabel(flow.origin.id, flow.origin.label)}
                  </text>
                </g>
              );
            })}

            <JapanShape />

            {visibleImpacts.map((impact) => {
              const point = projectJapanPoint(impact.coordinates!.lat, impact.coordinates!.lon);
              const isSelected = activeId === impact.id;

              return (
                <g key={impact.id} onClick={() => onSelect(impact.id)} className="cursor-pointer">
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 13 : 8}
                    fill={isSelected ? "#ffffff" : accent}
                    filter="url(#nervGlow)"
                    opacity={isSelected ? 1 : 0.78}
                  />
                  <circle cx={point.x} cy={point.y} r={isSelected ? 32 : 22} fill="none" stroke={accent} strokeOpacity="0.28" />
                  <text x={point.x + 15} y={point.y + 5} fill="#f4fbff" fontSize="13" fontWeight="700">
                    {localizeEntityLabel(impact.id, impact.label)}
                  </text>
                  <text x={point.x + 15} y={point.y + 21} fill="#a9bac8" fontSize="10" fontFamily="monospace">
                    {localizeKind(impact.kind)}
                  </text>
                </g>
              );
            })}

            <g transform="translate(36 584)">
              <text fill="#9fb0bf" fontSize="11" fontFamily="monospace">
                国際関係は日本に入るルートとして表示。詳細は右側の根拠グラフへ。
              </text>
            </g>
          </svg>
        </div>

        <aside className="relative border-t border-white/10 bg-[#090f19]/80 p-5 backdrop-blur-md lg:border-l lg:border-t-0">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">選択中</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {selectedFlow ? localizeFlowLabel(selectedFlow.id, selectedFlow.label) : theme.label}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {selectedFlow
              ? localizeSummary(selectedFlow.id, selectedFlow.label)
              : "日本国内のどこに依存リスクが着地するかを表示します。"}
          </p>

          <GlobalRouteInset accent={accent} activeId={activeId} flows={flows} onSelect={onSelect} />

          <div className="mt-6 space-y-3">
            {flows.slice(0, 5).map((flow) => (
              <button
                key={flow.id}
                type="button"
                onClick={() => onSelect(flow.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  activeId === flow.id
                    ? "border-white/30 bg-white/[0.08]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">
                  依存ルート
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{localizeFlowLabel(flow.id, flow.label)}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">国内シグナル</p>
            <div className="mt-3 space-y-2">
              {observations.slice(0, 3).map((observation) => (
                <button
                  key={observation.id}
                  type="button"
                  onClick={() => onSelect(observation.id)}
                  className="block w-full rounded-xl bg-black/20 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {localizeObservationLabel(observation.id, observation.label)}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function GlobalRouteInset({
  accent,
  activeId,
  flows,
  onSelect
}: {
  accent: string;
  activeId: string;
  flows: GlobeFlowViewModel[];
  onSelect: (id: string) => void;
}) {
  const japanPoint = { x: 226, y: 72 };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#050a12]/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">国際補助レイヤー</p>
        <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
      </div>
      <svg viewBox="0 0 270 150" role="img" aria-label="日本へ向かう国際依存ルート" className="mt-3 h-40 w-full">
        <defs>
          <filter id="globalInsetGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="270" height="150" rx="18" fill="rgba(4,10,18,0.92)" />
        {Array.from({ length: 5 }).map((_, index) => (
          <line
            key={`lat-${index}`}
            x1="14"
            x2="256"
            y1={24 + index * 25}
            y2={24 + index * 25}
            stroke="rgba(226,238,255,0.08)"
          />
        ))}
        {Array.from({ length: 7 }).map((_, index) => (
          <line
            key={`lon-${index}`}
            x1={28 + index * 36}
            x2={28 + index * 36}
            y1="14"
            y2="136"
            stroke="rgba(226,238,255,0.08)"
          />
        ))}
        <path
          d="M34 47 C48 34 72 35 85 49 C97 62 83 78 64 77 C44 75 24 64 34 47 Z"
          fill="rgba(221,236,255,0.09)"
          stroke="rgba(221,236,255,0.18)"
        />
        <path
          d="M104 42 C126 24 160 32 164 57 C168 82 138 91 116 76 C96 62 88 54 104 42 Z"
          fill="rgba(221,236,255,0.09)"
          stroke="rgba(221,236,255,0.18)"
        />
        <path
          d="M178 58 C198 42 226 46 237 66 C246 84 229 102 204 98 C184 95 164 73 178 58 Z"
          fill="rgba(221,236,255,0.09)"
          stroke="rgba(221,236,255,0.18)"
        />
        <path
          d="M194 107 C210 99 231 105 238 121 C226 133 204 134 190 123 C184 118 186 111 194 107 Z"
          fill="rgba(221,236,255,0.09)"
          stroke="rgba(221,236,255,0.18)"
        />

        {flows.slice(0, 6).map((flow, index) => {
          const source = projectWorldInset(flow.origin.coordinates?.lat ?? 0, flow.origin.coordinates?.lon ?? 0);
          const isActive = flow.id === activeId;

          return (
            <g key={flow.id} onClick={() => onSelect(flow.id)} className="cursor-pointer">
              <path
                d={`M ${source.x} ${source.y} C ${source.x + 42} ${source.y - 28 - index * 2}, ${
                  japanPoint.x - 48
                } ${japanPoint.y - 34 + index * 5}, ${japanPoint.x} ${japanPoint.y}`}
                fill="none"
                stroke={isActive ? "#ffffff" : accent}
                strokeDasharray={isActive ? "0" : "5 7"}
                strokeLinecap="round"
                strokeWidth={isActive ? 2.3 : 1.2}
                strokeOpacity={isActive ? 0.95 : 0.45}
                filter={isActive ? "url(#globalInsetGlow)" : undefined}
              />
              <circle cx={source.x} cy={source.y} r={isActive ? 4 : 2.8} fill={accent} opacity={isActive ? 1 : 0.62} />
            </g>
          );
        })}

        <circle cx={japanPoint.x} cy={japanPoint.y} r="5" fill="#ffffff" filter="url(#globalInsetGlow)" />
        <text x={japanPoint.x + 8} y={japanPoint.y + 4} fill="#f5fbff" fontSize="9" fontWeight="700">
          日本
        </text>
      </svg>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        日本が受ける影響を主にし、供給国との関係だけを補助表示します。
      </p>
    </div>
  );
}

function JapanShape() {
  return (
    <g filter="url(#nervGlow)">
      <path
        d="M650 58 C686 92 694 142 678 184 C664 222 668 256 698 288 C732 324 722 374 682 404 C646 430 638 470 660 520 C674 552 654 594 616 604 C584 612 552 588 558 546 C564 488 540 450 506 422 C468 390 470 342 506 314 C542 286 532 248 506 210 C476 166 492 116 536 96 C578 78 600 50 612 22 C622 0 636 44 650 58 Z"
        fill="rgba(235,245,255,0.08)"
        stroke="rgba(233,244,255,0.55)"
        strokeWidth="1.6"
      />
      <path
        d="M470 410 C430 426 404 454 394 494 C384 536 414 570 458 566 C492 562 512 532 506 496 C498 454 516 426 470 410 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.42)"
        strokeWidth="1.2"
      />
      <path
        d="M700 442 C730 474 722 522 690 546 C664 566 630 556 624 526 C618 494 634 462 664 446 C680 438 694 434 700 442 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.38)"
        strokeWidth="1.2"
      />
      <path
        d="M452 120 C416 138 394 176 404 212 C414 246 450 258 476 232 C502 206 494 166 472 136 C466 128 460 122 452 120 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.38)"
        strokeWidth="1.2"
      />
    </g>
  );
}

function projectJapanPoint(lat: number, lon: number): { x: number; y: number } {
  return {
    x: 360 + ((lon - 128) / 18) * 420,
    y: 38 + ((46 - lat) / 16) * 560
  };
}

function projectGlobalSource(lat: number, lon: number, index: number): { x: number; y: number } {
  if (lon > 100 && lat < 0) {
    return { x: 312, y: 514 };
  }

  if (lon > 100) {
    return { x: 302, y: 210 + index * 34 };
  }

  if (lon < -30) {
    return { x: 112, y: 245 + index * 30 };
  }

  return { x: 114, y: 170 + index * 44 };
}

function projectWorldInset(lat: number, lon: number): { x: number; y: number } {
  return {
    x: 14 + ((lon + 180) / 360) * 242,
    y: 14 + ((90 - lat) / 180) * 122
  };
}

function pickLandingImpact(flow: GlobeFlowViewModel, impacts: SemanticEntity[]): SemanticEntity | undefined {
  return (
    impacts.find((impact) => flow.route.some((route) => route.id === impact.id)) ??
    impacts.find((impact) => impact.kind === "Terminal") ??
    impacts.find((impact) => impact.kind === "Port") ??
    impacts[0]
  );
}
