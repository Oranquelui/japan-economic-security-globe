"use client";

import type { DetailViewModel, EvidenceGraphViewModel } from "../types/presentation";
import {
  localizeAnyLabel,
  localizeKind,
  localizePublisher,
  localizeSourceLabel,
  localizeSummary,
  localizeWhyItMatters
} from "../lib/presentation/japanese";
import { toStableSvgNumber } from "../lib/presentation/svg";

interface EvidencePanelProps {
  accent: string;
  detail: DetailViewModel;
  evidenceGraph: EvidenceGraphViewModel;
  onSelect: (id: string) => void;
  selectedId: string;
  themeTitle: string;
}

export function EvidencePanel({
  accent,
  detail,
  evidenceGraph,
  onSelect,
  selectedId,
  themeTitle
}: EvidencePanelProps) {
  return (
    <aside className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4 shadow-2xl shadow-black/45 backdrop-blur-xl lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.36em] text-slate-500">Evidence Drilldown</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{themeTitle}</h2>
        </div>
        <span className="h-3 w-3 rounded-full" style={{ background: accent, boxShadow: `0 0 24px ${accent}` }} />
      </div>

      <section className="mt-6 rounded-xl border border-slate-700/70 bg-white/[0.04] p-5">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">{localizeKind(detail.kind)}</div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-white">{localizeAnyLabel(detail.id, detail.label)}</h3>
        <p className="mt-4 text-sm leading-6 text-slate-300">{localizeSummary(detail.id, detail.summary)}</p>
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">日本にとっての意味</div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{localizeWhyItMatters(detail.id, detail.whyItMatters)}</p>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/70 bg-white/[0.035] p-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">根拠グラフ</div>
        <EvidenceGraph graph={evidenceGraph} accent={accent} onSelect={onSelect} selectedId={selectedId} />
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/70 bg-white/[0.035] p-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">関連エンティティ</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.relatedEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => onSelect(entity.id)}
              className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              {entity.flagEmoji ? `${entity.flagEmoji} ` : ""}
              {localizeAnyLabel(entity.id, entity.label)}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/70 bg-white/[0.035] p-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">出典文書</div>
        <div className="mt-3 space-y-3">
          {detail.sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-white/10 bg-slate-950/65 p-3 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="text-sm font-semibold text-white">{localizeSourceLabel(source.id, source.label)}</div>
              <div className="mt-1 text-xs text-slate-500">{localizePublisher(source.publisher)}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/70 bg-[#02040a] p-4">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500">SPARQL クエリ案</div>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/60 p-4 font-mono text-[0.68rem] leading-5 text-cyan-100">
          {detail.sparql.query}
        </pre>
      </section>
    </aside>
  );
}

function EvidenceGraph({
  accent,
  graph,
  onSelect,
  selectedId
}: {
  accent: string;
  graph: EvidenceGraphViewModel;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  const nodes = graph.nodes.slice(0, 12);
  const positions = new Map(
    nodes.map((node, index) => {
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = index === 0 ? 0 : 105;
      return [
        node.id,
        {
          x: toStableSvgNumber(150 + Math.cos(angle) * radius),
          y: toStableSvgNumber(140 + Math.sin(angle) * radius)
        }
      ] as const;
    })
  );

  return (
    <svg viewBox="0 0 300 280" className="mt-4 h-72 w-full overflow-visible">
      {graph.links.slice(0, 18).map((link) => {
        const source = positions.get(link.source);
        const target = positions.get(link.target);

        if (!source || !target) {
          return null;
        }

        return (
          <line
            key={link.id}
            x1={source.x}
            x2={target.x}
            y1={source.y}
            y2={target.y}
            stroke={accent}
            strokeOpacity="0.24"
          />
        );
      })}
      {nodes.map((node) => {
        const position = positions.get(node.id)!;
        const isSelected = node.id === selectedId;

        return (
          <g key={node.id} onClick={() => onSelect(node.id)} className="cursor-pointer">
            <circle
              cx={position.x}
              cy={position.y}
              r={isSelected ? 13 : 9}
              fill={isSelected ? "#ffffff" : accent}
              opacity={isSelected ? 1 : 0.72}
            />
            <text
              x={toStableSvgNumber(position.x + 13)}
              y={toStableSvgNumber(position.y + 4)}
              fill="#dcecff"
              fontSize="9"
              fontFamily="monospace"
            >
              {localizeAnyLabel(node.id, node.label).slice(0, 24)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
