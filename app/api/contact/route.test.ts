import { beforeEach, describe, expect, test, vi } from "vitest";

const { sendContactEmail } = vi.hoisted(() => ({
  sendContactEmail: vi.fn()
}));

vi.mock("../../../lib/contact/ses", () => ({
  sendContactEmail
}));

import { POST } from "./route";

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendContactEmail.mockReset();
    process.env.CONTACT_TO_EMAIL = "ai@quadrillion-ai.com";
    process.env.CONTACT_FROM_EMAIL = "no-reply@quadrillionaaa.com";
    process.env.SES_REGION = "ap-northeast-1";
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
  });

  test("returns 200 for a valid payload", async () => {
    sendContactEmail.mockResolvedValue(undefined);

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          category: "不具合・エラー",
          replyTo: "user@example.com",
          subject: "Map bug",
          message: "Details",
          website: ""
        })
      })
    );

    expect(response.status).toBe(200);
    expect(sendContactEmail).toHaveBeenCalledTimes(1);
  });

  test("returns 400 for validation errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          category: "不具合・エラー",
          replyTo: "",
          subject: "",
          message: "",
          website: ""
        })
      })
    );

    expect(response.status).toBe(400);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  test("returns 400 for honeypot submissions", async () => {
    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          category: "不具合・エラー",
          replyTo: "user@example.com",
          subject: "Map bug",
          message: "Details",
          website: "spam"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  test("returns 502 when SES delivery fails", async () => {
    sendContactEmail.mockRejectedValue(new Error("boom"));

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          category: "不具合・エラー",
          replyTo: "user@example.com",
          subject: "Map bug",
          message: "Details",
          website: ""
        })
      })
    );

    expect(response.status).toBe(502);
  });
});
