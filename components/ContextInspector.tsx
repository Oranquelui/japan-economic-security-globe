"use client";

import type { RankingExplanationViewModel } from "../lib/ranking/explain";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import type { EvidenceGraphViewModel, SelectionInspectorViewModel } from "../types/presentation";
import { EvidenceSurface } from "./EvidencePanel";

interface ContextInspectorProps {
  inspector: SelectionInspectorViewModel;
  evidenceGraph: EvidenceGraphViewModel;
  onClose: () => void;
  onSelect: (id: string) => void;
  rankingExplanation?: RankingExplanationViewModel | null;
  selectedId: string;
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  themeTitle: string;
}

export function ContextInspector({
  evidenceGraph,
  inspector,
  onClose,
  onSelect,
  rankingExplanation,
  selectedId,
  statusPalette,
  themePalette,
  themeTitle
}: ContextInspectorProps) {
  return (
    <EvidenceSurface
      ariaLabel="選択中の詳細と根拠"
      collapsed={false}
      collapsible={false}
      detail={inspector.detail}
      evidenceGraph={evidenceGraph}
      onClose={onClose}
      onSelect={onSelect}
      onToggleCollapsed={() => undefined}
      primaryMetric={inspector.primaryMetric}
      rankingExplanation={rankingExplanation}
      rootTestId="context-inspector"
      selectedId={selectedId}
      statusPalette={statusPalette}
      themePalette={themePalette}
      themeTitle={themeTitle}
    />
  );
}
