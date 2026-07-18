import { DEFAULT_THEME_ID, isThemeId } from "../config/theme-registry";
import type { SemanticLayerId, WorkspaceView } from "../../types/presentation";
import type { ThemeId } from "../../types/semantic";
import type { OperationMapMode } from "./operations";
import {
  getDefaultLayerDefinition,
  getLayerDefinition,
  resolveLegacyPresentation
} from "./workspace";

export interface OperationsUrlState {
  themeId: ThemeId;
  selectedId: string | null;
  layerId: SemanticLayerId;
  mapModeOverride: OperationMapMode | null;
  workspaceView: WorkspaceView;
}

const defaultLayer = getDefaultLayerDefinition(DEFAULT_THEME_ID);

export const DEFAULT_OPERATIONS_URL_STATE: OperationsUrlState = {
  themeId: DEFAULT_THEME_ID,
  selectedId: null,
  layerId: defaultLayer.id,
  mapModeOverride: null,
  workspaceView: "map"
};

const VALID_MAP_MODES = new Set<OperationMapMode>(["point", "cluster", "choropleth", "route", "static"]);
const VALID_WORKSPACE_VIEWS = new Set<WorkspaceView>(["map", "signals", "comparison"]);

export function parseOperationsUrlState(
  source: Record<string, string | string[] | undefined> | URLSearchParams
): OperationsUrlState {
  const theme = getValue(source, "theme");
  const layer = getValue(source, "layer");
  const mode = getValue(source, "mode");
  const view = getValue(source, "view");
  const selected = getValue(source, "selected");
  const themeId = isThemeId(theme) ? theme : DEFAULT_OPERATIONS_URL_STATE.themeId;
  const semanticLayer = getLayerDefinition(themeId, layer);
  const legacyPresentation = !semanticLayer && isOperationMapMode(mode)
    ? resolveLegacyPresentation(themeId, mode)
    : null;
  const resolvedLayer = semanticLayer ?? legacyPresentation?.layer ?? getDefaultLayerDefinition(themeId);

  return {
    themeId,
    selectedId: selected?.trim() ? selected : null,
    layerId: resolvedLayer.id,
    mapModeOverride: semanticLayer ? null : legacyPresentation?.mapModeOverride ?? null,
    workspaceView: isWorkspaceView(view) ? view : "map"
  };
}

export function serializeOperationsUrlState(state: OperationsUrlState): string {
  const params = new URLSearchParams();

  if (state.themeId !== DEFAULT_OPERATIONS_URL_STATE.themeId) {
    params.set("theme", state.themeId);
  }

  if (state.mapModeOverride) {
    params.set("mode", state.mapModeOverride);
  } else if (state.layerId !== getDefaultLayerDefinition(state.themeId).id) {
    params.set("layer", state.layerId);
  }

  if (state.workspaceView !== "map") {
    params.set("view", state.workspaceView);
  }

  if (state.selectedId) {
    params.set("selected", state.selectedId);
  }

  return params.toString();
}

function getValue(
  source: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string
) {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }

  const value = source[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isOperationMapMode(value?: string): value is OperationMapMode {
  return Boolean(value && VALID_MAP_MODES.has(value as OperationMapMode));
}

function isWorkspaceView(value?: string): value is WorkspaceView {
  return Boolean(value && VALID_WORKSPACE_VIEWS.has(value as WorkspaceView));
}
