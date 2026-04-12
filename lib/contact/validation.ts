import { CONTACT_CATEGORIES, type ContactPayload, type ContactValidationResult } from "../../types/contact";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactPayload(payload: ContactPayload): ContactValidationResult {
  const errors: ContactValidationResult["errors"] = {};

  if (!CONTACT_CATEGORIES.includes(payload.category)) {
    errors.category = "カテゴリを選択してください。";
  }

  if (!payload.replyTo.trim()) {
    errors.replyTo = "返信先メールアドレスは必須です。";
  } else if (!EMAIL_PATTERN.test(payload.replyTo.trim())) {
    errors.replyTo = "返信先メールアドレスの形式が正しくありません。";
  }

  if (!payload.subject.trim()) {
    errors.subject = "件名は必須です。";
  } else if (payload.subject.trim().length > 160) {
    errors.subject = "件名は160文字以内で入力してください。";
  }

  if (!payload.message.trim()) {
    errors.message = "本文は必須です。";
  } else if (payload.message.trim().length > 4000) {
    errors.message = "本文は4000文字以内で入力してください。";
  }

  if (payload.website.trim()) {
    errors.website = "この送信は受け付けられませんでした。";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}
