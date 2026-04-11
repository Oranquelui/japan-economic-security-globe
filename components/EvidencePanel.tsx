"use client";

import { useState, type ReactNode } from "react";

import type { DetailViewModel, EvidenceGraphViewModel } from "../types/presentation";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
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
  collapsed: boolean;
  collapsible?: boolean;
  detail: DetailViewModel;
  evidenceGraph: EvidenceGraphViewModel;
  onSelect: (id: string) => void;
  onToggleCollapsed: () => void;
  selectedId: string;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  themeTitle: string;
}

export function EvidencePanel({
  collapsed,
  collapsible = true,
  detail,
  evidenceGraph,
  onSelect,
  onToggleCollapsed,
  selectedId,
  statusPalette,
  themePalette,
  themeTitle
}: EvidencePanelProps) {
  const [tab, setTab] = useState<"summary" | "sources" | "sparql">("summary");

  if (collapsible && collapsed) {
    return (
      <aside
        className="flex h-full flex-col items-center border-l py-3 backdrop-blur-xl"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanel
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid h-10 w-10 place-items-center rounded-xl border text-sm transition"
          style={{
            borderColor: themePalette.accent,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary
          }}
          aria-label="Evidence Drilldown を開く"
        >
          根
        </button>
        <div
          className="mt-3 h-2.5 w-2.5 rounded-full"
          style={{
            background: themePalette.accent,
            boxShadow: `0 0 16px ${themePalette.accent}`
          }}
        />
        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
          <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
            {detail.sources.length}
          </PanelChip>
          <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
            {detail.relatedEntities.length}
          </PanelChip>
        </div>
      </aside>
    );
  }

  return (
      <aside
      className="h-full overflow-y-auto border-l p-4 backdrop-blur-xl"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: themePalette.textMuted }}>
            根拠
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{localizeAnyLabel(detail.id, detail.label)}</h2>
          <p className="mt-1 text-[0.72rem]" style={{ color: themePalette.textMuted }}>
            {themeTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{
              background: themePalette.accent,
              boxShadow: `0 0 24px ${themePalette.accent}`
            }}
          />
          {collapsible ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="grid h-8 w-8 place-items-center rounded-lg border text-sm transition"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanelElevated,
                color: themePalette.textMuted
              }}
              aria-label="Evidence Drilldown を閉じる"
            >
              →
            </button>
          ) : null}
        </div>
      </div>

      <section
        className="mt-5 rounded-xl border p-4"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanelElevated
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
            {localizeKind(detail.kind)}
          </PanelChip>
          <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
            {detail.sources.length} 出典
          </PanelChip>
          <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
            {detail.relatedEntities.length} 関連
          </PanelChip>
        </div>
        <p className="mt-3 text-[0.82rem] leading-6 text-slate-300">{localizeSummary(detail.id, detail.summary)}</p>

        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
          <TabButton active={tab === "summary"} onClick={() => setTab("summary")} themePalette={themePalette}>
            概要
          </TabButton>
          <TabButton active={tab === "sources"} onClick={() => setTab("sources")} themePalette={themePalette}>
            出典
          </TabButton>
          <TabButton active={tab === "sparql"} onClick={() => setTab("sparql")} themePalette={themePalette}>
            SPARQL
          </TabButton>
        </div>

        {tab === "summary" ? (
          <div className="mt-4 space-y-4">
            <FactRow label="日本にとっての意味" themePalette={themePalette} value={localizeWhyItMatters(detail.id, detail.whyItMatters)} />
            <section
              className="rounded-xl border p-4"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanel
              }}
            >
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
                関係グラフ
              </div>
              <EvidenceGraph
                graph={evidenceGraph}
                onSelect={onSelect}
                selectedId={selectedId}
                statusPalette={statusPalette}
                themePalette={themePalette}
              />
            </section>
            {detail.relatedEntities.length ? (
              <section
                className="rounded-xl border p-4"
                style={{
                  borderColor: themePalette.borderSubtle,
                  background: themePalette.surfacePanel
                }}
              >
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
                  関連エンティティ
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.relatedEntities.slice(0, 8).map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => onSelect(entity.id)}
                      className="rounded-full border px-3 py-2 text-xs transition hover:text-white"
                      style={{
                        borderColor: themePalette.borderSubtle,
                        background: themePalette.surfacePanelElevated,
                        color: themePalette.textMuted
                      }}
                    >
                      {entity.flagEmoji ? `${entity.flagEmoji} ` : ""}
                      {localizeAnyLabel(entity.id, entity.label)}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {tab === "sources" ? (
          <div className="mt-4 space-y-4">
            <section
              className="rounded-xl border p-4"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanel
              }}
            >
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
                出典文書
              </div>
              <div className="mt-3 space-y-3">
                {detail.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border p-3 transition hover:bg-white/[0.06]"
                    style={{
                      borderColor: themePalette.borderSubtle,
                      background: themePalette.surfacePanel
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">{localizeSourceLabel(source.id, source.label)}</div>
                      {source.official !== false ? (
                        <PanelChip borderColor={themePalette.accent} textColor={themePalette.textPrimary}>
                          公式
                        </PanelChip>
                      ) : (
                        <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
                          補助
                        </PanelChip>
                      )}
                      {source.accessMode ? (
                        <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
                          {getSourceModeLabel(source.accessMode)}
                        </PanelChip>
                      ) : null}
                      {source.tier ? (
                        <PanelChip borderColor={themePalette.borderSubtle} textColor={themePalette.textMuted}>
                          Tier {source.tier}
                        </PanelChip>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: themePalette.textMuted }}>
                      {localizePublisher(source.publisher)}
                    </div>
                    {source.description ? (
                      <div className="mt-2 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>
                        {source.description}
                      </div>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "sparql" ? (
          <div className="mt-4 space-y-4">
            <section
              className="rounded-xl border p-4"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanel
              }}
            >
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
                SPARQL クエリ案
              </div>
              <pre
                className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl p-4 font-mono text-[0.68rem] leading-5"
                style={{ background: "rgba(24, 28, 33, 0.92)", color: "#d8e5ee" }}
              >
                {detail.sparql.query}
              </pre>
            </section>

            <section
              className="rounded-xl border p-4"
              style={{
                borderColor: themePalette.borderSubtle,
                background: themePalette.surfacePanelElevated
              }}
            >
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em]" style={{ color: themePalette.textMuted }}>
                関連エンティティ
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.relatedEntities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => onSelect(entity.id)}
                    className="rounded-full border px-3 py-2 text-xs transition hover:text-white"
                    style={{
                      borderColor: themePalette.borderSubtle,
                      background: themePalette.surfacePanel,
                      color: themePalette.textMuted
                    }}
                  >
                    {entity.flagEmoji ? `${entity.flagEmoji} ` : ""}
                    {localizeAnyLabel(entity.id, entity.label)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function getSourceModeLabel(mode: "api" | "sparql" | "csv" | "excel" | "pdf" | "html") {
  switch (mode) {
    case "api":
      return "API";
    case "sparql":
      return "SPARQL";
    case "csv":
      return "CSV";
    case "excel":
      return "Excel";
    case "pdf":
      return "PDF";
    case "html":
      return "公開資料";
  }
}

function EvidenceGraph({
  graph,
  onSelect,
  selectedId,
  statusPalette,
  themePalette
}: {
  graph: EvidenceGraphViewModel;
  onSelect: (id: string) => void;
  selectedId: string;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
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
            stroke={themePalette.accent}
            strokeOpacity="0.24"
          />
        );
      })}
      {nodes.map((node) => {
        const position = positions.get(node.id)!;
        const isSelected = node.id === selectedId;

        return (
          <g
            key={node.id}
            onClick={() => onSelect(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(node.id);
              }
            }}
            className="cursor-pointer focus:outline-none"
            role="button"
            tabIndex={0}
            aria-label={`根拠ノード ${localizeAnyLabel(node.id, node.label)}`}
          >
            <circle
              cx={position.x}
              cy={position.y}
              r={isSelected ? 13 : 9}
              fill={isSelected ? statusPalette.selected : themePalette.accent}
              opacity={isSelected ? 1 : 0.72}
            />
            <text
              x={toStableSvgNumber(position.x + 13)}
              y={toStableSvgNumber(position.y + 4)}
              fill={themePalette.textPrimary}
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

function TabButton({
  active,
  children,
  onClick,
  themePalette
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  themePalette: ThemePalette;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-xs transition"
      style={
        active
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
    </button>
  );
}

function PanelChip({
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
      className="rounded-full border px-2.5 py-1 text-[0.68rem]"
      style={{ borderColor, color: textColor, background: "rgba(24, 28, 33, 0.92)" }}
    >
      {children}
    </span>
  );
}

function FactRow({
  label,
  themePalette,
  value
}: {
  label: string;
  themePalette: ThemePalette;
  value: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-200">{value}</div>
    </div>
  );
}
