import watchOverlays from "../../data/seed/watch-overlays.json";
import { getSourceFreshness } from "../official/source-freshness";
import { buildSignalSourceTrust } from "../official/source-trust";
import type { ThemeId } from "../../types/semantic";

export interface WatchOverlayItemViewModel {
  disclosureLabel: string;
  freshnessLabel: string;
  id: string;
  relatedIds: string[];
  summary: string;
  title: string;
  trustLabel: string;
}

interface WatchOverlaySeed {
  disclosureLabel: string;
  id: string;
  relatedIds: string[];
  sourceIds: string[];
  summary: string;
  themeIds: ThemeId[];
  title: string;
  updatedAt: string;
}

const typedWatchOverlays = watchOverlays as WatchOverlaySeed[];

export function buildWatchOverlayItems(
  themeId: ThemeId,
  activeId?: string | null,
  now = new Date()
): WatchOverlayItemViewModel[] {
  return typedWatchOverlays
    .filter((overlay) => overlay.themeIds.includes(themeId))
    .map((overlay) => ({
      disclosureLabel: overlay.disclosureLabel,
      freshnessLabel: getSourceFreshness({ accessed: overlay.updatedAt.slice(0, 10) }, now).label,
      id: overlay.id,
      relatedIds: overlay.relatedIds,
      summary: overlay.summary,
      title: overlay.title,
      trustLabel: buildSignalSourceTrust(overlay.sourceIds).label,
      _activeScore: activeId && overlay.relatedIds.includes(activeId) ? 1 : 0,
      _updatedAt: overlay.updatedAt
    }))
    .toSorted((left, right) => {
      return (
        right._activeScore - left._activeScore
        || right._updatedAt.localeCompare(left._updatedAt)
        || left.title.localeCompare(right.title, "ja")
      );
    })
    .map(({ _activeScore, _updatedAt, ...overlay }) => overlay)
    .slice(0, 3);
}
