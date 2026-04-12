import type { SourceDocument } from "../types/semantic";
import { buildSourcesLicenseCatalog } from "../lib/legal/source-catalog";

interface SourcesLicensePageProps {
  sources: SourceDocument[];
}

export function SourcesLicensePage({ sources }: SourcesLicensePageProps) {
  const catalog = buildSourcesLicenseCatalog(sources);

  return (
    <main className="min-h-screen bg-[#0b1320] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">Sources / License</p>
          <h1 className="text-3xl font-semibold text-white">出典と権利処理</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            日本経済安全保障マップで参照している出典ソース、利用方針、ライセンスの扱いをまとめています。
          </p>
        </header>

        <section className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">このサイトの利用方針</h2>
          <p className="text-sm leading-7 text-slate-300">{catalog.policySummary}</p>
        </section>

        <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">出典ソース一覧</h2>
            <p className="text-sm leading-7 text-slate-300">{catalog.sourceSummary}</p>
          </div>

          <div className="space-y-6">
            {catalog.groups.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                  <p className="text-sm leading-7 text-slate-400">{group.description}</p>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 transition hover:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[0.65rem] text-slate-300">
                          {item.accessModeLabel}
                        </span>
                        {item.tierLabel ? (
                          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[0.65rem] text-slate-300">
                            {item.tierLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-slate-400">{item.publisher}</div>
                      {item.description ? <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p> : null}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">ライセンス / 権利処理</h2>
          <p className="text-sm leading-7 text-slate-300">{catalog.licenseSummary}</p>
          <p className="text-sm leading-7 text-slate-300">
            政府・公的機関ソースは各機関の公表条件に従って参照し、民間企業ソースは再配布可能なデータセットとしてではなく、
            事実記述・要約・リンクの形で扱います。
          </p>
        </section>
      </div>
    </main>
  );
}
