import type { SourceDocument } from "../types/semantic";
import { buildSourcesLicenseCatalog } from "../lib/legal/source-catalog";
import { SourcesLicenseFooter } from "./SourcesLicenseFooter";

interface SourcesLicensePageProps {
  sources: SourceDocument[];
}

export function SourcesLicensePage({ sources }: SourcesLicensePageProps) {
  const catalog = buildSourcesLicenseCatalog(sources);

  return (
    <main className="min-h-screen bg-[#d8dde2] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4 rounded-[2rem] border border-slate-300/80 bg-[#eef1f4]/90 px-7 py-8 shadow-[0_20px_80px_rgba(82,96,112,0.12)]">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">Sources / License</p>
          <h1 className="text-3xl font-semibold text-slate-900">出典と権利処理</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            日本経済安全保障マップで参照している出典ソース、利用方針、ライセンスの扱いをまとめています。
          </p>
        </header>

        <section className="space-y-3 rounded-[2rem] border border-slate-300/80 bg-white/90 p-6 shadow-[0_16px_50px_rgba(84,96,108,0.10)]">
          <h2 className="text-xl font-semibold text-slate-900">このサイトの利用方針</h2>
          <p className="text-sm leading-7 text-slate-600">{catalog.policySummary}</p>
        </section>

        <section className="space-y-5 rounded-[2rem] border border-slate-300/80 bg-white/90 p-6 shadow-[0_16px_50px_rgba(84,96,108,0.10)]">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">出典ソース一覧</h2>
            <p className="text-sm leading-7 text-slate-600">{catalog.sourceSummary}</p>
          </div>

          <div className="space-y-6">
            {catalog.groups.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                  <p className="text-sm leading-7 text-slate-500">{group.description}</p>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[1.5rem] border border-slate-300 bg-[#f3f5f7] px-4 py-4 transition hover:border-slate-400 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                        <span className="rounded-full border border-[#c8a37c] bg-[#f3e8db] px-2 py-0.5 text-[0.65rem] text-[#82582f]">
                          {item.accessModeLabel}
                        </span>
                        {item.tierLabel ? (
                          <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[0.65rem] text-slate-600">
                            {item.tierLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">{item.publisher}</div>
                      {item.description ? <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p> : null}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-[2rem] border border-slate-300/80 bg-white/90 p-6 shadow-[0_16px_50px_rgba(84,96,108,0.10)]">
          <h2 className="text-xl font-semibold text-slate-900">ライセンス / 権利処理</h2>
          <p className="text-sm leading-7 text-slate-600">{catalog.licenseSummary}</p>
          <p className="text-sm leading-7 text-slate-600">
            政府・公的機関ソースは各機関の公表条件に従って参照し、民間企業ソースは再配布可能なデータセットとしてではなく、
            事実記述・要約・リンクの形で扱います。
          </p>
        </section>

        <SourcesLicenseFooter sharePath="/sources-license" />
      </div>
    </main>
  );
}
