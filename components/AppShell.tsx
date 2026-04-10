"use client";

import { useState, useTransition } from "react";

import type { ThemeView } from "../types/presentation";
import type { SemanticGraph, ThemeId } from "../types/semantic";
import { getDetailView } from "../lib/semantic/detail";
import { getThemeView } from "../lib/semantic/selectors";
import { buildEvidenceGraph, buildGlobeFlows } from "../lib/semantic/view-models";
import { buildOperationRows, filterOperationRows, type OperationMapMode } from "../lib/presentation/operations";
import { EvidencePanel } from "./EvidencePanel";
import { JapanMainMap } from "./JapanMainMap";
import { MapInboxPanel } from "./MapInboxPanel";
import { OperationsSignalTable } from "./OperationsSignalTable";

interface AppShellProps {
  graph: SemanticGraph;
}

export function AppShell({ graph }: AppShellProps) {
  const [themeId, setThemeId] = useState<ThemeId>("energy");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<OperationMapMode>("route");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  const view = getThemeView(graph, themeId);
  const globeFlows = buildGlobeFlows(graph, themeId);
  const evidenceGraph = buildEvidenceGraph(graph, themeId);
  const operationRows = buildOperationRows(view);
  const filteredOperationRows = filterOperationRows(operationRows, searchQuery);
  const activeId = resolveActiveId(view, selectedId);
  const detail = getDetailView(graph, activeId);

  function handleThemeChange(nextThemeId: ThemeId) {
    startTransition(() => {
      setThemeId(nextThemeId);
      setSelectedId(null);
      setSearchQuery("");
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(255,159,47,0.18),transparent_28%),radial-gradient(circle_at_70%_10%,rgba(57,198,255,0.12),transparent_24%),#02050d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-orange-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-[140px]" />

      <div className="relative grid min-h-screen grid-cols-1 gap-4 p-3 lg:grid-cols-[340px_minmax(0,1fr)_370px] lg:p-4">
        <MapInboxPanel
          activeId={activeId}
          query={searchQuery}
          rows={filteredOperationRows}
          themeId={themeId}
          view={view}
          onQueryChange={setSearchQuery}
          onSelect={setSelectedId}
          onThemeChange={handleThemeChange}
        />

        <section className="flex min-w-0 flex-col gap-5">
          <JapanMainMap
            accent={view.accent}
            activeId={activeId}
            flows={globeFlows}
            impacts={view.japanImpacts}
            mapMode={mapMode}
            observations={view.observations}
            onMapModeChange={setMapMode}
            onSelect={setSelectedId}
            resultCount={filteredOperationRows.length}
            themeId={themeId}
          />

          <OperationsSignalTable activeId={activeId} onSelect={setSelectedId} rows={filteredOperationRows} />

          <section className="rounded-2xl border border-slate-700/70 bg-[#07101b]/85 p-5 backdrop-blur-xl">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.36em] text-slate-500">
              セマンティックレイヤー
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">1つのオントロジー、地図・表・根拠グラフの3表示</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              主語は日本です。地図は国内着地点、表は運用シグナル、右側は出典・政策・SPARQLの根拠関係を表示します。
              国際供給国は主画面の補助ルートとして扱い、判断の軸を日本側の生活・施設・政策へ戻します。
            </p>
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
