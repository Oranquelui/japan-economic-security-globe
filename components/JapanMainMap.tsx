"use client";

import type { GlobeFlowViewModel } from "../types/presentation";
import type { Observation, SemanticEntity, ThemeId } from "../types/semantic";
import type { OperationMapMode } from "../lib/presentation/operations";
import {
  getThemeLabel,
  localizeEntityLabel,
  localizeFlowLabel,
  localizeKind,
  localizeObservationLabel,
  localizeSummary
} from "../lib/presentation/japanese";
import { getOperationModeLabel } from "../lib/presentation/operations";

interface JapanMainMapProps {
  accent: string;
  activeId: string;
  flows: GlobeFlowViewModel[];
  impacts: SemanticEntity[];
  mapMode: OperationMapMode;
  observations: Observation[];
  onMapModeChange: (mode: OperationMapMode) => void;
  onSelect: (id: string) => void;
  resultCount: number;
  themeId: ThemeId;
}

const OPERATION_MODES: OperationMapMode[] = ["point", "cluster", "choropleth", "route", "static"];

export function JapanMainMap({
  accent,
  activeId,
  flows,
  impacts,
  mapMode,
  observations,
  onMapModeChange,
  onSelect,
  resultCount,
  themeId
}: JapanMainMapProps) {
  const theme = getThemeLabel(themeId);
  const visibleImpacts = impacts.filter((impact) => impact.coordinates);
  const selectedFlow = flows.find((flow) => flow.id === activeId) ?? flows[0];

  return (
    <section className="relative min-h-[690px] overflow-hidden rounded-2xl border border-slate-700/70 bg-[#101a28] shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(219,236,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(219,236,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(92,180,255,0.16),transparent_24%),radial-gradient(circle_at_38%_78%,rgba(255,159,47,0.12),transparent_25%),linear-gradient(180deg,rgba(6,12,20,0.04),rgba(3,8,14,0.56))]" />

      <MapToolbar
        accent={accent}
        mapMode={mapMode}
        onMapModeChange={onMapModeChange}
        resultCount={resultCount}
        themeLabel={theme.label}
      />

      <div className="absolute bottom-4 left-4 z-20 max-w-xl rounded-xl border border-slate-700/80 bg-[#050b14]/90 p-4 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">選択中</p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {selectedFlow ? localizeFlowLabel(selectedFlow.id, selectedFlow.label) : theme.label}
        </h2>
        <p className="mt-2 max-w-lg text-xs leading-5 text-slate-400">
          {selectedFlow
            ? localizeSummary(selectedFlow.id, selectedFlow.label)
            : "日本国内のどこに依存リスクが着地するかを表示します。"}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 z-20 hidden w-72 rounded-xl border border-slate-700/80 bg-[#050b14]/90 p-3 shadow-2xl backdrop-blur-md xl:block">
        <GlobalRouteInset accent={accent} activeId={activeId} flows={flows} onSelect={onSelect} />
      </div>

      <div className="absolute left-4 top-28 z-20 flex flex-col gap-2">
        {["+", "-", "⌖"].map((control) => (
          <button
            key={control}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-[#050b14]/90 text-sm text-slate-200 shadow-lg backdrop-blur-md transition hover:border-sky-300/50 hover:text-white"
          >
            {control}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 1080 690" role="img" aria-label="日本中心の依存インテリジェンス地図" className="relative z-10 h-full min-h-[690px] w-full">
        <defs>
          <filter id="operationsGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="operationsSeaLane" x1="0%" x2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="52%" stopColor={accent} stopOpacity="0.78" />
            <stop offset="100%" stopColor="#e8fbff" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {Array.from({ length: 12 }).map((_, index) => (
          <path
            key={`contour-${index}`}
            d={`M${42 + index * 58} ${614 - index * 45} C${216 + index * 18} ${466 - index * 24}, ${
              430 + index * 34
            } ${660 - index * 54}, ${1020 - index * 22} ${182 + index * 38}`}
            fill="none"
            stroke="rgba(226,238,255,0.07)"
            strokeWidth="1"
          />
        ))}

        <g opacity={mapMode === "route" ? 1 : 0.65}>
          {flows.slice(0, 8).map((flow, index) => {
            const source = projectGlobalSource(flow.origin.coordinates?.lat ?? 0, flow.origin.coordinates?.lon ?? 0, index);
            const targetImpact = pickLandingImpact(flow, visibleImpacts);
            const target = targetImpact?.coordinates
              ? projectJapanPoint(targetImpact.coordinates.lat, targetImpact.coordinates.lon)
              : { x: 712, y: 370 };
            const isActive = flow.id === activeId;

            return (
              <g key={flow.id} onClick={() => onSelect(flow.id)} className="cursor-pointer">
                <path
                  d={`M ${source.x} ${source.y} C ${source.x + 190} ${source.y - 78}, ${target.x - 210} ${
                    target.y + 108
                  }, ${target.x} ${target.y}`}
                  fill="none"
                  stroke="url(#operationsSeaLane)"
                  strokeDasharray={isActive ? "0" : "9 13"}
                  strokeLinecap="round"
                  strokeWidth={isActive ? 3.8 : 1.8}
                  opacity={isActive ? 0.96 : 0.42}
                  filter={isActive ? "url(#operationsGlow)" : undefined}
                />
                <circle cx={source.x} cy={source.y} r={isActive ? 6 : 4} fill={accent} opacity={isActive ? 0.95 : 0.5} />
                <text x={source.x + 12} y={source.y - 8} fill="#d6e9f9" fontSize="12" fontFamily="monospace" opacity="0.76">
                  {localizeEntityLabel(flow.origin.id, flow.origin.label)}
                </text>
              </g>
            );
          })}
        </g>

        <JapanShape accent={accent} mapMode={mapMode} />

        {visibleImpacts.map((impact) => {
          const point = projectJapanPoint(impact.coordinates!.lat, impact.coordinates!.lon);
          const isSelected = activeId === impact.id;

          return (
            <g key={impact.id} onClick={() => onSelect(impact.id)} className="cursor-pointer">
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 13 : 7}
                fill={isSelected ? "#ffffff" : accent}
                filter="url(#operationsGlow)"
                opacity={isSelected ? 1 : 0.82}
              />
              <circle cx={point.x} cy={point.y} r={isSelected ? 34 : 21} fill="none" stroke={accent} strokeOpacity="0.26" />
              <text x={point.x + 15} y={point.y + 5} fill="#f4fbff" fontSize="13" fontWeight="700">
                {localizeEntityLabel(impact.id, impact.label)}
              </text>
              <text x={point.x + 15} y={point.y + 21} fill="#a9bac8" fontSize="10" fontFamily="monospace">
                {localizeKind(impact.kind)}
              </text>
            </g>
          );
        })}

        <g transform="translate(760 140)">
          {observations.slice(0, 4).map((observation, index) => (
            <g key={observation.id} onClick={() => onSelect(observation.id)} className="cursor-pointer" transform={`translate(0 ${index * 58})`}>
              <rect width="250" height="42" rx="8" fill={activeId === observation.id ? "rgba(125,211,252,0.16)" : "rgba(3,8,14,0.76)"} stroke="rgba(148,163,184,0.32)" />
              <text x="12" y="17" fill="#e2f2ff" fontSize="11" fontWeight="700">
                {localizeObservationLabel(observation.id, observation.label).slice(0, 21)}
              </text>
              <text x="12" y="32" fill="#7f8ea3" fontSize="9" fontFamily="monospace">
                {localizeKind(observation.kind)}
              </text>
            </g>
          ))}
        </g>

        <g transform="translate(40 656)">
          <text fill="#9fb0bf" fontSize="11" fontFamily="monospace">
            日本が受ける影響を主語にし、国際関係は日本へ入るルートとして表示。詳細は右側の根拠グラフへ。
          </text>
        </g>
      </svg>
    </section>
  );
}

function MapToolbar({
  accent,
  mapMode,
  onMapModeChange,
  resultCount,
  themeLabel
}: {
  accent: string;
  mapMode: OperationMapMode;
  onMapModeChange: (mode: OperationMapMode) => void;
  resultCount: number;
  themeLabel: string;
}) {
  return (
    <div className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-slate-700/80 bg-[#050b14]/90 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent, boxShadow: `0 0 18px ${accent}` }} />
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">Main / Japan Operations Map</div>
            <div className="text-sm font-semibold text-white">{themeLabel} レイヤー</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {OPERATION_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onMapModeChange(mode)}
              className={`rounded-lg border px-3 py-2 text-xs transition ${
                mode === mapMode
                  ? "border-sky-300/60 bg-sky-300/15 text-white"
                  : "border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500 hover:text-slate-100"
              }`}
            >
              {getOperationModeLabel(mode)}
            </button>
          ))}
          <span className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 font-mono text-[0.65rem] text-slate-400">
            {resultCount} 件
          </span>
        </div>
      </div>
    </div>
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
    <div>
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
        <rect width="270" height="150" rx="12" fill="rgba(4,10,18,0.92)" />
        {Array.from({ length: 5 }).map((_, index) => (
          <line key={`lat-${index}`} x1="14" x2="256" y1={24 + index * 25} y2={24 + index * 25} stroke="rgba(226,238,255,0.08)" />
        ))}
        {Array.from({ length: 7 }).map((_, index) => (
          <line key={`lon-${index}`} x1={28 + index * 36} x2={28 + index * 36} y1="14" y2="136" stroke="rgba(226,238,255,0.08)" />
        ))}
        <path d="M34 47 C48 34 72 35 85 49 C97 62 83 78 64 77 C44 75 24 64 34 47 Z" fill="rgba(221,236,255,0.09)" stroke="rgba(221,236,255,0.18)" />
        <path d="M104 42 C126 24 160 32 164 57 C168 82 138 91 116 76 C96 62 88 54 104 42 Z" fill="rgba(221,236,255,0.09)" stroke="rgba(221,236,255,0.18)" />
        <path d="M178 58 C198 42 226 46 237 66 C246 84 229 102 204 98 C184 95 164 73 178 58 Z" fill="rgba(221,236,255,0.09)" stroke="rgba(221,236,255,0.18)" />
        <path d="M194 107 C210 99 231 105 238 121 C226 133 204 134 190 123 C184 118 186 111 194 107 Z" fill="rgba(221,236,255,0.09)" stroke="rgba(221,236,255,0.18)" />

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
    </div>
  );
}

function JapanShape({ accent, mapMode }: { accent: string; mapMode: OperationMapMode }) {
  const fillOpacity = mapMode === "choropleth" ? 0.22 : 0.08;

  return (
    <g filter="url(#operationsGlow)">
      <path
        d="M732 54 C768 90 776 144 758 188 C742 228 748 264 782 298 C820 336 808 392 762 424 C722 452 714 496 738 552 C754 586 730 632 686 642 C650 650 614 624 622 578 C628 516 602 474 562 442 C518 406 522 354 562 324 C602 292 592 252 562 212 C528 166 544 112 594 90 C642 70 668 42 682 14 C694 -10 716 36 732 54 Z"
        fill={mapMode === "choropleth" ? accent : "rgba(235,245,255,0.08)"}
        fillOpacity={fillOpacity}
        stroke="rgba(233,244,255,0.58)"
        strokeWidth="1.6"
      />
      <path
        d="M520 420 C474 438 444 470 432 514 C420 560 454 598 504 592 C542 586 566 552 558 512 C550 466 572 436 520 420 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.42)"
        strokeWidth="1.2"
      />
      <path
        d="M790 456 C824 492 814 544 778 570 C748 592 710 580 704 548 C698 512 716 478 750 460 C770 450 784 446 790 456 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.38)"
        strokeWidth="1.2"
      />
      <path
        d="M500 122 C460 142 436 184 448 224 C460 262 500 274 530 244 C560 214 550 170 526 138 C518 130 510 124 500 122 Z"
        fill="rgba(235,245,255,0.06)"
        stroke="rgba(233,244,255,0.38)"
        strokeWidth="1.2"
      />
    </g>
  );
}

function projectJapanPoint(lat: number, lon: number): { x: number; y: number } {
  return {
    x: 450 + ((lon - 128) / 18) * 430,
    y: 42 + ((46 - lat) / 16) * 590
  };
}

function projectGlobalSource(lat: number, lon: number, index: number): { x: number; y: number } {
  if (lon > 100 && lat < 0) {
    return { x: 348, y: 556 };
  }

  if (lon > 100) {
    return { x: 334, y: 236 + index * 34 };
  }

  if (lon < -30) {
    return { x: 122, y: 266 + index * 30 };
  }

  return { x: 120, y: 184 + index * 44 };
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
