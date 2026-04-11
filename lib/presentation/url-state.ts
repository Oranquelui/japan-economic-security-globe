import type { ThemeId } from "../../types/semantic";
import type { OperationMapMode } from "./operations";

export interface OperationsUrlState {
  themeId: ThemeId;
  selectedId: string | null;
  mapMode: OperationMapMode;
}

export const DEFAULT_OPERATIONS_URL_STATE: OperationsUrlState = {
  themeId: "energy",
  selectedId: null,
  mapMode: "point"
};

const VALID_THEMES = new Set<ThemeId>(["energy", "rice", "water", "defense", "semiconductors"]);
const VALID_MAP_MODES = new Set<OperationMapMode>(["point", "cluster", "choropleth", "route", "static"]);

export function parseOperationsUrlState(
  source: Record<string, string | string[] | undefined> | URLSearchParams
): OperationsUrlState {
  const theme = getValue(source, "theme");
  const mode = getValue(source, "mode");
  const selected = getValue(source, "selected");

  return {
    themeId: isThemeId(theme) ? theme : DEFAULT_OPERATIONS_URL_STATE.themeId,
    mapMode: isOperationMapMode(mode) ? mode : DEFAULT_OPERATIONS_URL_STATE.mapMode,
    selectedId: selected?.trim() ? selected : null
  };
}

export function serializeOperationsUrlState(state: OperationsUrlState): string {
  const params = new URLSearchParams();

  if (state.themeId !== DEFAULT_OPERATIONS_URL_STATE.themeId) {
    params.set("theme", state.themeId);
  }

  if (state.mapMode !== DEFAULT_OPERATIONS_URL_STATE.mapMode) {
    params.set("mode", state.mapMode);
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

function isThemeId(value?: string): value is ThemeId {
  return Boolean(value && VALID_THEMES.has(value as ThemeId));
}

function isOperationMapMode(value?: string): value is OperationMapMode {
  return Boolean(value && VALID_MAP_MODES.has(value as OperationMapMode));
}
