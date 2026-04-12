import { describe, expect, test, vi } from "vitest";

import type { ContactPayload } from "../../../types/contact";
import { buildSesSendEmailRequest, sendContactEmail } from "../ses";

const payload: ContactPayload = {
  category: "不具合・エラー",
  replyTo: "user@example.com",
  subject: "Map bug",
  message: "Details",
  website: ""
};

describe("SES contact adapter", () => {
  test("builds a signed request with destination, source, and message data", async () => {
    const request = await buildSesSendEmailRequest(payload, {
      region: "ap-northeast-1",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      fromEmail: "no-reply@quadrillionaaa.com",
      toEmail: "ai@quadrillion-ai.com"
    });

    expect(request.url).toBe("https://email.ap-northeast-1.amazonaws.com/");
    expect(request.body).toContain("Destination.ToAddresses.member.1=ai%40quadrillion-ai.com");
    expect(request.body).toContain("Source=no-reply%40quadrillionaaa.com");
    expect(request.body).toContain("Message.Subject.Data=%5B%E4%B8%8D%E5%85%B7%E5%90%88%E3%83%BB%E3%82%A8%E3%83%A9%E3%83%BC%5D+Map+bug");
    expect(request.headers.authorization.startsWith("AWS4-HMAC-SHA256")).toBe(true);
  });

  test("throws when SES returns a non-2xx response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("bad request", {
        status: 400
      })
    );

    await expect(
      sendContactEmail(
        payload,
        {
          region: "ap-northeast-1",
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key",
          fromEmail: "no-reply@quadrillionaaa.com",
          toEmail: "ai@quadrillion-ai.com"
        },
        fetchMock
      )
    ).rejects.toThrow("SES request failed with status 400");
  });
});
