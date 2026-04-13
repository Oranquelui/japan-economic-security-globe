import { describe, expect, test } from "vitest";

import { validateContactPayload } from "../validation";

describe("validateContactPayload", () => {
  test("requires reply email", () => {
    const result = validateContactPayload({
      category: "不具合・エラー",
      replyTo: "",
      subject: "Map bug",
      message: "Details",
      website: ""
    });

    expect(result.ok).toBe(false);
    expect(result.errors.replyTo).toContain("必須");
  });

  test("rejects the honeypot field", () => {
    const result = validateContactPayload({
      category: "不具合・エラー",
      replyTo: "user@example.com",
      subject: "Map bug",
      message: "Details",
      website: "spam"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.website).toContain("送信");
  });
});
