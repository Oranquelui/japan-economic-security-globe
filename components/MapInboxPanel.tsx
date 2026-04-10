"use client";

import type { ThemeView } from "../types/presentation";
import type { ThemeId } from "../types/semantic";
import type { OperationRow } from "../lib/presentation/operations";
import { getThemeLabel } from "../lib/presentation/japanese";

const THEME_ORDER: ThemeId[] = ["energy", "rice", "water", "defense", "semiconductors"];

interface MapInboxPanelProps {
  activeId: string;
  query: string;
  rows: OperationRow[];
  themeId: ThemeId;
  view: ThemeView;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onThemeChange: (themeId: ThemeId) => void;
}

export function MapInboxPanel({
  activeId,
  query,
  rows,
  themeId,
  view,
  onQueryChange,
  onSelect,
  onThemeChange
}: MapInboxPanelProps) {
  const highCount = rows.filter((row) => row.urgency === "高").length;

  return (
    <aside className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-slate-700/70 bg-[#08111d]/95 shadow-2xl shadow-black/45 lg:sticky lg:top-4 lg:grid-cols-[56px_1fr]">
      <div className="hidden border-r border-slate-700/70 bg-[#050b14] py-4 lg:flex lg:flex-col lg:items-center lg:gap-3">
        {THEME_ORDER.map((id) => {
          const theme = getThemeLabel(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => onThemeChange(id)}
              className={`grid h-10 w-10 place-items-center rounded-xl border text-[0.62rem] font-bold transition ${
                id === themeId
                  ? "border-sky-300/60 bg-sky-400/15 text-white"
                  : "border-slate-700 bg-slate-900/70 text-slate-500 hover:border-slate-500 hover:text-slate-200"
              }`}
              title={theme.label}
            >
              {theme.label.slice(0, 1)}
            </button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-col p-4">
        <div className="border-b border-slate-700/70 pb-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.36em] text-slate-500">Map Inbox</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-white">日本経済安全保障</h1>
          <p className="mt-2 text-xs leading-5 text-slate-400">日本の生活・供給網・政策判断に着地する依存シグナル。</p>
        </div>

        <label className="mt-4 block">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">検索</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="LNG、コメ、港湾、予算..."
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#030810] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-300/70"
          />
        </label>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
          >
            全部
          </button>
          <button
            type="button"
            onClick={() => onQueryChange("高")}
            className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 hover:border-amber-200/60"
          >
            高リスク
          </button>
          <button
            type="button"
            onClick={() => onQueryChange("監視中")}
            className="rounded-xl border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-xs text-sky-100 hover:border-sky-200/60"
          >
            監視中
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metric label="表示" value={rows.length} />
          <Metric label="高リスク" value={highCount} />
        </div>

        <div className="mt-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-slate-500">テーマ</p>
          <div className="mt-2 space-y-2">
            {THEME_ORDER.map((id) => {
              const theme = getThemeLabel(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onThemeChange(id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    id === themeId
                      ? "border-sky-300/50 bg-sky-300/10 text-white"
                      : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-100"
                  }`}
                >
                  <div className="text-sm font-semibold">{theme.label}</div>
                  <div className="mt-0.5 text-[0.68rem] text-slate-500">{theme.sublabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-700/70 bg-[#050b14]/80">
          <div className="border-b border-slate-700/70 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">
            シグナル
          </div>
          <div className="max-h-[42vh] overflow-auto">
            {rows.slice(0, 12).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className={`block w-full border-b border-slate-800 px-3 py-3 text-left transition ${
                  row.id === activeId ? "bg-sky-300/10 text-white" : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold">{row.label}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.6rem] text-slate-300">{row.urgency}</span>
                </div>
                <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-600">
                  {row.type} / {row.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-amber-100/80">範囲</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Phase 0 は日本向け。物流はチョークポイント、港湾、LNG受入基地、製油所まで。
          </p>
          <p className="mt-2 text-[0.68rem] text-slate-500">{view.title}</p>
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
      <div className="font-mono text-xl text-white">{value}</div>
      <div className="mt-1 text-[0.68rem] text-slate-500">{label}</div>
    </div>
  );
}
