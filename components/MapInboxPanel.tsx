"use client";

import type { ThemeView } from "../types/presentation";
import type { ThemeId } from "../types/semantic";
import type { OperationRow } from "../lib/presentation/operations";
import type { StatusPalette, ThemePalette } from "../lib/presentation/palette";
import { getThemeLabel, getThemeQuestion } from "../lib/presentation/japanese";
import { getUrgencyTone, resolveToneColor } from "../lib/presentation/palette";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface MapInboxPanelProps {
  activeId: string;
  collapsed: boolean;
  query: string;
  rows: OperationRow[];
  statusPalette: StatusPalette;
  themePalette: ThemePalette;
  themeId: ThemeId;
  view: ThemeView;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onToggleCollapsed: () => void;
  onThemeChange: (themeId: ThemeId) => void;
}

export function MapInboxPanel({
  activeId,
  collapsed,
  query,
  rows,
  statusPalette,
  themePalette,
  themeId,
  view,
  onQueryChange,
  onSelect,
  onToggleCollapsed,
  onThemeChange
}: MapInboxPanelProps) {
  const highCount = rows.filter((row) => row.urgency === "高").length;
  const question = getThemeQuestion(themeId);

  if (collapsed) {
    return (
      <aside
        className="flex h-full flex-col items-center rounded-2xl border py-3 shadow-2xl shadow-black/45"
        style={{
          borderColor: themePalette.borderSubtle,
          background: themePalette.surfacePanel
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid h-10 w-10 place-items-center rounded-xl border text-lg transition"
          style={{
            borderColor: themePalette.accent,
            background: themePalette.accentSoft,
            color: themePalette.textPrimary
          }}
          aria-label="Map Inbox を開く"
        >
          ≡
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          {THEME_ORDER.map((id) => {
            const theme = getThemeLabel(id);
            const isActive = id === themeId;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onThemeChange(id)}
                className="grid h-10 w-10 place-items-center rounded-xl border text-[0.62rem] font-bold transition"
                style={
                  isActive
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
                title={theme.label}
              >
                {theme.label.slice(0, 1)}
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
          <SignalPill color={themePalette.accent} label={`${rows.length}`} />
          <SignalPill color={statusPalette.high} label={`${highCount}`} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/25"
      style={{
        borderColor: themePalette.borderSubtle,
        background: themePalette.surfacePanel
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="pb-4" style={{ borderBottom: `1px solid ${themePalette.borderSubtle}` }}>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.36em]" style={{ color: themePalette.textMuted }}>
            Story Navigator
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">{getThemeLabel(themeId).label}</h2>
              <p className="mt-1 text-[0.68rem] leading-5" style={{ color: themePalette.textMuted }}>
                {view.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full border px-2 py-1 text-[0.65rem]"
                style={{
                  borderColor: themePalette.borderSubtle,
                  background: themePalette.surfacePanelElevated,
                  color: themePalette.textMuted
                }}
              >
                {rows.length}件
              </span>
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="grid h-8 w-8 place-items-center rounded-lg border text-sm transition"
                style={{
                  borderColor: themePalette.borderSubtle,
                  background: themePalette.surfacePanelElevated,
                  color: themePalette.textMuted
                }}
                aria-label="Map Inbox を閉じる"
              >
                ←
              </button>
            </div>
          </div>
          <p className="mt-3 text-[0.72rem] leading-5" style={{ color: themePalette.textMuted }}>
            {question}
          </p>
        </div>

        <div className="mt-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            Presets
          </p>
          <div
            className="mt-2 overflow-hidden rounded-xl border"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          >
            {THEME_ORDER.map((id) => {
              const theme = getThemeLabel(id);
              const isActive = id === themeId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onThemeChange(id)}
                  className="w-full border-b px-3 py-3 text-left transition last:border-b-0"
                  style={
                    isActive
                      ? {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: `2px solid ${themePalette.accent}`,
                          background: "rgba(255,255,255,0.03)",
                          color: themePalette.textPrimary
                        }
                      : {
                          borderBottomColor: themePalette.borderSubtle,
                          borderLeft: "2px solid transparent",
                          background: "transparent",
                          color: themePalette.textMuted
                        }
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{theme.label}</div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full" style={{ background: themePalette.accent }} />
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[0.68rem]" style={{ color: isActive ? themePalette.accentText : themePalette.textMuted }}>
                    {theme.sublabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em]" style={{ color: themePalette.textMuted }}>
            Filters
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="LNG、コメ、港湾、予算..."
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated
            }}
          />
        </label>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="rounded-xl border px-3 py-2 text-xs"
            style={{
              borderColor: themePalette.borderSubtle,
              background: themePalette.surfacePanelElevated,
              color: themePalette.textPrimary
            }}
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => onQueryChange("高")}
            className="rounded-xl border px-3 py-2 text-xs"
            style={{
              borderColor: `${statusPalette.high}66`,
              background: `${statusPalette.high}1c`,
              color: statusPalette.high
            }}
          >
            高リスク
          </button>
          <button
            type="button"
            onClick={() => onQueryChange("監視中")}
            className="rounded-xl border px-3 py-2 text-xs"
            style={{
              borderColor: `${statusPalette.monitoring}66`,
              background: `${statusPalette.monitoring}1c`,
              color: statusPalette.monitoring
            }}
          >
            監視中
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SignalPill color={themePalette.accent} label={`表示 ${rows.length}`} />
          <SignalPill color={statusPalette.high} label={`高リスク ${highCount}`} />
          <SignalPill color={statusPalette.monitoring} label={`監視中 ${rows.filter((row) => row.status === "監視中").length}`} />
        </div>

        <div
          className="mt-5 min-h-0 flex-1 overflow-hidden rounded-xl border"
          style={{
            borderColor: themePalette.borderSubtle,
            background: themePalette.surfacePanelElevated
          }}
        >
          <div
            className="px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.24em]"
            style={{
              borderBottom: `1px solid ${themePalette.borderSubtle}`,
              color: themePalette.textMuted
            }}
          >
            Inbox
          </div>
          <div className="max-h-[42vh] overflow-auto">
            {rows.slice(0, 12).map((row) => (
              <SignalButton
                key={row.id}
                active={row.id === activeId}
                label={row.label}
                meta={`${row.type} / ${row.status}`}
                onClick={() => onSelect(row.id)}
                themePalette={themePalette}
                toneColor={resolveToneColor(getUrgencyTone(row.urgency), themePalette, statusPalette)}
                urgency={row.urgency}
              />
            ))}
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border p-3"
          style={{
            borderColor: `${themePalette.accent}33`,
            background: themePalette.accentSoft
          }}
        >
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em]" style={{ color: themePalette.accentText }}>
            Current Lens
          </p>
          <p className="mt-2 text-xs leading-5" style={{ color: themePalette.textPrimary }}>
            {question}
          </p>
          <p className="mt-2 text-[0.68rem]" style={{ color: themePalette.textMuted }}>
            Phase 0 は日本向け。物流はチョークポイント、港湾、LNG受入基地、製油所まで。
          </p>
        </div>
      </div>
    </aside>
  );
}

function SignalPill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[0.68rem]"
      style={{
        borderColor: `${color}66`,
        background: `${color}14`,
        color
      }}
    >
      {label}
    </span>
  );
}

function SignalButton({
  active,
  label,
  meta,
  onClick,
  themePalette,
  toneColor,
  urgency
}: {
  active: boolean;
  label: string;
  meta: string;
  onClick: () => void;
  themePalette: ThemePalette;
  toneColor: string;
  urgency: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full border-b px-3 py-3 text-left transition"
      style={{
        borderBottomColor: themePalette.borderSubtle,
        background: active ? themePalette.accentSoft : "transparent",
        color: active ? themePalette.textPrimary : themePalette.textMuted
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">{label}</span>
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[0.6rem]"
          style={{
            background: `${toneColor}22`,
            color: toneColor
          }}
        >
          {urgency}
        </span>
      </div>
      <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: themePalette.textMuted }}>
        {meta}
      </div>
    </button>
  );
}
