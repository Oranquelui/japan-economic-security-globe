"use client";

import Link from "next/link";
import { useState } from "react";

interface SourcesLicenseFooterProps {
  sharePath: string;
}

export function SourcesLicenseFooter({ sharePath }: SourcesLicenseFooterProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window === "undefined" ? sharePath : new URL(sharePath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <footer
      role="contentinfo"
      className="rounded-[1.75rem] border border-slate-300/80 bg-[#eef1f4]/95 px-5 py-5 text-slate-700 shadow-[0_20px_70px_rgba(70,85,100,0.10)]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-slate-500">Navigation</p>
          <p className="max-w-xl text-[0.92rem] leading-6 text-slate-600">
            出典ページから main app と問い合わせに戻れるよう、このページ専用の footer に主要導線をまとめています。
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <a
            href="https://x.com/quadrillionboss"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M18.901 1.153h3.68l-8.04 9.19 9.458 12.504h-7.406l-5.8-7.584-6.638 7.584H.474l8.598-9.826L0 1.153h7.594l5.243 6.932L18.9 1.153Zm-1.292 19.49h2.04L6.486 3.24H4.298l13.31 17.403Z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-[0.92rem] font-medium text-slate-800 transition hover:border-slate-400"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 stroke-current" fill="none" strokeWidth="1.8">
            <path d="M4.25 10h11.5" strokeLinecap="round" />
            <path d="M10.75 4.5 16.25 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Main (App)
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-[0.92rem] font-medium text-slate-800 transition hover:border-slate-400"
        >
          {copied ? "コピー済み" : "共有"}
        </button>
        <Link
          href="/sources-license"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-[0.92rem] font-medium text-slate-800 transition hover:border-slate-400"
        >
          Sources/License
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-[0.92rem] font-medium text-slate-800 transition hover:border-slate-400"
        >
          問い合わせ
        </Link>
      </div>
    </footer>
  );
}
