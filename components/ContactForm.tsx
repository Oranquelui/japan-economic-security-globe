"use client";

import { useState, type FormEvent } from "react";

import { validateContactPayload } from "../lib/contact/validation";
import { CONTACT_CATEGORIES, type ContactPayload } from "../types/contact";

const INITIAL_VALUES: ContactPayload = {
  category: "開発依頼",
  replyTo: "",
  subject: "",
  message: "",
  website: ""
};

export function ContactForm() {
  const [values, setValues] = useState<ContactPayload>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactPayload, string>>>({});

  function updateValue<Key extends keyof ContactPayload>(key: Key, value: ContactPayload[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateContactPayload(values);
    setErrors(result.errors);
  }

  return (
    <form className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200" htmlFor="contact-category">
          カテゴリ
        </label>
        <select
          id="contact-category"
          value={values.category}
          onChange={(event) => updateValue("category", event.target.value as ContactPayload["category"])}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          {CONTACT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category ? <p className="text-sm text-amber-300">{errors.category}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200" htmlFor="contact-reply-to">
          返信先メールアドレス
        </label>
        <input
          id="contact-reply-to"
          type="email"
          value={values.replyTo}
          onChange={(event) => updateValue("replyTo", event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        {errors.replyTo ? <p className="text-sm text-amber-300">{errors.replyTo}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200" htmlFor="contact-subject">
          件名
        </label>
        <input
          id="contact-subject"
          type="text"
          value={values.subject}
          onChange={(event) => updateValue("subject", event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        {errors.subject ? <p className="text-sm text-amber-300">{errors.subject}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200" htmlFor="contact-message">
          本文
        </label>
        <textarea
          id="contact-message"
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          rows={8}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        {errors.message ? <p className="text-sm text-amber-300">{errors.message}</p> : null}
      </div>

      <div className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          value={values.website}
          onChange={(event) => updateValue("website", event.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
        {errors.website ? <p>{errors.website}</p> : null}
      </div>

      <p className="text-sm leading-7 text-slate-400">
        問い合わせ対応のため返信先メールアドレスは必須です。機微な個人情報や秘密情報は送信しないでください。
      </p>

      <button
        type="submit"
        className="rounded-2xl border border-[#b67a45] bg-[#b67a45]/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-[#b67a45]/20"
      >
        送信する
      </button>
    </form>
  );
}
