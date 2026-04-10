"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import type { DetailViewModel, ThemeView } from "../types/presentation";
import type { SemanticGraph, ThemeId } from "../types/semantic";
import { getDetailView } from "../lib/semantic/detail";
import { getThemeView } from "../lib/semantic/selectors";
import { buildEvidenceGraph, buildGlobeFlows } from "../lib/semantic/view-models";
import {
  getThemeLabel,
  localizeAnyLabel,
  localizeKind,
  localizeObservationLabel,
  localizeSummary
} from "../lib/presentation/japanese";
import { EvidencePanel } from "./EvidencePanel";
import { JapanMainMap } from "./JapanMainMap";
import { OperationsSignalTable } from "./OperationsSignalTable";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface AppShellProps {
  graph: SemanticGraph;
}

export function AppShell({ graph }: AppShellProps) {
  const [themeId, setThemeId] = useState<ThemeId>("energy");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const view = getThemeView(graph, themeId);
  const globeFlows = buildGlobeFlows(graph, themeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const activeId = resolveActiveId(view, selectedId);
  const detail = getDetailView(graph, activeId);

  function handleThemeChange(nextThemeId: ThemeId) {
    setThemeId(nextThemeId);
    setSelectedId(null);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(255,159,47,0.18),transparent_28%),radial-gradient(circle_at_70%_10%,rgba(57,198,255,0.12),transparent_24%),#02050d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-orange-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[140px]" />

      <div className="relative grid min-h-screen grid-cols-1 gap-5 p-4 lg:grid-cols-[250px_minmax(0,1fr)_400px] lg:p-6">
        <aside className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.45em] text-orange-200/80">
              日本中心の依存インテリジェンス
            </p>
            <h1 className="mt-4 font-display text-3xl leading-[0.95] text-white">
              日本経済安全保障マップ
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              日本は何に依存し、その揺れは暮らしのどこに着地するのか。
            </p>
          </div>

          <nav className="space-y-2" aria-label="依存テーマ">
            {THEME_ORDER.map((id) => {
              const theme = getThemeLabel(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleThemeChange(id)}
                  className={`group w-full rounded-2xl border p-4 text-left transition duration-300 ${
                    id === themeId
                      ? "border-white/25 bg-white/[0.09] shadow-glow"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                  style={{ "--theme-accent": getThemeView(graph, id).accent } as CSSProperties}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">
                      {id === "energy" ? "起点" : "レイヤー"}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)] shadow-[0_0_18px_var(--theme-accent)]" />
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{theme.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{theme.sublabel}</div>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-slate-500">
              シグナル受信箱
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/[0.05] p-3">
                <div className="font-mono text-2xl text-white">{view.flows.length}</div>
                <div className="mt-1 text-xs text-slate-500">依存ルート</div>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-3">
                <div className="font-mono text-2xl text-white">{view.observations.length}</div>
                <div className="mt-1 text-xs text-slate-500">観測シグナル</div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-orange-300/20 bg-orange-300/[0.06] p-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-orange-200/80">
              範囲
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              第0段階は日本向け。物流は海上チョークポイントから日本側の港湾・LNG受入基地・製油所まで。
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          <JapanMainMap
            accent={view.accent}
            activeId={activeId}
            flows={globeFlows}
            impacts={view.japanImpacts}
            observations={view.observations}
            onSelect={setSelectedId}
            themeId={themeId}
          />

          <HeroHeader view={view} detail={detail} />

          <OperationsSignalTable activeId={activeId} onSelect={setSelectedId} view={view} />

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.36em] text-slate-500">
              セマンティックレイヤー
            </p>
            <h2 className="mt-3 font-display text-3xl text-white">1つのオントロジー、5つの公共ストーリー</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {view.observations.map((observation) => (
                <button
                  key={observation.id}
                  type="button"
                  onClick={() => setSelectedId(observation.id)}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{localizeKind(observation.kind)}</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {localizeObservationLabel(observation.id, observation.label)}
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
                    {localizeSummary(observation.id, observation.summary)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </section>

        <EvidencePanel
          accent={view.accent}
          detail={detail}
          evidenceGraph={evidenceGraph}
          onSelect={setSelectedId}
          selectedId={activeId}
          themeTitle={view.title}
        />
      </div>
    </main>
  );
}

function HeroHeader({ view, detail }: { view: ThemeView; detail: DetailViewModel }) {
  return (
    <header className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.45em] text-slate-500">
            日本地図メイン / 国際関係は根拠グラフへ
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[0.95] text-white md:text-6xl">
            {view.headline}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            主役は日本です。メインレイヤーでは、海上輸送路・受入基地・港湾・貯水池・予算項目が日本国内のどこに関係するかを表示します。
            国際的な供給国や政策根拠は右側の根拠グラフと SPARQL クエリ案で確認できます。
          </p>
        </div>
        <div className="min-w-56 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">選択中</div>
          <div className="mt-3 text-lg font-semibold text-white">{localizeAnyLabel(detail.id, detail.label)}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{localizeSummary(detail.id, detail.summary)}</p>
        </div>
      </div>
    </header>
  );
}

function resolveActiveId(view: ThemeView, selectedId: string | null): string {
  const candidateIds = new Set([
    ...view.flows.map((flow) => flow.id),
    ...view.observations.map((observation) => observation.id),
    ...view.entities.map((entity) => entity.id)
  ]);

  if (selectedId && candidateIds.has(selectedId)) {
    return selectedId;
  }

  return view.flows[0]?.id ?? view.observations[0]?.id ?? view.entities[0]?.id ?? "country:japan";
}
