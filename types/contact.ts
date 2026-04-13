export const CONTACT_CATEGORIES = ["開発依頼", "データ修正/追加", "不具合・エラー", "取材・引用/連携", "その他"] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface ContactPayload {
  category: ContactCategory;
  replyTo: string;
  subject: string;
  message: string;
  website: string;
}

export interface ContactValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof ContactPayload, string>>;
}
