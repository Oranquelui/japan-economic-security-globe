import type { Metadata } from "next";

import { ContactForm } from "../../components/ContactForm";

export const metadata: Metadata = {
  title: "問い合わせ | 日本経済安全保障マップ",
  description: "開発依頼、データ修正、不具合、取材連携などの問い合わせ窓口。"
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b1320] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">Contact</p>
          <h1 className="text-3xl font-semibold text-white">問い合わせ</h1>
          <p className="text-sm leading-7 text-slate-300">
            開発依頼、データ修正、不具合報告、取材や引用に関する連絡はこちらから送信できます。
          </p>
        </header>
        <ContactForm />
      </div>
    </main>
  );
}
